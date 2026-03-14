import React from "react";

/**
 * Unified role badge component.
 * - "coach"     → gold badge (the primary admin / owner)
 * - "moderator" → dark badge (any other admin user)
 * Pass isAdminPost + authorEmail + currentUserEmail to auto-resolve,
 * or pass role="coach"|"moderator" directly.
 */
/**
 * Pass the author's actual role ("admin") and optionally a flag to force "coach".
 * - authorRole === "admin" with no override → "coach"
 * - explicitly passing forceCoach=false → "moderator"
 * Legacy: if called with (isAdminPost, authorEmail, currentUserEmail) it falls back
 * to the old viewer-relative logic only as a last resort.
 */
export function getRoleBadgeProps(isAdminPost, authorRole, _unused) {
  if (!isAdminPost) return null;
  // authorRole here is the actual role string from the User entity
  if (authorRole === "admin") return "coach";
  return "moderator";
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