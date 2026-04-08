import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle } from "lucide-react";
import moment from "moment";

export default function MembershipStatusBadge({ userEmail }) {
  const { data: memberships = [] } = useQuery({
    queryKey: ["myMembership", userEmail],
    queryFn: () => base44.entities.MembershipStatus.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 60000,
  });

  const membership = memberships[0] || null;
  const paidThrough = membership?.paid_through;
  
  // Check for admin override (force disabled)
  if (membership?.admin_override) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 border border-orange-200">
        <span className="text-orange-600 text-xs">🚫</span>
        <span className="text-xs font-semibold text-orange-700">Disabled</span>
      </div>
    );
  }
  
  // Calculate active status based on paid_through + 2-day grace period
  let isActive = false;
  if (paidThrough) {
    const paidThroughDate = new Date(paidThrough);
    const graceDeadline = new Date(paidThroughDate.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days
    isActive = new Date() <= graceDeadline;
  }

  return (
    <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold ${
      isActive
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-red-50 border-red-200 text-red-600"
    }`}>
      {isActive
        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
        : <XCircle className="w-5 h-5 shrink-0" />
      }
      <span className="text-base">Membership Status: {isActive ? "ACTIVE ✓" : "INACTIVE"}</span>
      {paidThrough && (
        <span className={`text-xs font-semibold ml-auto ${isActive ? "text-green-600" : "text-red-500"}`}>
          {isActive ? "Paid through:" : "Expired:"} {moment(paidThrough).format("MMMM D, YYYY")}
        </span>
      )}
    </div>
  );
}