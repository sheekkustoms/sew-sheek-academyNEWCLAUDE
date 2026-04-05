import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Calendar, ExternalLink, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReplayPlayer from "../components/classes/ReplayPlayer";
import moment from "moment";

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) return setTimeLeft(null);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-xs text-red-500 font-bold">Starting now!</span>;

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
      {timeLeft.days > 0 && <span className="text-xs font-bold text-[#111]">{timeLeft.days}d</span>}
      <span className="text-xs font-bold text-[#111]">{String(timeLeft.hours).padStart(2, "0")}h</span>
      <span className="text-xs text-[#999]">:</span>
      <span className="text-xs font-bold text-[#111]">{String(timeLeft.minutes).padStart(2, "0")}m</span>
      <span className="text-xs text-[#999]">:</span>
      <span className="text-xs font-bold text-[#D4AF37]">{String(timeLeft.seconds).padStart(2, "0")}s</span>
    </div>
  );
}

const getPlayerInfo = (raw) => {
  if (!raw) return null;
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  const url = srcMatch ? srcMatch[1] : raw.trim();
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "iframe", url: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0&portrait=0&share=0&download=0` };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", url };
  return null;
};

export default function LiveClassesHub() {
  const { data: allClasses = [], isLoading } = useQuery({
    queryKey: ["liveClassesHub"],
    queryFn: () => base44.entities.LiveClass.list("-scheduled_at", 100),
    staleTime: 30000,
  });

  const now = Date.now();
  const published = allClasses.filter(c => !c.status || c.status === "published");
  const liveClasses = published.filter(c => c.class_type === "live" || !c.class_type);

  const TEN_MIN = 10 * 60 * 1000;
  const upcoming = liveClasses.filter(c => c.scheduled_at && new Date(c.scheduled_at).getTime() > now + TEN_MIN)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  // "ongoing" = no scheduled time, OR within 10 min before start, OR started within the last 4 hours
  const ongoing = liveClasses.filter(c => {
    if (!c.scheduled_at) return true;
    const ms = new Date(c.scheduled_at).getTime();
    return ms - TEN_MIN <= now && ms + 4 * 60 * 60 * 1000 > now;
  });

  // past classes that are outside the ongoing window
  const past = liveClasses.filter(c => {
    if (!c.scheduled_at) return false;
    const ms = new Date(c.scheduled_at).getTime();
    return ms + 4 * 60 * 60 * 1000 <= now;
  }).sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  // A class is still "joinable" if it's within 24 hours after scheduled start
  const isJoinable = (c) => {
    if (!c.scheduled_at) return true;
    const ms = new Date(c.scheduled_at).getTime();
    return now < ms + 24 * 60 * 60 * 1000;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">Live Classes</h1>
        <p className="text-sm text-[#666] mt-0.5">Join scheduled live sessions with your instructor</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-[#EEEEEE] animate-pulse" />)}
        </div>
      ) : liveClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#EEEEEE]">
          <Radio className="w-10 h-10 text-[#CFCFCF] mb-3" />
          <p className="text-[#999] font-medium">No live classes scheduled yet</p>
          <p className="text-sm text-[#CFCFCF] mt-1">Check back soon for upcoming sessions</p>
        </div>
      ) : (
        <>
          {ongoing.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-red-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> Happening Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoing.map(cls => <LiveCard key={cls.id} cls={cls} isLive />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-[#111] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4AF37]" /> Upcoming Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(cls => <LiveCard key={cls.id} cls={cls} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-[#111] mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#999]" /> Previous Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(cls => <LiveCard key={cls.id} cls={cls} isPast isJoinable={isJoinable(cls)} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function LiveCard({ cls, isLive, isPast, isJoinable }) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {cls.thumbnail_url ? (
        <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
          <Radio className="w-10 h-10 text-red-200" />
        </div>
      )}
      <div className="p-4 space-y-2">
        {isLive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Now
          </span>
        )}
        {isPast && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase">
            🔁 Live Replay
          </span>
        )}
        <h3 className="font-bold text-[#111] leading-snug">{cls.title}</h3>
        {cls.scheduled_at && (
          <p className="text-xs text-[#999] flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {moment(cls.scheduled_at).format("MMM D, YYYY [at] h:mm A")}
          </p>
        )}
        {cls.scheduled_at && !isLive && <Countdown targetDate={cls.scheduled_at} />}
        {cls.description && <p className="text-xs text-[#666] line-clamp-2">{cls.description}</p>}
        <div className="flex gap-2 pt-2 border-t border-[#F5F5F5]">
          {(!isPast || isJoinable) && cls.zoom_url && (
            <a href={cls.zoom_url.startsWith("http") ? cls.zoom_url : `https://${cls.zoom_url}`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white gap-1.5 text-xs font-semibold rounded-xl h-8">
                <ExternalLink className="w-3.5 h-3.5" /> Join Class
              </Button>
            </a>
          )}
          {cls.pdf_url && (
            <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl h-8 border-[#D4AF37]/40 text-[#B8960C] hover:bg-[#D4AF37]/10">
                <Download className="w-3.5 h-3.5" /> Materials
              </Button>
            </a>
          )}
        </div>
        {cls.supply_list?.length > 0 && (
          <div className="pt-2 border-t border-[#F5F5F5]">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-1">Supplies Needed</p>
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
}