import React from "react";

/**
 * Unified role badge component.
 * - "coach"     → gold badge (owner/main account posting as COACH)
 * - "moderator" → dark badge (any other admin user)
 * Pass isAdminPost + authorName to auto-resolve, or pass role="coach"|"moderator" directly.
 */
export function getRoleBadgeProps(isAdminPost, authorName) {
  if (!isAdminPost) return null;
  // The owner explicitly posts as "COACH" — all others are Moderators
  const isCoach = authorName === "COACH";
  return isCoach ? "coach" : "moderator";
}

const CONFIG = {
  coach: {
    label: "Coach",
    className: "bg-[#D4AF37]/15 text-[#B8960C] border border-[#D4AF37]/30",
  },
  moderator: {
    label: "Moderator",
    className: "bg-[#333]/10 text-[#444] border border-[#333]/15",
  },
};

export default function RoleBadge({ role }) {
  if (!role || !CONFIG[role]) return null;
  const { label, className } = CONFIG[role];
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}