import React from "react";
import { Pin, Calendar, Trophy, Clock } from "lucide-react";
import moment from "moment";

function SidebarCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F5F5F5]">
        <Icon className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-xs font-bold text-[#333] uppercase tracking-wide">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function CommunitySidebar({ pinnedPost, upcomingClasses, topContributors, onOpenPost }) {
  return (
    <div className="space-y-4 sticky top-6">
      {pinnedPost && (
        <SidebarCard title="Pinned Post" icon={Pin}>
          <div className="cursor-pointer group" onClick={() => onOpenPost?.(pinnedPost)}>
            {pinnedPost.image_url && (
              <img src={pinnedPost.image_url} className="w-full h-28 object-cover rounded-xl mb-3" />
            )}
            <p className="font-bold text-[#111] text-sm group-hover:text-[#D4AF37] transition-colors leading-snug">
              {pinnedPost.title}
            </p>
            <p className="text-xs text-[#666] mt-1 line-clamp-2">{pinnedPost.content}</p>
            <p className="text-[11px] text-[#999] mt-2">by {pinnedPost.liveAuthorName || pinnedPost.author_name || pinnedPost.author_email}</p>
          </div>
        </SidebarCard>
      )}

      <SidebarCard title="Upcoming Classes" icon={Calendar}>
        {upcomingClasses.length === 0 ? (
          <p className="text-xs text-[#999] text-center py-2">No upcoming classes</p>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-black flex flex-col items-center justify-center shrink-0 text-[#D4AF37]">
                  <span className="text-[9px] font-bold leading-none">{moment(cls.scheduled_at).format("MMM").toUpperCase()}</span>
                  <span className="text-sm font-bold leading-none">{moment(cls.scheduled_at).format("D")}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate leading-snug">{cls.title}</p>
                  <div className="flex items-center gap-1 text-xs text-[#999] mt-0.5">
                    <Clock className="w-3 h-3" />
                    {moment(cls.scheduled_at).local().format("h:mm A")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>

      <SidebarCard title="Top Contributors" icon={Trophy}>
        {topContributors.length === 0 ? (
          <p className="text-xs text-[#999] text-center py-2">No data yet</p>
        ) : (
          <div className="space-y-3">
            {topContributors.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-[#D4AF37]" : "text-[#CFCFCF]"}`}>
                  #{i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-[#D4AF37] text-xs font-bold shrink-0">
                  {(p.user_name || p.user_email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#333] truncate">{p.user_name || p.user_email}</p>
                </div>
                <span className="text-xs text-[#999] font-semibold shrink-0">{p.total_xp || 0} XP</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
    </div>
  );
}