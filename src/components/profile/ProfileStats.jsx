import React from "react";
import { BookOpen, CheckCircle2, Zap, MessageSquare } from "lucide-react";

const stats = (enrollmentsCount, completedCount, totalXP, postsCount) => [
  { icon: BookOpen,      label: "Enrolled",   value: enrollmentsCount },
  { icon: CheckCircle2,  label: "Completed",  value: completedCount },
  { icon: Zap,           label: "Points",     value: totalXP },
  { icon: MessageSquare, label: "Posts",      value: postsCount },
];

export default function ProfileStats({ enrollmentsCount, completedCount, totalXP, postsCount }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats(enrollmentsCount, completedCount, totalXP, postsCount).map(s => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
          <s.icon className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}