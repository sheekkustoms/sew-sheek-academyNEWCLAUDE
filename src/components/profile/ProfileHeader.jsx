import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_CONFIG = {
  coach:     { label: "Coach",     bg: "bg-amber-100 text-amber-700 border-amber-200" },
  moderator: { label: "Moderator", bg: "bg-violet-100 text-violet-700 border-violet-200" },
  student:   { label: "Student",   bg: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function ProfileHeader({ name, email, avatarUrl, role, isOwnProfile }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const handle = "@" + (email?.split("@")[0] || "");

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-r from-pink-100 via-fuchsia-50 to-violet-100" />

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          {/* Avatar */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                {name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <Link to={createPageUrl("Messages")}>
              <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-600">
                <MessageCircle className="w-4 h-4" /> Message
              </Button>
            </Link>
          )}
          {isOwnProfile && (
            <Link to={createPageUrl("ProfileSettings")}>
              <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.bg}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{handle}</p>
        </div>
      </div>
    </div>
  );
}