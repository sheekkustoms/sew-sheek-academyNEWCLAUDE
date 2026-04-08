import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Shield, ShieldOff, Save, RefreshCw, AlertTriangle } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

export default function MembershipBillingPanel() {
  const queryClient = useQueryClient();
  const [savingSettings, setSavingSettings] = useState(false);

  // Load global settings
  const { data: settingsArr = [] } = useQuery({
    queryKey: ["membershipSettings"],
    queryFn: () => base44.entities.MembershipSettings.list(),
  });
  const settings = settingsArr[0] || null;

  const [lockoutEnabled, setLockoutEnabled] = useState(null);
  const [inactiveMessage, setInactiveMessage] = useState(null);

  // Sync local state when settings load
  React.useEffect(() => {
    if (settings && lockoutEnabled === null) setLockoutEnabled(settings.lockout_enabled ?? false);
    if (settings && inactiveMessage === null) setInactiveMessage(settings.inactive_message ?? "Your membership is currently inactive. Please contact administration or make sure your $99/month subscription is active on sewsheek.com.");
  }, [settings]);

  const effectiveLockout = lockoutEnabled ?? settings?.lockout_enabled ?? false;
  const effectiveMessage = inactiveMessage ?? settings?.inactive_message ?? "Your membership is currently inactive. Please contact administration or make sure your $99/month subscription is active on sewsheek.com.";

  // Load all users & membership statuses
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForBilling"],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["allMemberships"],
    queryFn: () => base44.entities.MembershipStatus.list(),
  });

  const nonAdminUsers = allUsers.filter(u => u.role !== "admin");

  const getMembership = (email) => memberships.find(m => m.user_email === email) || null;

  const saveSettings = async () => {
    setSavingSettings(true);
    const payload = { lockout_enabled: effectiveLockout, inactive_message: effectiveMessage, label: "default" };
    if (settings) {
      await base44.entities.MembershipSettings.update(settings.id, payload);
    } else {
      await base44.entities.MembershipSettings.create(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["membershipSettings"] });
    toast.success("Settings saved");
    setSavingSettings(false);
  };

  // Helper to calculate if member is active based on paid_through + 2-day grace
  const isActiveByDate = (m) => {
    if (!m?.paid_through) return false;
    const paidThroughDate = new Date(m.paid_through);
    const graceDeadline = new Date(paidThroughDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    return new Date() <= graceDeadline;
  };

  // Calculate next due date (1st of next month)
  const getNextDueDate = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 1);
  };

  const setPaidThrough = async (user, date) => {
    const existing = getMembership(user.email);
    if (existing) {
      await base44.entities.MembershipStatus.update(existing.id, { paid_through: date });
    } else {
      await base44.entities.MembershipStatus.create({ user_email: user.email, user_name: user.full_name || user.email, paid_through: date });
    }
    queryClient.invalidateQueries({ queryKey: ["allMemberships"] });
    toast.success(`Paid through date updated for ${user.full_name || user.email}`);
  };

  const toggleForceDisable = async (user) => {
    const existing = getMembership(user.email);
    if (existing) {
      const newOverride = !existing.admin_override;
      await base44.entities.MembershipStatus.update(existing.id, { admin_override: newOverride, is_active: !newOverride });
    } else {
      await base44.entities.MembershipStatus.create({ user_email: user.email, user_name: user.full_name || user.email, admin_override: true, is_active: false });
    }
    queryClient.invalidateQueries({ queryKey: ["allMemberships"] });
    toast.success(`${user.full_name || user.email} ${existing?.admin_override ? "re-enabled" : "force disabled"}`);
  };

  // Updated helper: respects admin_override
  const getEffectiveStatus = (m) => {
    if (m?.admin_override) return false; // Force disabled
    return isActiveByDate(m);
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#D4AF37]" /> Membership Settings
        </h3>

        {/* Lockout toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-800">Lockout Feature</p>
            <p className="text-xs text-gray-500">Block inactive members from accessing the dashboard</p>
          </div>
          <button
            onClick={() => setLockoutEnabled(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${effectiveLockout ? "bg-red-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${effectiveLockout ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {effectiveLockout && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">Lockout is ON — inactive members will see the message below instead of the dashboard.</p>
          </div>
        )}

        {/* Inactive message */}
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1 block">Message shown to inactive members</label>
          <Textarea
            value={effectiveMessage}
            onChange={e => setInactiveMessage(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        <Button onClick={saveSettings} disabled={savingSettings} className="bg-black text-[#D4AF37] hover:bg-[#222] gap-2">
          <Save className="w-4 h-4" /> {savingSettings ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Member List */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" /> Member Billing Status
            </h3>
            <p className="text-xs text-gray-400 mt-1">Manually manage billing status. Stripe will auto-update these when payments are received.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Next Due Date</p>
            <p className="text-sm font-bold text-gray-800">{moment(getNextDueDate()).format("MMM Do")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : nonAdminUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No members found.</p>
        ) : (
          <div className="space-y-2">
            {nonAdminUsers.map(user => {
              const m = getMembership(user.email);
              const isActive = m?.is_active ?? false;
              const paidThrough = m?.paid_through || "";

              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs shrink-0">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    {m?.stripe_status && (
                      <p className="text-xs text-gray-400">Stripe: <span className="font-medium">{m.stripe_status}</span></p>
                    )}
                    {m?.admin_override && <p className="text-xs text-amber-500">⚠ Admin override active</p>}
                  </div>

                  {/* Paid through date */}
                  <div className="hidden sm:flex flex-col items-center gap-0.5">
                    <p className="text-[10px] text-gray-400 uppercase">Paid Through</p>
                    <input
                      type="date"
                      value={paidThrough}
                      onChange={e => setPaidThrough(user, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {/* Status badge + force disable toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getEffectiveStatus(m) ? "bg-green-100 text-green-700" : m?.admin_override ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-600"}`}>
                      {m?.admin_override ? "Disabled" : getEffectiveStatus(m) ? "Active" : "Expired"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleForceDisable(user)}
                      className={`h-7 gap-1 text-[10px] ${m?.admin_override ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
                    >
                      {m?.admin_override ? "Re-enable" : "Force Disable"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}