import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, BookOpen, Users, Trophy, Menu, X, LogOut,
  Zap, ChevronRight, Brain, Bell, Shield, Download, Gamepad2, Video, Mail, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelFromXP } from "./components/shared/XPBar";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { playNotificationSound, requestNotificationPermission, sendBrowserNotification } from "@/components/shared/notificationSound";

const NAV_ITEMS = [
  { name: "Home", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Courses", icon: BookOpen, page: "Courses" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
  { name: "Live Room", icon: Video, page: "LiveClasses" },
  { name: "Profile", icon: User, page: "ProfileSettings" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPWA, setShowPWA] = useState(false);
  
  // Request notification permission on mount
  useEffect(() => {
    if (!localStorage.getItem("pwa_dismissed")) setShowPWA(true);
    
    // Request browser notification permission
    if (!localStorage.getItem("notif_permission_asked")) {
      requestNotificationPermission().then(() => {
        localStorage.setItem("notif_permission_asked", "1");
      });
    }
  }, []);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    gcTime: 0,
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
      // Play notification sound
      playNotificationSound();
      
      // Show in-app toast
      toast(n.message, {
        description: n.from_name ? `From: ${n.from_name}` : undefined,
        icon: n.type === "announcement" ? "📢" : n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "badge" ? "🏅" : "🔔",
        duration: 5000,
      });
      
      // Send browser notification if permitted
      if (n.type === "announcement") {
        sendBrowserNotification(n.message, {
          tag: n.id,
          requireInteraction: false,
        });
      }
      
      console.log("[Layout] New notification received and alerted:", {
        notificationId: n.id,
        type: n.type,
        message: n.message,
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
    <div className="min-h-screen bg-white text-gray-900">
      <Toaster position="top-right" richColors />
      <style>{`
        video, iframe {
          -webkit-user-select: none;
          user-select: none;
        }
        @media print {
          video, iframe, .no-print { display: none !important; }
        }
        :root {
          --gold: #D4A574;
          --gold-dark: #B8915E;
          --pink: #E8B4C8;
          --pink-dark: #D691B3;
          --black: #1A1A1A;
          --white: #FFFFFF;
          --gray-light: #F8F7F5;
          --gray-border: #E8DED4;
          --text-primary: #1A1A1A;
          --text-secondary: #6E625B;
          --background: 0 0% 100%;
          --foreground: 0 0% 10%;
          --card: 0 0% 100%;
          --card-foreground: 0 0% 10%;
          --popover: 0 0% 100%;
          --popover-foreground: 0 0% 10%;
          --primary: 0 0% 10%;
          --primary-foreground: 0 0% 100%;
          --secondary: 0 0% 97%;
          --secondary-foreground: 0 0% 10%;
          --muted: 0 0% 94%;
          --muted-foreground: 0 0% 45%;
          --accent: 0 0% 97%;
          --accent-foreground: 0 0% 10%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
          --border: 0 0% 90%;
          --input: 0 0% 97%;
          --ring: 0 0% 10%;
          --radius: 0.75rem;
        }
        body { background-color: #FFFFFF; }
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
            <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={async () => {
                if (deferredInstallPrompt) {
                  deferredInstallPrompt.prompt();
                  await deferredInstallPrompt.userChoice;
                  setDeferredInstallPrompt(null);
                  setShowPWA(false);
                  localStorage.setItem("pwa_dismissed", "1");
                } else {
                  alert("To install: tap the Share button in your browser, then 'Add to Home Screen'.");
                }
              }}
            >
              Install
            </Button>
            <button onClick={() => { setShowPWA(false); localStorage.setItem("pwa_dismissed", "1"); }} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className={`md:hidden fixed left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm ${showPWA ? "top-10" : "top-0"}`}>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-gray-600">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-lg font-bold text-gray-900">Oh Sew Sheek</span>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Notifications")} className="relative">
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
          <div className="flex items-center gap-1 text-gray-700 text-sm font-bold">
            <Zap className="w-4 h-4" /> {myPoints?.total_xp || 0}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 h-16 flex items-center justify-between border-b border-gray-200">
            <span className="text-xl font-bold text-gray-900">
              Oh Sew Sheek
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User card */}
          {user && (
            <div className="mx-4 mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover border border-gray-300" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.role === "admin" ? "Coach" : (user.full_name && user.full_name !== user.email ? user.full_name : "Member")}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">LVL {level}</span>
                    <span className="text-yellow-600 text-[10px] font-semibold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {myPoints?.total_xp || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-3 mt-6 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-yellow-50 text-gray-900 border border-yellow-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-yellow-600" : "text-gray-400"}`} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-yellow-600" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`md:ml-64 min-h-screen bg-white ${showPWA ? "pt-24 md:pt-10" : "pt-14 md:pt-0"}`}>
        <div className="p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}