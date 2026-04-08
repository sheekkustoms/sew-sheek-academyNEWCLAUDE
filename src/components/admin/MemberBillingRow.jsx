import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import moment from "moment";

export default function MemberBillingRow({ user, membership, onApplyMonths, onToggleForceDisable, getEffectiveStatus }) {
  const [selectedMonths, setSelectedMonths] = useState(1);

  const paidThrough = membership?.paid_through || "";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs shrink-0">
        {(user.full_name || user.email)?.[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {membership?.stripe_status && (
          <p className="text-xs text-gray-400">Stripe: <span className="font-medium">{membership.stripe_status}</span></p>
        )}
        {membership?.admin_override && <p className="text-xs text-amber-500">⚠ Admin override active</p>}
      </div>

      {/* Months paid selector + billing dates */}
      <div className="hidden sm:flex flex-col items-center gap-1">
        <p className="text-[10px] text-gray-400 uppercase">Months Paid</p>
        <div className="flex items-center gap-1">
          <select
            value={selectedMonths}
            onChange={e => setSelectedMonths(parseInt(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-[#D4AF37] bg-white cursor-pointer"
          >
            {[1, 2, 3, 6, 12].map(n => (
              <option key={n} value={n}>{n} mo</option>
            ))}
          </select>
          <button
            onClick={() => onApplyMonths(user, selectedMonths)}
            className="text-[10px] bg-[#D4AF37] text-black font-bold px-2 py-1.5 rounded-lg hover:bg-[#c09d30]"
          >
            Apply
          </button>
        </div>
        {paidThrough ? (
          <div className="text-center">
            <p className="text-[9px] text-gray-500">Paid through: <span className="font-semibold text-gray-700">{moment(paidThrough).format("MMM D, YYYY")}</span></p>
            <p className="text-[9px] text-gray-500">Next due: <span className="font-semibold text-[#D4AF37]">{moment(paidThrough).format("MMM D, YYYY")}</span></p>
          </div>
        ) : (
          <p className="text-[9px] text-gray-400">No date set</p>
        )}
      </div>

      {/* Status badge + force disable toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getEffectiveStatus(membership) ? "bg-green-100 text-green-700" : membership?.admin_override ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-600"}`}>
          {membership?.admin_override ? "Disabled" : getEffectiveStatus(membership) ? "Active" : "Expired"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleForceDisable(user)}
          className={`h-7 gap-1 text-[10px] ${membership?.admin_override ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
        >
          {membership?.admin_override ? "Re-enable" : "Force Disable"}
        </Button>
      </div>
    </div>
  );
}