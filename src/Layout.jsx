import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Menu, X, Bell, LogOut, Shield, ChevronDown,
  Download, LayoutDashboard, Radio, PlayCircle, BookOpen, GraduationCap, TrendingUp, Settings, User
} from "lucide-react";
import { getDisplayName } from "@/components/shared/useDisplayName";
import { Toaster } from "@/components/ui/sonner";

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (e) {}
};

const NAV_ITEMS = [
  { label: "Dashboard",    page: "Dashboard",     icon: LayoutDashboard },
  { label: "Live Classes", page: "LiveClassesHub", icon: Radio },
  { label: "Replays",      page: "ReplaysHub",     icon: PlayCircle },
  { label: "Tutorials",    page: "TutorialsHub",   icon: BookOpen },
  { label: "Courses",      page: "Classes",        icon: GraduationCap },
  { label: "My Progress",  page: "MemberProfile",  icon: TrendingUp },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showPWA, setShowPWA] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("pwa_dismissed")) setShowPWA(true);
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }),
    enabled: !!user?.email,
    refetchInterval: 60000,
  });

  const displayName = getDisplayName(user);
  const isAdmin = user?.role === "admin";
  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111]">
      <Toaster position="top-right" richColors />
      <style>{`
        video, iframe { -webkit-user-select: none; user-select: none; }
        button, a, nav { -webkit-user-select: none; user-select: none; }
        @media (display-mode: picture-in-picture) { body { display: none !important; } }
        video::-webkit-media-controls-download-button { display: none !important; }
      `}</style>

      {/* PWA Banner */}
      {showPWA && (
        <div className="fixed top-0 left-0 right-0 z-[110] h-10 bg-black text-white px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Download className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span>Install the app for the best experience!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="text-xs bg-[#D4AF37] text-black font-bold px-3 py-1 rounded-lg" onClick={async () => {
              if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; setDeferredInstallPrompt(null); }
              setShowPWA(false); localStorage.setItem("pwa_dismissed", "1");
            }}>Install</button>
            <button onClick={() => { setShowPWA(false); localStorage.setItem("pwa_dismissed", "1"); }}>
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className={`fixed left-0 right-0 z-50 bg-black border-b border-white/10 ${showPWA ? "top-10" : "top-0"}`} style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center h-14 gap-6">
          <Link to={createPageUrl("Dashboard")} className="text-white font-extrabold tracking-widest text-sm uppercase shrink-0">
            SEW SHEEK
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link key={item.page} to={createPageUrl(item.page)}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${isActive ? "text-[#D4AF37]" : "text-white/60 hover:text-white"}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#D4AF37] rounded-full" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <Link to={createPageUrl("Notifications")} className="relative p-1.5">
              <Bell className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={avatarRef}>
              <button onClick={() => setAvatarOpen(v => !v)} className="flex items-center gap-1.5 group">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#D4AF37] transition-all" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs">
                    {(user?.full_name || user?.email)?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 hidden md:block transition-transform ${avatarOpen ? "rotate-180" : ""}`} />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#EEEEEE] rounded-2xl shadow-xl overflow-hidden z-[200]">
                  <div className="px-4 py-3 border-b border-[#F5F5F5]">
                    <p className="text-sm font-bold text-[#111] truncate">{displayName}</p>
                    <p className="text-xs text-[#999] truncate">{user?.email}</p>
                  </div>
                  <Link to={createPageUrl("ProfileSettings")} onClick={() => setAvatarOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5]">
                    <Settings className="w-4 h-4 text-[#999]" /> Settings
                  </Link>
                  <Link to={createPageUrl("MemberProfile")} onClick={() => setAvatarOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5]">
                    <User className="w-4 h-4 text-[#999]" /> My Profile
                  </Link>
                  {isAdmin && (
                    <Link to={createPageUrl("AdminDashboard")} onClick={() => setAvatarOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#D4AF37] hover:bg-[#F5F5F5]">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-[#F5F5F5]">
                    <button onClick={() => base44.auth.logout()} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#E74C3C] hover:bg-[#F5F5F5] w-full">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-1.5 text-white/70 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-black h-full flex flex-col ml-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
              <span className="text-white font-extrabold tracking-widest text-sm uppercase">SEW SHEEK</span>
              <button onClick={() => setMobileOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
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
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <nav className="flex-1 px-3 mt-4 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const isActive = currentPageName === item.page;
                return (
                  <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-[#D4AF37] text-black" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to={createPageUrl("AdminDashboard")} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-white/5 transition-all"
                >
                  <Shield className="w-4 h-4 shrink-0" /> Admin Panel
                </Link>
              )}
            </nav>
            <div className="p-3 border-t border-white/10">
              <button onClick={() => base44.auth.logout()} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all w-full">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className={`min-h-screen bg-[#F5F5F5] ${showPWA ? "pt-24" : "pt-14"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}