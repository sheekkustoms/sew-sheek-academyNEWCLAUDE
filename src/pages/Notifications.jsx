import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Heart, MessageCircle, Star, Megaphone, CheckCheck, BookOpen, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RelativeTime from "@/components/shared/RelativeTime";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const typeConfig = {
  like:         { icon: Heart,         color: "bg-pink-100 text-pink-500",     label: "liked your post" },
  comment:      { icon: MessageCircle, color: "bg-blue-100 text-blue-500",     label: "commented on your post" },
  reply:        { icon: MessageCircle, color: "bg-cyan-100 text-cyan-500",     label: "replied to your comment" },
  message:      { icon: MessageCircle, color: "bg-emerald-100 text-emerald-600", label: "sent you a message" },
  badge:        { icon: Star,          color: "bg-amber-100 text-amber-500",   label: "You earned a badge" },
  announcement: { icon: Megaphone,     color: "bg-violet-100 text-violet-500", label: "Announcement" },
  lesson:       { icon: BookOpen,      color: "bg-green-100 text-green-600",   label: "New lesson" },
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["allNotifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const markOne = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleClick = async (n) => {
    if (!n.is_read) {
      markOne.mutate(n.id);
    }
    if (n.type === "message") {
      navigate(createPageUrl("Messages"));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayed = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#D4AF37]" /> Notifications
          </h1>
          <p className="text-sm text-[#999] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="gap-1.5 text-xs border-gray-200"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "unread"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? "bg-black text-[#D4AF37]"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-300 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {displayed.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.announcement;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-sm ${
                    !n.is_read
                      ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 hover:border-[#D4AF37]/50"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold text-[#111]" : "font-medium text-gray-700"}`}>
                      {n.message}
                    </p>
                    {n.from_name && (
                      <p className="text-xs text-gray-400 mt-0.5">from {n.from_name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      <RelativeTime date={n.created_date} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1" />
                        <button
                          onClick={(e) => { e.stopPropagation(); markOne.mutate(n.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}