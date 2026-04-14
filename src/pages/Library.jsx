import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import MembershipGate from "@/components/membership/MembershipGate";
import { PlayCircle, BookOpen, Search, Download, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReplayPlayer from "../components/classes/ReplayPlayer";
import moment from "moment";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "replay", label: "Replays" },
  { value: "tutorial", label: "Tutorials" },
];

const getPlayerInfo = (raw) => {
  if (!raw) return null;
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  const url = srcMatch ? srcMatch[1] : raw.trim();
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "iframe", url: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0&portrait=0&share=0&download=0` };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", url };
  return null;
};

export default function Library() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  useActivityTracker(user, "Library");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allClasses = [], isLoading } = useQuery({
    queryKey: ["libraryClasses"],
    queryFn: () => base44.entities.LiveClass.list("-created_date", 200),
    staleTime: 30000,
  });

  const now = Date.now();
  const published = allClasses.filter(c => !c.status || c.status === "published");

  const replays = published.filter(c => {
    if (c.class_type === "replay") return true;
    if ((c.class_type === "live" || !c.class_type) && c.recording_url && c.scheduled_at)
      return new Date(c.scheduled_at).getTime() + 60 * 60 * 1000 <= now;
    return false;
  });

  const tutorials = published.filter(c => c.class_type === "prerecorded" || c.class_type === "tutorial");

  const hasStarted = enrollments.some(e => (e.completed_lessons?.length ?? 0) > 0 || e.progress_percent > 0);
  const isAdmin = user?.role === "admin";

  // Library locked until student has started at least 1 lesson
  if (!isAdmin && !hasStarted && user) {
    return (
      <MembershipGate user={user}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-[#6B3FA0]/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#6B3FA0]" />
          </div>
          <h2 className="text-xl font-bold text-[#111]">Library Unlocks After Your First Lesson</h2>
          <p className="text-sm text-[#666] max-w-md leading-relaxed">
            Complete at least one lesson in your first course to unlock the Library — replays, tutorials, and bonus resources.
          </p>
          <a href="/MyPath" className="inline-flex items-center gap-2 bg-[#6B3FA0] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#5A3490] transition-colors">
            Go to My Path →
          </a>
        </div>
      </MembershipGate>
    );
  }

  let items = [];
  if (filter === "all") items = [...replays.map(c => ({ ...c, _type: "replay" })), ...tutorials.map(c => ({ ...c, _type: "tutorial" }))];
  else if (filter === "replay") items = replays.map(c => ({ ...c, _type: "replay" }));
  else items = tutorials.map(c => ({ ...c, _type: "tutorial" }));

  const filtered = items.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MembershipGate user={user}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">Library</h1>
            <p className="text-sm text-[#666] mt-0.5">Replays and tutorials — all in one place</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <Input
              placeholder="Search library..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-[#EEEEEE] bg-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                filter === f.value
                  ? "bg-[#6B3FA0] text-white border-[#6B3FA0]"
                  : "bg-white text-[#666] border-[#EEEEEE] hover:border-[#6B3FA0]/40"
              }`}
            >
              {f.label}
              {f.value === "replay" && replays.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({replays.length})</span>
              )}
              {f.value === "tutorial" && tutorials.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({tutorials.length})</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-[#EEEEEE] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#EEEEEE]">
            <PlayCircle className="w-10 h-10 text-[#CFCFCF] mb-3" />
            <p className="text-[#999] font-medium">{search ? "No results match your search" : "Nothing here yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(cls => {
              const player = getPlayerInfo(cls.recording_url);
              const isReplay = cls._type === "replay";
              return (
                <div key={cls.id} className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  {player ? (
                    <ReplayPlayer player={player} title={cls.title} />
                  ) : cls.thumbnail_url ? (
                    <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className={`aspect-video flex items-center justify-center ${isReplay ? "bg-orange-50" : "bg-violet-50"}`}>
                      {isReplay
                        ? <PlayCircle className="w-10 h-10 text-orange-200" />
                        : <BookOpen className="w-10 h-10 text-violet-200" />
                      }
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isReplay ? "bg-orange-100 text-orange-600" : "bg-violet-100 text-violet-600"
                    }`}>
                      {isReplay ? "Replay" : "Tutorial"}
                    </span>
                    <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
                    {cls.description && <p className="text-xs text-[#666] line-clamp-2">{cls.description}</p>}
                    {(cls.scheduled_at || cls.created_date) && (
                      <p className="text-xs text-[#999]">
                        {isReplay ? "Originally" : "Added"} {moment(cls.scheduled_at || cls.created_date).format("MMM D, YYYY")}
                      </p>
                    )}
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
    </MembershipGate>
  );
}