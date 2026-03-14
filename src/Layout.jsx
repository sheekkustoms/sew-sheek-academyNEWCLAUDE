import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Register service worker for push notifications
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Layout] Service Worker or Push API not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Layout] Service Worker registered:', registration);

    // Subscribe to push notifications
    const permission = Notification.permission;
    if (permission === 'granted') {
      await subscribeUserToPush(registration);
    }
  } catch (error) {
    console.error('[Layout] Service Worker registration failed:', error);
  }
};

const subscribeUserToPush = async (registration) => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Fetch VAPID public key from backend
      const keyResponse = await base44.functions.invoke('getVAPIDPublicKey', {});
      const vapidPublicKey = keyResponse.data?.publicKey;
      console.log('[Layout] Creating push subscription...');
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined,
      });

      // Send subscription to server
      await base44.functions.invoke('subscribeToNotifications', {
        subscription: newSubscription.toJSON(),
      });

      console.log('[Layout] Push subscription successful');
    }
  } catch (error) {
    console.error('[Layout] Push subscription failed:', error);
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};
import {
  LayoutDashboard, BookOpen, Users, Trophy, Menu, X, LogOut,
  Zap, ChevronRight, Brain, Bell, Shield, Download, Gamepad2, Video, Mail, User, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelFromXP, loadThresholds } from "./components/shared/XPBar";
import { getDisplayName } from "@/components/shared/useDisplayName";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { playNotificationSound, requestNotificationPermission, sendBrowserNotification } from "@/components/shared/notificationSound";

const NAV_ITEMS = [
  { name: "Home", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Classes", icon: BookOpen, page: "Classes" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Live Room", icon: Video, page: "LiveClasses" },
  { name: "Quiz Games", icon: Gamepad2, page: "QuizHome" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
  { name: "Profile", icon: User, page: "MemberProfile" },
];

const BOTTOM_NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Dashboard" },
  { name: "Classes", icon: BookOpen, page: "Classes" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Profile", icon: User, page: "MemberProfile" },
];

// Pages that are "root" screens — show logo on mobile top bar; others show back button
const ROOT_PAGES = ["Dashboard", "Courses", "Classes", "Community", "Leaderboard", "LiveClasses", "MemberProfile", "QuizHome", "AdminDashboard"];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPWA, setShowPWA] = useState(false);
  
  // Request notification permission on mount
  useEffect(() => {
    if (!localStorage.getItem("pwa_dismissed")) setShowPWA(true);
    
    // Register service worker immediately, request permission if not done
    (async () => {
      try {
        await registerServiceWorker();
        
        // Request permission if not already asked
        if (!localStorage.getItem("notif_permission_asked")) {
          await requestNotificationPermission();
          localStorage.setItem("notif_permission_asked", "1");
          // Re-register after permission granted
          await registerServiceWorker();
        }
      } catch (error) {
        console.error('[Layout] Notification setup failed:', error);
      }
    })();
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
     refetchInterval: 5000, // Refetch auth to catch display_name updates
   });

   const displayName = getDisplayName(user);

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

  const [thresholds, setThresholds] = useState(null);
  useEffect(() => { loadThresholds(true).then(setThresholds); }, []);

  const myPoints = userPoints?.[0];
  const isAdmin = user?.role === "admin";
  const level = isAdmin ? 10 : (thresholds ? getLevelFromXP(myPoints?.total_xp || 0, thresholds) : getLevelFromXP(myPoints?.total_xp || 0));
  const displayXP = isAdmin && thresholds && thresholds[9] ? thresholds[9] : (myPoints?.total_xp || 0);
  const unreadCount = notifications.length;

  const navItems = isAdmin
    ? [...NAV_ITEMS, { name: "Admin", icon: Shield, page: "AdminDashboard", admin: true }]
    : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111]">
      <Toaster position="top-right" richColors />
      <style>{`
        video, iframe { -webkit-user-select: none; user-select: none; }
        button, a, nav, [role="navigation"] { -webkit-user-select: none; user-select: none; }
        .bottom-nav-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* PWA install banner */}
      {showPWA && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-black text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Download className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>Install the SEW SHEEK app on your phone for the best experience!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="h-7 text-xs bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold border-0"
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
            <button onClick={() => { setShowPWA(false); localStorage.setItem("pwa_dismissed", "1"); }} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div
        className={`md:hidden fixed left-0 right-0 z-50 bg-black px-4 flex items-center justify-between select-none ${showPWA ? "top-10" : "top-0"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", height: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
      >
        {ROOT_PAGES.includes(currentPageName) ? (
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={() => window.history.back()} className="text-white p-1">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}
        <span className="text-base font-bold text-white tracking-wide">SEW SHEEK</span>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Notifications")} className="relative">
            <Bell className="w-5 h-5 text-white/70" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
          <div className="flex items-center gap-1 text-[#D4AF37] text-sm font-bold">
            <Zap className="w-3.5 h-3.5" /> {displayXP}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-black border-r border-white/10 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 h-16 flex items-center justify-between border-b border-white/10">
            <span className="text-lg font-bold text-white tracking-widest uppercase">SEW SHEEK</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User card */}
          {user && (
            <div className="mx-4 mt-5 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D4AF37]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-sm ring-2 ring-[#D4AF37]/50">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full font-semibold">LVL {level}</span>
                    <span className="text-[#D4AF37] text-[10px] font-semibold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {displayXP} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-3 mt-6 space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#D4AF37] text-black"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-black" : "text-white/40"}`} />
                  <span>{item.name}</span>
                  {item.admin && !isActive && <span className="ml-auto text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full font-semibold">ADMIN</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`md:ml-64 min-h-screen bg-[#F5F5F5] ${showPWA ? "pt-24 md:pt-10" : "pt-14 md:pt-0"}`}>
        {/* Desktop notification bell */}
        <div className="hidden md:block fixed top-5 right-6 z-40">
          <Link to={createPageUrl("Notifications")} className="relative inline-block">
            <div className="p-2 rounded-lg bg-white border border-[#CFCFCF] hover:border-[#D4AF37] transition-colors shadow-sm">
              <Bell className="w-5 h-5 text-[#333]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </div>
          </Link>
        </div>
        <div className="p-5 md:p-8 lg:p-10 pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 bottom-nav-safe select-none">
        <div className="flex items-stretch">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={(e) => {
                  if (isActive) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-[#D4AF37]" : "text-white/40"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : "text-white/40"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}