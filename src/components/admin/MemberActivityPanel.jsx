import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, User, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function MemberActivityPanel() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersActivity"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 500),
    refetchInterval: 30000,
  });

  const nonAdminUsers = allUsers.filter(u => u.role !== "admin");

  // Group logs by user email
  const logsByUser = {};
  logs.forEach(log => {
    if (!logsByUser[log.user_email]) logsByUser[log.user_email] = [];
    logsByUser[log.user_email].push(log);
  });

  // Build summary per user
  const userSummaries = nonAdminUsers.map(user => {
    const userLogs = logsByUser[user.email] || [];
    const lastLog = userLogs[0] || null; // already sorted by -created_date
    return { user, logs: userLogs, lastActive: lastLog?.created_date || null };
  }).sort((a, b) => {
    // Sort by last active descending, never-active at bottom
    if (!a.lastActive && !b.lastActive) return 0;
    if (!a.lastActive) return 1;
    if (!b.lastActive) return -1;
    return new Date(b.lastActive) - new Date(a.lastActive);
  });

  const filtered = userSummaries.filter(({ user }) =>
    !search || user.full_name?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pageColors = {
    Dashboard: "bg-blue-100 text-blue-700",
    LiveClassesHub: "bg-red-100 text-red-700",
    ReplaysHub: "bg-orange-100 text-orange-700",
    TutorialsHub: "bg-violet-100 text-violet-700",
    Classes: "bg-yellow-100 text-yellow-700",
    MemberProfile: "bg-green-100 text-green-700",
    Community: "bg-pink-100 text-pink-700",
    QuizHome: "bg-indigo-100 text-indigo-700",
    QuizGame: "bg-indigo-100 text-indigo-700",
    DailyChallenges: "bg-teal-100 text-teal-700",
  };

  const getPageColor = (page) => pageColors[page] || "bg-gray-100 text-gray-600";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Member Activity Tracker
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Real-time page visits and last active status for all members</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full border border-blue-100">
          {logs.length} total events
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No members found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ user, logs: userLogs, lastActive }) => {
            const isExpanded = expanded === user.email;
            const recentPage = userLogs[0]?.page || null;

            return (
              <div key={user.email} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {/* Row Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : user.email)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-sm shrink-0">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {lastActive ? `Last active ${moment(lastActive).fromNow()}` : "Never visited"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {recentPage && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPageColor(recentPage)}`}>
                        {recentPage}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-semibold">{userLogs.length} visits</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Log */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
                    {userLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No activity recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {userLogs.slice(0, 100).map((log, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getPageColor(log.page)}`}>
                              {log.page}
                            </span>
                            <span className="text-xs text-gray-600 flex-1 truncate">
                              {log.details || log.action}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {moment(log.created_date).format("MMM D, h:mm A")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}