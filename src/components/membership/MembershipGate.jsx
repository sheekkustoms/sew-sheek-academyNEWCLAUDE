import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldOff, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DEFAULT_MESSAGE = "Your membership is currently inactive. Please contact administration or make sure your $99/month subscription is active on sewsheek.com.";
const OWNER_EMAIL = "sheek24kustoms@gmail.com";

// Only the true owner/coach bypasses — moderators do NOT
const isTrueAdmin = (user) => {
  if (!user) return false;
  if (user.email === OWNER_EMAIL) return true;
  if (user.role === "admin" && user.is_coach) return true;
  return false;
};

export default function MembershipGate({ user, children, allowInactive = false }) {
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["myMembership", user?.email],
    queryFn: () => base44.entities.MembershipStatus.filter({ user_email: user.email }),
    enabled: !!user?.email,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // True admin bypass — unless in member preview mode
  const isPreviewMode = localStorage.getItem("member_preview_mode") === "true";
  if (isTrueAdmin(user) && !isPreviewMode) return children;

  // allowInactive = Dashboard page — always let them through to see their status
  if (isLoading) return allowInactive ? children : null;

  const membership = memberships[0] || null;

  // Check for admin override (force disabled)
  const isForceDisabled = membership?.admin_override === true;

  // Calculate active status based on paid_through + 2-day grace period
  let isActive = false;
  if (!isForceDisabled && membership?.paid_through) {
    const graceDeadline = new Date(new Date(membership.paid_through).getTime() + 2 * 24 * 60 * 60 * 1000);
    isActive = new Date() <= graceDeadline;
  }

  // If active — always show content
  if (isActive) return children;

  // Dashboard gets a pass — it shows the INACTIVE badge itself
  if (allowInactive) return children;

  // Blocked page — show lockout screen
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-[#111] mb-3">Access Restricted</h2>
      <p className="text-sm text-[#666] max-w-md leading-relaxed mb-6">
        {isForceDisabled
          ? "Your account has been disabled. Please contact administration."
          : DEFAULT_MESSAGE}
      </p>
      <Link
        to={createPageUrl("Dashboard")}
        className="inline-flex items-center gap-2 bg-black text-[#D4AF37] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#222] transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}