import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldOff } from "lucide-react";

const DEFAULT_MESSAGE = "Your membership is currently inactive. Please contact administration or make sure your $99/month subscription is active on sewsheek.com.";

export default function MembershipGate({ user, children }) {
  const { data: settingsArr = [] } = useQuery({
    queryKey: ["membershipSettings"],
    queryFn: () => base44.entities.MembershipSettings.list(),
    staleTime: 60000,
  });

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["myMembership", user?.email],
    queryFn: () => base44.entities.MembershipStatus.filter({ user_email: user.email }),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  // Admin bypass — never lock out admins
  if (user?.role === "admin") return children;

  const settings = settingsArr[0] || null;
  const lockoutEnabled = settings?.lockout_enabled ?? false;

  // If lockout is off, always show content
  if (!lockoutEnabled) return children;

  if (isLoading) return children;

  const membership = memberships[0] || null;
  
  // Check for admin override (force disabled)
  if (membership?.admin_override) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-[#111] mb-2">Account Disabled</h2>
          <p className="text-sm text-[#666]">{settings?.inactive_message || "Your account has been disabled. Please contact administration."}</p>
        </div>
      </div>
    );
  }
  
  // Calculate active status based on paid_through + 2-day grace period
  let isActive = false;
  if (membership?.paid_through) {
    const paidThroughDate = new Date(membership.paid_through);
    const graceDeadline = new Date(paidThroughDate.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days
    isActive = new Date() <= graceDeadline;
  }

  if (isActive) return children;

  // Show lockout screen
  const message = settings?.inactive_message || DEFAULT_MESSAGE;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-[#111] mb-3">Membership Inactive</h2>
      <p className="text-sm text-[#666] max-w-md leading-relaxed">{message}</p>
    </div>
  );
}