import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Menu, X, Bell, Zap, LogOut, Shield, ChevronDown,
  Download, User, Gamepad2, Trophy, Video
} from "lucide-react";
import { getLevelFromXP, loadThresholds } from "./components/shared/XPBar";
import { getDisplayName } from "@/components/shared/useDisplayName";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { playNotificationSound, requestNotificationPermission, sendBrowserNotification } from "@/components/shared/notificationSound";

// Service worker / push registration
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (Notification.permission === 'granted') await subscribeUserToPush(registration);
    return registration;
  } catch (e) {
    console.error('[SW] Registration failed:', e);
  }
};

const subscribeUserToPush = async (registration) => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const keyResponse = await base44.functions.invoke('getVAPIDPublicKey', {});
      const vapidPublicKey = keyResponse.data?.publicKey;
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined,
      });
      await base44.functions.invoke('subscribeToNotifications', { subscription: newSubscription.toJSON() });
    }
  } catch {}
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};

// Main nav items (visible to all)
const NAV_ITEMS = [
  { label: "Home",    page: "Dashboard" },
  { label: "Classes", page: "Classes" },
  { label: "Profile", page: "MemberProfile" },
];

// Admin-only dropdown items
const ADMIN_ITEMS = [
  { label: "Admin Dashboard", page: "AdminDashboard", icon: Shield },
  { label: "Leaderboard",     page: "Leaderboard",    icon: Trophy },
  { label: "Quiz Games",      page: "QuizHome",       icon: Gamepad2 },
  { label: "Live Room",       page: "LiveClasses",    icon: Video },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showPWA, setShowPWA] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const avatarRef = useRef(null);
  const prevNotifIds = useRef(new Set());

  useEffect(() => {
    if (!localStorage.getItem("pwa_dismissed")) setShowPWA(true);
    (async () => {
      try {
        const reg = await registerServiceWorker();
        if (!localStorage.getItem("notif_permission_asked")) {
          const permission = await requestNotificationPermission();
          localStorage.setItem("notif_permission_asked", "1");
          // If granted now, subscribe immediately
          if (permission === 'granted' && reg) {
            await subscribeUserToPush(reg);
          } else {
            // Try again in case SW wasn't ready first time
            await registerServiceWorker();
          }
        } else if (Notification.permission === 'granted') {
          // Already granted — make sure subscription is stored
          if (reg) await subscribeUserToPush(reg);
        }
      } catch (e) {
        console.error('[Push setup]', e);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { loadThresholds(true).then(setThresholds); }, []);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    refetchInterval: 5000,
  });

  const displayName = getDisplayName(user);

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!notifications.length) return;
    const newOnes = notifications.filter(n => !prevNotifIds.current.has(n.id));
    newOnes.forEach(n => {
      playNotificationSound();
      toast(n.message, {
        description: n.from_name ? `From: ${n.from_name}` : undefined,
        icon: n.type === "announcement" ? "📢" : n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "badge" ? "🏅" : "🔔",
        duration: 5000,
      });
      if (n.type === "announcement") sendBrowserNotification(n.message, { tag: n.id });
    });
    notifications.forEach(n => prevNotifIds.current.add(n.id));
  }, [notifications]);

  const isAdmin = user?.role === "admin";
  const myPoints = userPoints?.[0];
  const level = isAdmin ? 10 : (thresholds ? getLevelFromXP(myPoints?.total_xp || 0, thresholds) : getLevelFromXP(myPoints?.total_xp || 0));
  const displayXP = isAdmin && thresholds && thresholds[9] ? thresholds[9] : (myPoints?.total_xp || 0);
  const unreadCount = notifications.length;

  const pwaHeight = showPWA ? "h-10" : "h-0";

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111]">
      <Toaster position="top-right" richColors />
      <style>{`
        video, iframe { -webkit-user-select: none; user-select: none; }
        button, a, nav, [role="navigation"] { -webkit-user-select: none; user-select: none; }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* PWA Install Banner */}
      {showPWA && (
        <div className="fixed top-0 left-0 right-0 z-[110] h-10 bg-black text-white px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Download className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span>Install the SEW SHEEK app for the best experience!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-xs bg-[#D4AF37] text-black font-bold px-3 py-1 rounded-lg"
              onClick={async () => {
                if (deferredInstallPrompt) {
                  deferredInstallPrompt.prompt();
                  await deferredInstallPrompt.userChoice;
                  setDeferredInstallPrompt(null);
                }
                setShowPWA(false);
                localStorage.setItem("pwa_dismissed", "1");
              }}
            >Install</button>
            <button onClick={() => { setShowPWA(false); localStorage.setItem("pwa_dismissed", "1"); }}>
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* ── TOP NAVIGATION BAR ── */}
      <header
        className={`fixed left-0 right-0 z-50 bg-black border-b border-white/10 ${showPWA ? "top-10" : "top-0"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center h-14 gap-6">

          {/* Logo */}
          <Link to={createPageUrl("Dashboard")} className="text-white font-extrabold tracking-widest text-sm uppercase shrink-0 mr-2">
            SEW SHEEK
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`relative px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    isActive ? "text-[#D4AF37]" : "text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#D4AF37] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* XP pill — desktop */}
            <div className="hidden md:flex items-center gap-1 text-[#D4AF37] text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />{displayXP} XP
            </div>

            {/* Notifications bell */}
            <Link to={createPageUrl("Notifications")} className="relative p-1.5">
              <Bell className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar / dropdown */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(v => !v)}
                className="flex items-center gap-1.5 group"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#D4AF37] transition-all" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs ring-2 ring-white/10 group-hover:ring-[#D4AF37] transition-all">
                    {(user?.full_name || user?.email)?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform hidden md:block ${avatarOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#EEEEEE] rounded-2xl shadow-xl overflow-hidden z-[200]">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-[#F5F5F5]">
                    <p className="text-sm font-bold text-[#111] truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-[#D4AF37]/10 text-[#B8960C] px-1.5 py-0.5 rounded-full font-bold">LVL {level}</span>
                      <span className="text-[10px] text-[#999]">{displayXP} XP</span>
                    </div>
                  </div>

                  {/* Profile link */}
                  <Link
                    to={createPageUrl("MemberProfile")}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#999]" /> My Profile
                  </Link>

                  {/* Admin-only links */}
                  {isAdmin && (
                    <>
                      <div className="px-4 pt-2 pb-1">
                        <p className="text-[9px] font-bold text-[#CFCFCF] uppercase tracking-widest">Admin</p>
                      </div>
                      {ADMIN_ITEMS.map(item => (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5] transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-[#D4AF37]" /> {item.label}
                        </Link>
                      ))}
                    </>
                  )}

                  <div className="border-t border-[#F5F5F5]">
                    <button
                      onClick={() => base44.auth.logout()}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#E74C3C] hover:bg-[#F5F5F5] transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-black h-full flex flex-col ml-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
              <span className="text-white font-extrabold tracking-widest text-sm uppercase">SEW SHEEK</span>
              <button onClick={() => setMobileOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D4AF37]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-sm">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full font-bold">LVL {level}</span>
                    <span className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {displayXP} XP
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main nav */}
            <nav className="flex-1 px-3 mt-4 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? "bg-[#D4AF37] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Admin section */}
              {isAdmin && (
                <>
                  <div className="px-4 pt-4 pb-1">
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Admin</p>
                  </div>
                  {ADMIN_ITEMS.map(item => {
                    const isActive = currentPageName === item.page;
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive ? "bg-[#D4AF37] text-black" : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Sign out */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all w-full"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      <main className={`min-h-screen bg-[#F5F5F5] ${showPWA ? "pt-24" : "pt-14"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}