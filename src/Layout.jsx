import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, BookOpen, Users, Trophy, Menu, X, LogOut,
  Zap, ChevronRight, Brain, Bell, Shield, Download, Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelFromXP } from "./components/shared/XPBar";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Courses", icon: BookOpen, page: "Courses" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
  { name: "Daily Challenges", icon: Brain, page: "DailyChallenges", highlight: true },
  { name: "Quiz Games", icon: Gamepad2, page: "QuizHome", highlight: true },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPWA, setShowPWA] = useState(() => !localStorage.getItem("pwa_dismissed"));

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const prevNotifIds = useRef(new Set());

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  // Toast new notifications that weren't there before
  useEffect(() => {
    if (!notifications.length) return;
    const newOnes = notifications.filter(n => !prevNotifIds.current.has(n.id));
    newOnes.forEach(n => {
      toast(n.message, {
        description: n.from_name ? `From: ${n.from_name}` : undefined,
        icon: n.type === "announcement" ? "📢" : n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "badge" ? "🏅" : "🔔",
        duration: 5000,
      });
    });
    notifications.forEach(n => prevNotifIds.current.add(n.id));
  }, [notifications]);

  const myPoints = userPoints?.[0];
  const level = getLevelFromXP(myPoints?.total_xp || 0);
  const unreadCount = notifications.length;
  const isAdmin = user?.role === "admin";

  const navItems = isAdmin
    ? [...NAV_ITEMS, { name: "Admin", icon: Shield, page: "AdminDashboard", admin: true }]
    : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-rose-50/30 text-gray-900">
      <style>{`
        :root {
          --background: 0 0% 98%;
          --foreground: 222 47% 11%;
          --card: 0 0% 100%;
          --card-foreground: 222 47% 11%;
          --popover: 0 0% 100%;
          --popover-foreground: 222 47% 11%;
          --primary: 262 83% 58%;
          --primary-foreground: 0 0% 100%;
          --secondary: 220 14% 96%;
          --secondary-foreground: 222 47% 11%;
          --muted: 220 14% 96%;
          --muted-foreground: 220 9% 30%;
          --accent: 220 14% 96%;
          --accent-foreground: 222 47% 11%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
          --border: 220 13% 91%;
          --input: 220 13% 91%;
          --ring: 262 83% 58%;
          --radius: 0.75rem;
        }
        body { background-color: #fff5f6; }
        * { box-sizing: border-box; }
      `}</style>

      {/* PWA install banner */}
      {showPWA && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Download className="w-4 h-4 shrink-0" />
            <span>Install this app on your phone for the best experience!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
              Install
            </Button>
            <button onClick={() => { setShowPWA(false); localStorage.setItem("pwa_dismissed", "1"); }} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm ${showPWA ? "top-10" : "top-0"}`}>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-gray-500">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-lg font-bold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">LearnXP</span>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Notifications")} className="relative">
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
          <div className="flex items-center gap-1 text-fuchsia-600 text-sm font-bold">
            <Zap className="w-4 h-4" /> {myPoints?.total_xp || 0}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 h-16 flex items-center justify-between border-b border-gray-100">
            <span className="text-xl font-extrabold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
              LearnXP
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User card */}
          {user && (
            <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-br from-pink-50 to-violet-50 border border-pink-100">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover border-2 border-pink-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || "Learner"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">LVL {level}</span>
                    <span className="text-fuchsia-600 text-[10px] font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {myPoints?.total_xp || 0}
                    </span>
                  </div>
                </div>
                <Link to={createPageUrl("Notifications")} className="relative shrink-0">
                  <Bell className="w-5 h-5 text-gray-400 hover:text-pink-500 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </Link>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-3 mt-5 space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-pink-500/10 to-violet-500/10 text-violet-700 border border-violet-200/50"
                      : item.admin
                        ? "text-red-500 hover:bg-red-50"
                        : item.highlight
                          ? "text-fuchsia-600 hover:bg-fuchsia-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-violet-600" : item.admin ? "text-red-500" : item.highlight ? "text-fuchsia-500" : "text-gray-400"}`} />
                  <span>{item.name}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto text-[9px] bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Daily</span>
                  )}
                  {item.admin && !isActive && (
                    <span className="ml-auto text-[9px] bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-bold uppercase">Admin</span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`lg:ml-64 min-h-screen ${showPWA ? "pt-24 lg:pt-10" : "pt-14 lg:pt-0"}`}>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}