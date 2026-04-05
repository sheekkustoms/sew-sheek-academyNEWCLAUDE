import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReplayPlayer from "../components/classes/ReplayPlayer";
import moment from "moment";

const CATEGORIES = [
  { value: "all", label: "All Tutorials" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "patterns", label: "Patterns" },
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

export default function TutorialsHub() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: allClasses = [], isLoading } = useQuery({
    queryKey: ["tutorialsHub"],
    queryFn: () => base44.entities.LiveClass.list("-created_date", 200),
    staleTime: 30000,
  });

  const published = allClasses.filter(c => !c.status || c.status === "published");
  const tutorials = published.filter(c => c.class_type === "prerecorded" || c.class_type === "tutorial");

  const filtered = tutorials.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">Pre-Recorded Tutorials</h1>
          <p className="text-sm text-[#666] mt-0.5">Standalone lessons you can watch at your own pace</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <Input
            placeholder="Search tutorials..."
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
          <BookOpen className="w-10 h-10 text-[#CFCFCF] mb-3" />
          <p className="text-[#999] font-medium">{search ? "No tutorials match your search" : "No tutorials available yet"}</p>
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
                  <div className="aspect-video bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-violet-200" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cls.class_type === "tutorial" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"}`}>
                    {cls.class_type === "tutorial" ? "Tutorial" : "Pre-Recorded"}
                  </span>
                  <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
                  {cls.description && <p className="text-xs text-[#666] line-clamp-3">{cls.description}</p>}
                  {cls.created_date && (
                    <p className="text-xs text-[#999]">Added {moment(cls.created_date).format("MMM D, YYYY")}</p>
                  )}
                  {cls.pdf_url && (
                    <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
                      <button className="flex items-center gap-1.5 text-xs font-semibold text-[#B8960C] hover:text-[#D4AF37] transition-colors mt-1">
                        <Download className="w-3.5 h-3.5" /> Download Materials
                      </button>
                    </a>
                  )}
                  {cls.supply_list?.length > 0 && (
                    <div className="pt-2 border-t border-[#F5F5F5]">
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-1">Supplies</p>
                      <ul className="space-y-0.5">
                        {cls.supply_list.map((s, i) => (
                          <li key={i} className="text-xs text-[#555] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
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