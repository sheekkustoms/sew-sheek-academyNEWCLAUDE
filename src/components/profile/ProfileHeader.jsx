import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoleBadge from "@/components/shared/RoleBadge";

const TIER_COLORS = {
  tier_1: { color: "#4A9D6F", label: "Fresh Start" },
  tier_2: { color: "#D4AF37", label: "Rusty Creator" },
  tier_3: { color: "#6B3FA0", label: "Skilled Builder" },
};

export default function ProfileHeader({ name, email, avatarUrl, role, isOwnProfile, tier }) {
  // Map platform roles to badge types
  const badgeRole = role === "admin" ? "moderator" : (role === "coach" ? "coach" : null);
  const handle = "@" + (email?.split("@")[0] || "");

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm">
      {/* Banner */}
      <div className="h-32 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #0f0220 0%, #2d1060 45%, #6B3FA0 100%)"
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-8 text-[#D4AF37]/20 text-4xl font-black tracking-widest select-none">SEW SHEEK</div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          {/* Avatar with gold ring */}
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg ring-2 ring-[#D4AF37]" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#D4AF37] border-4 border-white shadow-lg ring-2 ring-[#D4AF37]/50 flex items-center justify-center text-black text-2xl font-extrabold">
                {name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isOwnProfile && (
              <Link to={createPageUrl("Messages")}>
                <Button size="sm" className="gap-2 bg-black hover:bg-[#222] text-[#D4AF37] font-semibold rounded-xl">
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>
              </Link>
            )}
            {isOwnProfile && (
              <Link to={createPageUrl("ProfileSettings")}>
                <Button size="sm" variant="outline" className="border-[#CFCFCF] text-[#333] hover:border-[#D4AF37] rounded-xl font-semibold">
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#111]">{name}</h1>
            {badgeRole && <RoleBadge role={badgeRole} />}
            {tier && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: TIER_COLORS[tier]?.color + "20", color: TIER_COLORS[tier]?.color }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[tier]?.color }} />
                {TIER_COLORS[tier]?.label}
              </div>
            )}
          </div>
          <p className="text-sm text-[#999]">{handle}</p>
        </div>
      </div>
    </div>
  );
}