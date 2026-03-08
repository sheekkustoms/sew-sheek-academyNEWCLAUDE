import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target) - new Date();
      if (diff <= 0) return setTimeLeft({ done: true });
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (timeLeft.done) return <span className="text-green-600 font-bold text-sm">🔴 Live Now!</span>;

  const units = [
    { label: "Days", val: timeLeft.d },
    { label: "Hrs", val: timeLeft.h },
    { label: "Min", val: timeLeft.m },
    { label: "Sec", val: timeLeft.s },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map(({ label, val }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="bg-gradient-to-br from-pink-500 to-violet-500 text-white font-bold text-lg rounded-lg w-12 h-10 flex items-center justify-center shadow">
            {String(val ?? 0).padStart(2, "0")}
          </span>
          <span className="text-[9px] text-gray-400 mt-0.5 font-medium uppercase">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LiveClasses() {
  const { data: classes = [] } = useQuery({
    queryKey: ["liveClasses"],
    queryFn: () => base44.entities.LiveClass.filter({ is_active: true }),
  });

  const sorted = [...classes].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const upcoming = sorted.filter(c => new Date(c.scheduled_at) > new Date());
  const past = sorted.filter(c => new Date(c.scheduled_at) <= new Date());

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center shadow">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-sm text-gray-500">Join scheduled live sewing sessions</p>
        </div>
      </div>

      {upcoming.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No upcoming classes scheduled yet.</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
        </div>
      )}

      {upcoming.map((cls, i) => (
        <motion.div key={cls.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="bg-white border border-pink-100 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{cls.title}</h2>
              {cls.description && <p className="text-sm text-gray-500 mt-1">{cls.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {moment(cls.scheduled_at).format("dddd, MMMM D [at] h:mm A")}
              </div>
            </div>
            {cls.zoom_url && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow gap-2">
                    <Video className="w-4 h-4" /> Join Class
                  </Button>
                </a>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span>Zoom link:</span>
                  <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 underline break-all max-w-[180px] truncate hover:text-pink-500 transition-colors">
                    {cls.zoom_url}
                  </a>
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Starts in</p>
            <Countdown target={cls.scheduled_at} />
          </div>
        </motion.div>
      ))}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Past Classes</h2>
          <div className="space-y-2">
            {past.slice().reverse().map(cls => (
              <div key={cls.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{cls.title}</span>
                <span className="text-xs">{moment(cls.scheduled_at).format("MMM D, YYYY")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}