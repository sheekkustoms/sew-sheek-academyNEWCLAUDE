import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, BookOpen, Users, Trophy, Menu, X, LogOut, Zap, ChevronRight, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelFromXP } from "./components/shared/XPBar";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Courses", icon: BookOpen, page: "Courses" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
  { name: "Daily Challenges", icon: Brain, page: "DailyChallenges", highlight: true },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myPoints = userPoints?.[0];
  const level = getLevelFromXP(myPoints?.total_xp || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 217.2 32.6% 8%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 238 73% 67%;
          --primary-foreground: 210 40% 98%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 238 73% 67%;
        }
        body { background-color: #020617; }
      `}</style>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-400">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">LearnXP</span>
        <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
          <Zap className="w-4 h-4" /> {myPoints?.total_xp || 0}
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 h-16 flex items-center justify-between border-b border-slate-800/50">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              LearnXP
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User card */}
          {user && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {(user.full_name || user.email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.full_name || "Learner"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">LVL {level}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {myPoints?.total_xp || 0} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-3 mt-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className={`w-4.5 h-4.5 ${isActive ? "text-indigo-400" : ""}`} />
                  {item.name}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400/50" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-slate-800/50">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
            >
              <LogOut className="w-4.5 h-4.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}