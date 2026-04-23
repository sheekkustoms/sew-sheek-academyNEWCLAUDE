import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MembershipGate from "@/components/membership/MembershipGate";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import { ChevronRight, Zap, Star, BookOpen, CheckCircle, Map, TrendingUp, Flame, Video, Calendar } from "lucide-react";
import moment from "moment";

export default function Dashboard() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const viewingEmail = usePreviewEmail(user);
  useActivityTracker(user, "Dashboard");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["dashboardEnrollments", viewingEmail],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: viewingEmail }),
    enabled: !!viewingEmail,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["dashboardPoints", viewingEmail],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: viewingEmail }),
    enabled: !!viewingEmail,
    select: (data) => data[0] || null,
  });

  const { data: myMembership } = useQuery({
    queryKey: ["myMembership", viewingEmail],
    queryFn: () => base44.entities.MembershipStatus.filter({ user_email: viewingEmail }),
    enabled: !!viewingEmail,
    select: (data) => data[0] || null,
  });

  const hasLiveAccess = user?.role === "admin" || myMembership?.live_class_access === true;

  const { data: courses = [] } = useQuery({
    queryKey: ["dashboardCourses"],
    queryFn: () => base44.entities.Course.list("order", 20),
    select: (data) => data.filter(c => c.is_published).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["dashboardLessons"],
    queryFn: () => base44.entities.Lesson.list("order", 500),
  });

  const completedLessonsCount = enrollments.reduce((sum, e) => sum + (e.completed_lessons?.length || 0), 0);
  const completedCourses = enrollments.filter(e => e.is_completed).length;
  const hasStarted = completedLessonsCount > 0;
  const hasCompleted = completedCourses > 0;
  const isNewStudent = !hasStarted;
  const isReturning = hasCompleted;
  const previewEmail = localStorage.getItem("member_preview_email");
  const isPreviewMode = localStorage.getItem("member_preview_mode") === "true";
  const firstName = (isPreviewMode && previewEmail)
    ? previewEmail.split("@")[0]
    : (user?.full_name?.split(" ")[0] || "there");
  const streakDays = userPoints?.streak_days || 0;

  // Fetch upcoming live classes — show until 1 hour after start time
  const { data: upcomingClasses = [] } = useQuery({
    queryKey: ["dashboardUpcomingClasses"],
    queryFn: () => base44.entities.LiveClass.list("-scheduled_at", 20),
    select: (data) => {
      const now = Date.now();
      return data
        .filter(c => c.status === "published" && c.class_type === "live" && c.scheduled_at)
        .filter(c => new Date(c.scheduled_at).getTime() + 60 * 60 * 1000 > now)
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    },
  });

  const nextClass = hasLiveAccess ? (upcomingClasses[0] || null) : null;

  const enrollmentMap = {};
  enrollments.forEach(e => { enrollmentMap[e.course_id] = e; });

  const firstCourse = courses[0];
  const firstEnrollment = firstCourse ? enrollmentMap[firstCourse.id] : null;
  const firstCourseProgress = firstEnrollment?.progress_percent || 0;
  const firstCourseLessons = firstCourse ? lessons.filter(l => l.course_id === firstCourse.id) : [];
  const completedInFirst = firstEnrollment?.completed_lessons?.length || 0;
  const totalInFirst = firstCourseLessons.length;

  return (
    <MembershipGate user={user} allowInactive>
      <div className="space-y-8 pb-20">

        {/* ── Hero ── */}
        <div className="relative rounded-3xl overflow-hidden text-white shadow-xl" style={{
          background: "linear-gradient(135deg, #0f0220 0%, #2d1060 40%, #6B3FA0 100%)"
        }}>
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }} />
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#D4AF37]/10" />

          <div className="relative p-5 md:p-10 pb-6 md:pb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.2em]">Oh Sew Sheek Academy</p>
              {streakDays > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-bold text-orange-300">{streakDays} day streak</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-2 tracking-tight">
              {isNewStudent ? `Welcome, ${firstName}! 🎉` : `Keep going, ${firstName}! 💪`}
            </h1>
            <p className="text-white/65 text-sm mb-6 leading-relaxed">
              {isNewStudent
                ? "Your sewing journey starts right here. Take it one stitch at a time — you've got this!"
                : isReturning
                ? `${completedCourses} course${completedCourses !== 1 ? "s" : ""} completed — you're absolutely crushing it!`
                : `${completedLessonsCount} lesson${completedLessonsCount !== 1 ? "s" : ""} done — keep that momentum going!`}
            </p>
            <Link
              to={createPageUrl("MyPath")}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#F0D060] transition-all shadow-lg shadow-[#D4AF37]/20 text-sm"
            >
              {isNewStudent ? "🚀 Start My Journey" : "▶ Continue Learning"}
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Stats row */}
            {!isNewStudent && (
              <div className="grid grid-cols-4 gap-2 mt-6">
                <StatPill icon={<Zap className="w-4 h-4 text-[#D4AF37]" />} value={userPoints?.total_xp || 0} label="XP" gold />
                <StatPill icon={<Star className="w-4 h-4 text-white" />} value={userPoints?.level || 1} label="Level" />
                <StatPill icon={<BookOpen className="w-4 h-4 text-white" />} value={completedCourses} label="Courses" />
                <StatPill icon={<Flame className="w-4 h-4 text-orange-400" />} value={streakDays || 0} label="Streak" />
              </div>
            )}
          </div>
        </div>

        {/* ── Upcoming Live Class ── */}
        {nextClass && (
          <div>
            <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">📡 Live Class</p>
            <div className="bg-gradient-to-r from-[#C0392B] to-[#E74C3C] rounded-2xl p-5 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="flex items-start gap-4 relative">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-2">
                    🔴 Upcoming Live
                  </span>
                  <h3 className="font-extrabold text-base leading-tight">{nextClass.title}</h3>
                  {nextClass.description && (
                    <p className="text-white/75 text-xs mt-1 line-clamp-2">{nextClass.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-white/80 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {moment(nextClass.scheduled_at).format("dddd, MMMM D [at] h:mm A")}
                  </div>
                </div>
              </div>
              {nextClass.zoom_url && (
                <a
                  href={nextClass.zoom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-[#C0392B] font-bold py-3 rounded-xl hover:bg-white/90 transition-colors text-sm shadow"
                >
                  🎥 Join the Live Class
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Beginner Course Preview ── */}
        {firstCourse && (
          <div>
            <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">🎓 Beginner Journey</p>
            <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-[#4A2880] to-[#7B4FC0] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-extrabold text-base leading-tight">{firstCourse.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{totalInFirst} lessons · {firstCourse.xp_reward || 200} XP to earn</p>
                </div>
                {firstCourseProgress > 0 && (
                  <div className="text-right shrink-0 bg-white/10 rounded-xl px-3 py-2">
                    <p className="text-[#D4AF37] text-xl font-extrabold leading-none">{firstCourseProgress}%</p>
                    <p className="text-white/50 text-[10px] mt-0.5">complete</p>
                  </div>
                )}
              </div>
              {firstCourseProgress > 0 && (
                <div className="h-1.5 bg-[#EEEEEE]">
                  <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F0D060] transition-all" style={{ width: `${firstCourseProgress}%` }} />
                </div>
              )}
              <div className="divide-y divide-[#F5F5F5]">
                {firstCourseLessons.slice(0, 10).map((lesson, idx) => {
                  const isDone = firstEnrollment?.completed_lessons?.includes(lesson.id);
                  const isNext = !isDone && idx === completedInFirst;
                  return (
                    <div key={lesson.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isNext ? "bg-[#6B3FA0]/5" : "hover:bg-[#FAFAFA]"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDone ? "bg-[#D4AF37] text-white" :
                        isNext ? "bg-[#6B3FA0] text-white shadow-sm shadow-[#6B3FA0]/30" :
                        "bg-[#F0F0F0] text-[#AAAAAA]"
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDone ? "text-[#BBBBBB] line-through" : isNext ? "text-[#6B3FA0]" : "text-[#333]"}`}>
                          {lesson.title}
                        </p>
                        {lesson.duration_minutes > 0 && (
                          <p className="text-[10px] text-[#BBBBBB] mt-0.5">{lesson.duration_minutes} min</p>
                        )}
                      </div>
                      {isNext && <span className="text-[10px] font-bold bg-[#6B3FA0] text-white px-2 py-0.5 rounded-full shrink-0">UP NEXT</span>}
                      {isDone && <span className="text-[10px] font-bold text-[#D4AF37] shrink-0">✓ Done</span>}
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-4 bg-[#FAFAFA] border-t border-[#EEEEEE]">
                <Link
                  to={`${createPageUrl("CourseDetail")}?id=${firstCourse.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#5A2E90] to-[#7B4FC0] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-sm"
                >
                  {completedInFirst === 0 ? "🚀 Start Lesson 1" : completedInFirst >= totalInFirst ? "🏆 Review Course" : `▶ Continue — Lesson ${completedInFirst + 1}`}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div>
          <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-3">Explore</p>
          <div className="grid grid-cols-2 gap-3">
            <ExploreCard to="Library" icon={<BookOpen className="w-6 h-6" />} label="Library" desc="Replays & tutorials" color="from-blue-500/10 to-indigo-500/5" iconColor="text-blue-500" border="border-blue-100" />
            <ExploreCard to="MemberProfile" icon={<TrendingUp className="w-6 h-6" />} label="Progress" desc="XP, badges & stats" color="from-[#D4AF37]/10 to-amber-500/5" iconColor="text-[#D4AF37]" border="border-amber-100" />
          </div>
        </div>

      </div>
    </MembershipGate>
  );
}

function StatPill({ icon, value, label, gold }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 border ${
      gold
        ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/10"
        : "bg-white/10 border-white/15"
    }`}>
      {icon}
      <p className={`text-sm font-extrabold leading-none ${gold ? "text-[#D4AF37]" : "text-white"}`}>{value}</p>
      <p className="text-[9px] text-white/50 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ExploreCard({ to, icon, label, desc, color, iconColor, border }) {
  return (
    <Link
      to={createPageUrl(to)}
      className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:scale-[1.02] transition-all group`}
    >
      <div className={`${iconColor} group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="text-sm font-bold text-[#111]">{label}</p>
        <p className="text-[11px] text-[#888] mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}