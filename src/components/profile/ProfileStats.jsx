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
    <div className="grid grid-cols-4 gap-3">
      {stats(enrollmentsCount, completedCount, totalXP, postsCount).map((s, i) => (
        <div key={s.label} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
          <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${i === 2 ? "text-[#D4AF37]" : "text-[#CFCFCF]"}`} />
          <p className="text-2xl font-extrabold text-[#111]">{s.value}</p>
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}