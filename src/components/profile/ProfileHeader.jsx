import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_CONFIG = {
  coach:     { label: "Coach",     bg: "bg-[#D4AF37]/15 text-[#B8960C] border-[#D4AF37]/30" },
  moderator: { label: "Moderator", bg: "bg-[#333]/10 text-[#333] border-[#333]/20" },
  student:   { label: "Member",    bg: "bg-[#F5F5F5] text-[#666] border-[#EEEEEE]" },
};

export default function ProfileHeader({ name, email, avatarUrl, role, isOwnProfile }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const handle = "@" + (email?.split("@")[0] || "");

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm">
      {/* Banner */}
      <div className="h-28 bg-black" />

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

        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-[#111]">{name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cfg.bg}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-[#999]">{handle}</p>
        </div>
      </div>
    </div>
  );
}