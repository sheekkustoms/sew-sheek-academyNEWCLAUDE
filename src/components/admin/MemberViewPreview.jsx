import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import MembershipStatusBadge from "@/components/membership/MembershipStatusBadge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MemberViewPreview() {
  const [search, setSearch] = useState("");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForBilling"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["allMemberships"],
    queryFn: () => base44.entities.MembershipStatus.list(),
  });

  const members = allUsers.filter(u => u.role !== "admin");

  const filtered = members.filter(u =>
    (u.full_name || u.email).toLowerCase().includes(search.toLowerCase())
  );

  const getMembership = (email) => memberships.find(m => m.user_email === email) || null;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
        👁 This is exactly what each member sees on their dashboard — their membership status badge and next due date.
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Member identity */}
            <div className="flex items-center gap-3">
              {u.avatar_url ? (
                <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-sm">
                  {(u.full_name || u.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{u.full_name || u.email}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            </div>

            {/* What the member sees — the actual badge component */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Member sees:</p>
              <MembershipStatusBadge userEmail={u.email} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No members found.</p>
        )}
      </div>
    </div>
  );
}