import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReplayPlayer from "../components/classes/ReplayPlayer";
import moment from "moment";

const getPlayerInfo = (raw) => {
  if (!raw) return null;
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  const url = srcMatch ? srcMatch[1] : raw.trim();
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "iframe", url: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0&portrait=0&share=0&download=0` };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", url };
  return null;
};

export default function ReplaysHub() {
  const [search, setSearch] = useState("");

  const { data: allClasses = [], isLoading } = useQuery({
    queryKey: ["replaysHub"],
    queryFn: () => base44.entities.LiveClass.list("-created_date", 200),
    staleTime: 30000,
  });

  const published = allClasses.filter(c => !c.status || c.status === "published");
  const replays = published.filter(c => {
    if (c.class_type === "replay") return true;
    // Legacy: live class that has ended and has a recording
    if ((c.class_type === "live" || !c.class_type) && c.recording_url && c.scheduled_at) {
      return new Date(c.scheduled_at).getTime() + 60 * 60 * 1000 <= Date.now();
    }
    return false;
  }).sort((a, b) => new Date(b.scheduled_at || b.created_date) - new Date(a.scheduled_at || a.created_date));

  const filtered = replays.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">Replay Classes</h1>
          <p className="text-sm text-[#666] mt-0.5">Watch recordings of past live sessions anytime</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <Input
            placeholder="Search replays..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-[#EEEEEE] bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-[#EEEEEE] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#EEEEEE]">
          <PlayCircle className="w-10 h-10 text-[#CFCFCF] mb-3" />
          <p className="text-[#999] font-medium">{search ? "No replays match your search" : "No replays available yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cls => {
            const player = getPlayerInfo(cls.recording_url);
            return (
              <div key={cls.id} className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                {player ? (
                  <ReplayPlayer player={player} title={cls.title} />
                ) : cls.thumbnail_url ? (
                  <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-orange-200" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase">Replay</span>
                  <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
                  {cls.scheduled_at && (
                    <p className="text-xs text-[#999]">Originally {moment(cls.scheduled_at).format("MMM D, YYYY")}</p>
                  )}
                  {cls.description && <p className="text-xs text-[#666] line-clamp-2">{cls.description}</p>}
                  {cls.pdf_url && (
                    <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
                      <button className="flex items-center gap-1.5 text-xs font-semibold text-[#B8960C] hover:text-[#D4AF37] transition-colors mt-1">
                        <Download className="w-3.5 h-3.5" /> Download Materials
                      </button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}