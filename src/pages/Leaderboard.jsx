import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Zap, Crown, Medal, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeaderboardRow from "../components/leaderboard/LeaderboardRow";
import { getLevelFromXP } from "../components/shared/XPBar";
import BadgeIcon from "../components/shared/BadgeIcon";

const TIMEFRAMES = [
  { key: "all", label: "All-Time" },
  { key: "monthly", label: "Monthly" },
  { key: "weekly", label: "Weekly" },
];

function isWithin(dateStr, days) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d >= cutoff;
}

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState("all");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 100),
  });

  // Filter by timeframe using last_activity_date as a proxy
  const filtered = allUsers.filter((u) => {
    if (timeframe === "all") return true;
    if (timeframe === "weekly") return isWithin(u.last_activity_date, 7);
    if (timeframe === "monthly") return isWithin(u.last_activity_date, 30);
    return true;
  });

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const myRank = filtered.findIndex((u) => u.user_email === user?.email) + 1;
  const myEntry = filtered.find((u) => u.user_email === user?.email);

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Compete with fellow learners and climb the ranks</p>
      </div>

      {/* Timeframe tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTimeframe(t.key)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              timeframe === t.key
                ? "bg-white text-violet-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Your rank */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-50 via-fuchsia-50 to-violet-50 border border-violet-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-pink-200">
                #{myRank || "—"}
              </div>
              <div>
                <p className="text-gray-900 font-bold">Your Ranking</p>
                <p className="text-sm text-gray-500">Level {getLevelFromXP(myEntry.total_xp || 0)} · {myEntry.streak_days || 0} day streak 🔥</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-1 text-fuchsia-600 font-bold text-xl">
                  <Zap className="w-5 h-5" /> {myEntry.total_xp || 0}
                </div>
                <span className="text-xs text-gray-400">Total XP</span>
              </div>
              {myEntry.badges?.length > 0 && (
                <div className="flex gap-1">
                  {myEntry.badges.slice(0, 4).map((badge) => (
                    <BadgeIcon key={badge} name={badge} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end">
          {[topThree[1], topThree[0], topThree[2]].map((entry, i) => {
            if (!entry) return <div key={i} />;
            const rank = [2, 1, 3][i];
            const heights = ["h-28", "h-36", "h-24"];
            const colors = ["from-gray-300 to-gray-400", "from-amber-400 to-yellow-300", "from-orange-400 to-amber-500"];
            const icons = [Medal, Crown, Medal];
            const Icon = icons[i];
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-bold mb-2 ring-2 ring-white shadow-md">
                  {(entry.user_name || entry.user_email || "?")[0].toUpperCase()}
                </div>
                <p className="text-sm font-bold text-gray-800 text-center truncate max-w-full mb-1">{entry.user_name || entry.user_email}</p>
                <div className="flex items-center gap-1 text-fuchsia-600 text-xs font-bold mb-2">
                  <Zap className="w-3 h-3" /> {entry.total_xp || 0}
                </div>
                <div className={`w-full ${heights[i]} bg-gradient-to-t ${colors[i]} rounded-t-2xl flex items-start justify-center pt-3 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white drop-shadow" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of list */}
      {isLoading ? (
        <div className="space-y-3">{Array(8).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : rest.length > 0 ? (
        <div className="space-y-2">
          {rest.map((entry, i) => (
            <LeaderboardRow key={entry.id} entry={entry} rank={i + 4} isCurrentUser={entry.user_email === user?.email} index={i} />
          ))}
        </div>
      ) : null}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No learners active in this period</p>
        </div>
      )}
    </div>
  );
}