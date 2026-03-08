import React from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Zap, Flame, BookOpen } from "lucide-react";
import { getLevelFromXP } from "../shared/XPBar";
import BadgeIcon from "../shared/BadgeIcon";

export default function LeaderboardRow({ entry, rank, isCurrentUser, index = 0 }) {
  const level = getLevelFromXP(entry.total_xp || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isCurrentUser
          ? "bg-gradient-to-r from-pink-50 to-violet-50 border-violet-200"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="w-8 flex justify-center">
        <span className="text-sm font-bold text-gray-400">#{rank}</span>
      </div>

      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
        {(entry.user_name || entry.user_email || "?")[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 truncate">{entry.user_name || entry.user_email}</span>
          {isCurrentUser && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {entry.courses_completed || 0} courses</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {entry.streak_days || 0}d streak</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {entry.badges?.slice(0, 3).map((badge, i) => <BadgeIcon key={i} name={badge} size="sm" />)}
      </div>

      <div className="text-right shrink-0 ml-1">
        <div className="flex items-center gap-1 text-fuchsia-600 font-bold">
          <Zap className="w-4 h-4" /> {entry.total_xp || 0}
        </div>
        <span className="text-[10px] text-gray-400">LVL {level}</span>
      </div>
    </motion.div>
  );
}