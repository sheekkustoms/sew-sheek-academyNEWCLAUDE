import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, Copy, Check, Bell, BellOff, ChevronLeft, ChevronRight, Gamepad2, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function ZoomLinkSection({ zoom_url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(zoom_url);
    setCopied(true);
    toast.success("Zoom link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-end gap-3 shrink-0">
      <a href={zoom_url} target="_blank" rel="noopener noreferrer">
        <Button className="bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow gap-2">
          <Video className="w-4 h-4" /> Join Class
        </Button>
      </a>
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <span className="text-gray-500">Zoom:</span>
        <code className="text-gray-700 font-mono text-[11px] max-w-[140px] truncate">{zoom_url}</code>
        <button
          onClick={handleCopy}
          className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
          title="Copy Zoom link"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
}

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

function MiniCalendar({ classes }) {
  const [currentMonth, setCurrentMonth] = useState(moment());

  const startOfMonth = currentMonth.clone().startOf("month");
  const endOfMonth = currentMonth.clone().endOf("month");
  const startDay = startOfMonth.day(); // 0=Sun
  const daysInMonth = currentMonth.daysInMonth();

  const classDateSet = new Set(
    classes.map(c => moment(c.scheduled_at).format("YYYY-MM-DD"))
  );

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = moment().format("YYYY-MM-DD");

  return (
    <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-bold text-gray-800">{currentMonth.format("MMMM YYYY")}</span>
        <button onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = currentMonth.clone().date(day).format("YYYY-MM-DD");
          const hasClass = classDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`relative flex items-center justify-center h-8 w-full rounded-lg text-sm font-medium transition-all
              ${isToday ? "bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow" : "text-gray-700 hover:bg-gray-50"}
            `}>
              {day}
              {hasClass && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-pink-500"}`} />
              )}
            </div>
          );
        })}
      </div>
      {classDateSet.size > 0 && (
        <p className="text-[11px] text-center text-gray-400 mt-2">🔴 = live class scheduled</p>
      )}
    </div>
  );
}

function RemindMeButton({ cls }) {
  const storageKey = `remind_${cls.id}`;
  const [reminded, setReminded] = useState(() => !!localStorage.getItem(storageKey));

  const scheduleNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser doesn't support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied. Please enable it in your browser settings.");
      return;
    }

    const classTime = new Date(cls.scheduled_at).getTime();
    const reminderTime = classTime - 15 * 60 * 1000; // 15 min before
    const now = Date.now();
    const delay = reminderTime - now;

    if (delay <= 0) {
      toast.error("This class starts in less than 15 minutes — it's almost time!");
      return;
    }

    localStorage.setItem(storageKey, String(reminderTime));
    setReminded(true);

    setTimeout(() => {
      new Notification("🧵 Class starting soon!", {
        body: `"${cls.title}" starts in 15 minutes! Get ready to join.`,
        icon: "/favicon.ico",
      });
    }, delay);

    toast.success(`Reminder set! We'll notify you 15 min before "${cls.title}".`);
  };

  const cancelReminder = () => {
    localStorage.removeItem(storageKey);
    setReminded(false);
    toast("Reminder cancelled.");
  };

  return reminded ? (
    <Button size="sm" variant="outline" onClick={cancelReminder} className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50">
      <BellOff className="w-3.5 h-3.5" /> Reminder Set
    </Button>
  ) : (
    <Button size="sm" variant="outline" onClick={scheduleNotification} className="gap-1.5 text-gray-600 hover:text-violet-600 hover:border-violet-200">
      <Bell className="w-3.5 h-3.5" /> Remind Me
    </Button>
  );
}

export default function LiveClasses() {
  const navigate = useNavigate();
  const { data: classes = [] } = useQuery({
    queryKey: ["liveClasses"],
    queryFn: () => base44.entities.LiveClass.filter({ is_active: true }),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => base44.entities.Quiz.filter({ is_published: true }),
  });

  const sorted = [...classes].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const upcoming = sorted.filter(c => new Date(c.scheduled_at) > new Date());
  const past = sorted.filter(c => new Date(c.scheduled_at) <= new Date());
  const publishedQuizzes = quizzes.filter(q => q.is_published && q.quiz_type === "live");

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

      <MiniCalendar classes={upcoming} />

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900">
        <p>💡 <span className="font-medium">Tip:</span> Times shown in your local timezone. Hit "Remind Me" to get a browser notification 15 minutes before class!</p>
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
          onClick={() => navigate(createPageUrl("LiveClassDetail"), { state: { classId: cls.id } })}
          className="bg-white border border-pink-100 rounded-2xl p-6 shadow-sm space-y-4 cursor-pointer hover:shadow-lg hover:border-pink-300 transition-all"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{cls.title}</h2>
              {cls.description && <p className="text-sm text-gray-500 mt-1">{cls.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {moment(cls.scheduled_at).local().format("dddd, MMMM D [at] h:mm A z")}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <RemindMeButton cls={cls} />
              {cls.pdf_url && (
                <a href={cls.pdf_url} download target="_blank" rel="noopener noreferrer">
                  <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 gap-2">
                    <Download className="w-4 h-4" /> Class Materials
                  </Button>
                </a>
              )}
              {cls.zoom_url && <ZoomLinkSection zoom_url={cls.zoom_url} />}
            </div>
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

      {/* Quiz Games Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quiz Games</h2>
            <p className="text-sm text-gray-500">Test your knowledge with interactive quizzes</p>
          </div>
        </div>

        {publishedQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedQuizzes.map((quiz, idx) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="bg-white border border-yellow-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {quiz.cover_image_url && (
                  <img src={quiz.cover_image_url} alt={quiz.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                )}
                <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">{quiz.quiz_type === "live" ? "🔴 Live" : "Practice"}</span>
                  <span>{quiz.total_plays || 0} plays</span>
                </div>
                <Link to={createPageUrl("QuizGame")} state={{ quizId: quiz.id }}>
                  <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white gap-2">
                    <Gamepad2 className="w-3.5 h-3.5" /> Play Quiz
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <Gamepad2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No quizzes available yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}