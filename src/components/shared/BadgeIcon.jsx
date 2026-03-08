import React from "react";
import { Award, BookOpen, MessageSquare, Flame, Star, Trophy, Target, Rocket, Crown, Heart, Brain } from "lucide-react";

const BADGE_CONFIG = {
  "Quiz Master": { icon: Brain, color: "from-fuchsia-500 to-violet-500", description: "Score 5/5 on a Daily Challenge" },
  "First Lesson": { icon: BookOpen, color: "from-blue-500 to-cyan-400", description: "Complete your first lesson" },
  "Course Complete": { icon: Trophy, color: "from-amber-500 to-yellow-400", description: "Complete a full course" },
  "Community Star": { icon: Star, color: "from-purple-500 to-pink-400", description: "Create 5 community posts" },
  "Commenter": { icon: MessageSquare, color: "from-green-500 to-emerald-400", description: "Leave 10 comments" },
  "On Fire": { icon: Flame, color: "from-red-500 to-orange-400", description: "7-day streak" },
  "Sharpshooter": { icon: Target, color: "from-indigo-500 to-blue-400", description: "Complete 5 courses" },
  "Rocket Learner": { icon: Rocket, color: "from-violet-500 to-purple-400", description: "Reach Level 5" },
  "Legend": { icon: Crown, color: "from-yellow-500 to-amber-400", description: "Reach Level 10" },
  "Helpful": { icon: Heart, color: "from-pink-500 to-rose-400", description: "Get 20 likes on posts" },
};

export default function BadgeIcon({ name, size = "md" }) {
  const config = BADGE_CONFIG[name] || { icon: Award, color: "from-gray-400 to-gray-500", description: name };
  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";

  return (
    <div className="flex flex-col items-center gap-1" title={config.description}>
      <div className={`${sizeClasses} rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md`}>
        <Icon className={`${iconSize} text-white`} />
      </div>
      {size !== "sm" && <span className="text-[10px] text-gray-500 text-center leading-tight max-w-[60px]">{name}</span>}
    </div>
  );
}

export { BADGE_CONFIG };