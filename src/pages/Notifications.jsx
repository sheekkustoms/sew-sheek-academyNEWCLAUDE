import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Heart, MessageCircle, Star, Megaphone, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { createPageUrl } from "@/utils";

const typeConfig = {
  like: { icon: Heart, color: "bg-pink-100 text-pink-500", label: "liked your post" },
  comment: { icon: MessageCircle, color: "bg-blue-100 text-blue-500", label: "commented on your post" },
  reply: { icon: MessageCircle, color: "bg-cyan-100 text-cyan-500", label: "replied to your comment" },
  badge: { icon: Star, color: "bg-amber-100 text-amber-500", label: "You earned a badge" },
  announcement: { icon: Megaphone, color: "bg-violet-100 text-violet-500", label: "Announcement" },
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [, setRefresh] = useState(0);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["allNotifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }),
    enabled: !!user?.email,
  });

  // Refresh timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => setRefresh(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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

  const sorted = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-violet-500" /> Notifications
          </h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-2 text-gray-600">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.announcement;
            const Icon = cfg.icon;

            const handleClick = async () => {
              if (!n.is_read) {
                await base44.entities.Notification.update(n.id, { is_read: true });
                queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }
              if (n.post_id) {
                window.location.href = createPageUrl("Community") + `?postId=${n.post_id}`;
              }
            };

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={handleClick}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  !n.is_read ? "bg-violet-50 border-violet-200" : "bg-white border-gray-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-full ${cfg.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{moment(n.created_date).fromNow()}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}