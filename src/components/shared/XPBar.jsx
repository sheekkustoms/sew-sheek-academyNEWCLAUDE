import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export const DEFAULT_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

// Cache so all components share the same fetched thresholds
let _cachedThresholds = DEFAULT_THRESHOLDS;
let _cacheLoaded = false;

export async function loadThresholds(force = false) {
  if (_cacheLoaded && !force) return _cachedThresholds;
  try {
    const { base44 } = await import("@/api/base44Client");
    const settings = await base44.entities.LevelSettings.list();
    if (settings.length > 0 && settings[0].thresholds?.length > 0) {
      _cachedThresholds = settings[0].thresholds;
    }
  } catch {}
  _cacheLoaded = true;
  return _cachedThresholds;
}

export function getLevelFromXP(xp, thresholds = _cachedThresholds) {
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getXPForNextLevel(xp, thresholds = _cachedThresholds) {
  const level = getLevelFromXP(xp, thresholds);
  if (level >= thresholds.length) return { current: xp, needed: xp, percent: 100 };
  const currentLevelXP = thresholds[level - 1];
  const nextLevelXP = thresholds[level];
  const progress = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return { current: progress, needed, percent: Math.round((progress / needed) * 100) };
}

export default function XPBar({ xp = 0, showLevel = true, compact = false }) {
  const level = getLevelFromXP(xp);
  const { current, needed, percent } = getXPForNextLevel(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-fuchsia-600 font-bold text-sm">
          <Zap className="w-3.5 h-3.5" /> {xp} XP
        </div>
        <span className="text-xs text-gray-400">Lvl {level}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showLevel && (
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">LVL {level}</span>
          )}
          <span className="text-white/90 font-semibold text-sm flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> {xp} XP
          </span>
        </div>
        <span className="text-xs text-white/60">{current}/{needed} to next level</span>
      </div>
      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}