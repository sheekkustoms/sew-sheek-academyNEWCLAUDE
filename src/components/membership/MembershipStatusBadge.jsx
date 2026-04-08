import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle } from "lucide-react";
import moment from "moment";

export default function MembershipStatusBadge({ userEmail }) {
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["myMembership", userEmail],
    queryFn: () => base44.entities.MembershipStatus.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-gray-50 border-gray-200 animate-pulse">
        <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    );
  }

  const membership = memberships[0] || null;
  const paidThrough = membership?.paid_through;

  // Admin override = force disabled
  if (membership?.admin_override) {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-orange-50 border-orange-200 text-orange-700 font-bold">
        <span className="text-lg">🚫</span>
        <span className="text-base">Membership Status: DISABLED</span>
      </div>
    );
  }

  // Calculate active status based on paid_through + 2-day grace period
  let isActive = false;
  if (paidThrough) {
    const graceDeadline = new Date(new Date(paidThrough).getTime() + 2 * 24 * 60 * 60 * 1000);
    isActive = new Date() <= graceDeadline;
  }

  return (
    <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border font-bold ${
      isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
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