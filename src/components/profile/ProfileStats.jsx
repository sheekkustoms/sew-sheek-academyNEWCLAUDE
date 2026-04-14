import React from "react";
import { BookOpen, CheckCircle2, Zap, MessageSquare } from "lucide-react";

const stats = (enrollmentsCount, completedCount, totalXP, postsCount) => [
  { icon: BookOpen,      label: "Enrolled",   value: enrollmentsCount },
  { icon: CheckCircle2,  label: "Completed",  value: completedCount },
  { icon: Zap,           label: "Points",     value: totalXP },
  { icon: MessageSquare, label: "Posts",      value: postsCount },
];

const STAT_STYLES = [
  { bg: "bg-white", border: "border-[#EEEEEE]", iconBg: "bg-[#6B3FA0]/10", iconColor: "text-[#6B3FA0]" },
  { bg: "bg-white", border: "border-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { bg: "bg-gradient-to-br from-[#D4AF37]/15 to-amber-50", border: "border-[#D4AF37]/30", iconBg: "bg-[#D4AF37]/20", iconColor: "text-[#B8960C]" },
  { bg: "bg-white", border: "border-[#EEEEEE]", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
];

export default function ProfileStats({ enrollmentsCount, completedCount, totalXP, postsCount }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats(enrollmentsCount, completedCount, totalXP, postsCount).map((s, i) => {
        const style = STAT_STYLES[i];
        return (
          <div key={s.label} className={`${style.bg} border ${style.border} rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all`}>
            <div className={`w-9 h-9 rounded-xl ${style.iconBg} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-5 h-5 ${style.iconColor}`} />
            </div>
            <p className="text-2xl font-extrabold text-[#111]">{s.value}</p>
            <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}