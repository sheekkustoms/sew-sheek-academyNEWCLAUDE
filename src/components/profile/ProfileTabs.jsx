import React, { useState } from "react";
import ProfileOverviewTab from "./ProfileOverviewTab";
import ProfileClassesTab from "./ProfileClassesTab";
import ProfileRewardsTab from "./ProfileRewardsTab";
import { Star, Lock } from "lucide-react";

const ALL_BADGES = [
  { id: "first_lesson", label: "First Stitch", emoji: "🪡", desc: "Complete your first lesson" },
  { id: "first_course", label: "Course Graduate", emoji: "🎓", desc: "Complete a full course" },
  { id: "streak_7", label: "Week Warrior", emoji: "🔥", desc: "7-day learning streak" },
  { id: "xp_500", label: "XP Collector", emoji: "⚡", desc: "Earn 500 XP" },
  { id: "xp_1000", label: "Power Stitcher", emoji: "💪", desc: "Earn 1,000 XP" },
  { id: "top_3", label: "Leaderboard Star", emoji: "⭐", desc: "Reach top 3 on leaderboard" },
];

function BadgesTab({ points }) {
  const earned = points?.badges || [];
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest">{earned.length} of {ALL_BADGES.length} badges earned</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_BADGES.map(badge => {
          const isEarned = earned.includes(badge.id) || earned.includes(badge.label);
          return (
            <div key={badge.id} className={`rounded-2xl p-4 text-center border transition-all ${
              isEarned
                ? "bg-gradient-to-br from-[#D4AF37]/10 to-amber-50 border-[#D4AF37]/30 shadow-sm"
                : "bg-[#F9F9F9] border-[#EEEEEE] opacity-50"
            }`}>
              <div className="text-3xl mb-2">{isEarned ? badge.emoji : "🔒"}</div>
              <p className={`text-xs font-bold ${isEarned ? "text-[#111]" : "text-[#AAA]"}`}>{badge.label}</p>
              <p className="text-[10px] text-[#999] mt-0.5">{badge.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS = [
  { value: "overview",   label: "Overview" },
  { value: "classes",    label: "Classes" },
  { value: "badges",     label: "Badges" },
  { value: "rewards",    label: "Rewards" },
];

export default function ProfileTabs({ targetEmail, enrollments, courses, posts, comments, points, currentUser }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 px-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === t.value
                ? "border-[#D4AF37] text-[#6B3FA0]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === "overview"  && <ProfileOverviewTab enrollments={enrollments} courses={courses} posts={posts} comments={comments} />}
        {tab === "classes"   && <ProfileClassesTab enrollments={enrollments} courses={courses} />}
        {tab === "badges"    && <BadgesTab points={points} />}
        {tab === "rewards"   && <ProfileRewardsTab points={points} targetEmail={targetEmail} />}
      </div>
    </div>
  );
}