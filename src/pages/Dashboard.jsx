import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MembershipGate from "@/components/membership/MembershipGate";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { Map, Radio, BookMarked, ChevronRight, Zap, Star, CheckCircle, Lock } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  useActivityTracker(user, "Dashboard");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["dashboardEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["dashboardPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
    select: (data) => data[0] || null,
  });

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

  const firstName = user?.full_name?.split(" ")[0] || "there";

  // Find the first in-progress or unlocked course
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
      <div className="max-w-2xl mx-auto space-y-6 pb-16">

        {/* ── Hero greeting ── */}
        <div className="bg-gradient-to-br from-[#1a0533] to-[#6B3FA0] rounded-3xl p-7 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-1">Oh Sew Sheek Academy</p>
          <h1 className="text-2xl font-extrabold leading-tight mb-1">
            {isNewStudent ? `Welcome, ${firstName}! 🎉` : `Keep going, ${firstName}! 💪`}
          </h1>
          <p className="text-white/70 text-sm mb-5">
            {isNewStudent
              ? "Your sewing journey starts right here. You've got this!"
              : isReturning
              ? `${completedCourses} course${completedCourses !== 1 ? "s" : ""} completed — you're crushing it!`
              : `${completedLessonsCount} lesson${completedLessonsCount !== 1 ? "s" : ""} done — don't stop now!`}
          </p>
          <Link
            to={createPageUrl("MyPath")}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#F0D060] transition-colors text-sm"
          >
            {isNewStudent ? "🚀 Start My Journey" : "▶ Continue Learning"}
            <ChevronRight className="w-4 h-4" />
          </Link>
          {!isNewStudent && userPoints && (
            <div className="flex gap-3 mt-5">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-extrabold text-[#D4AF37]">{userPoints.total_xp || 0}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">XP</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-extrabold">{userPoints.level || 1}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">Level</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-extrabold">{completedCourses}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">Courses</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Beginner Course Preview (always visible) ── */}
        {firstCourse && (
          <div>
            <p className="text-xs font-bold text-[#999] uppercase tracking-widest mb-3">🎓 Beginner Journey</p>
            <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm">
              {/* Course header */}
              <div className="bg-gradient-to-r from-[#6B3FA0] to-[#8B5CC0] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-extrabold text-base">{firstCourse.title}</p>
                  <p className="text-white/70 text-xs mt-0.5">{totalInFirst} lessons · {firstCourse.xp_reward || 200} XP to earn</p>
                </div>
                {firstCourseProgress > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-[#D4AF37] text-xl font-extrabold">{firstCourseProgress}%</p>
                    <p className="text-white/60 text-[10px]">complete</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {firstCourseProgress > 0 && (
                <div className="h-1.5 bg-[#EEEEEE]">
                  <div className="h-1.5 bg-[#D4AF37] transition-all" style={{ width: `${firstCourseProgress}%` }} />
                </div>
              )}

              {/* Lesson list */}
              <div className="divide-y divide-[#F5F5F5]">
                {firstCourseLessons.slice(0, 10).map((lesson, idx) => {
                  const isDone = firstEnrollment?.completed_lessons?.includes(lesson.id);
                  const isNext = !isDone && idx === completedInFirst;
                  return (
                    <div key={lesson.id} className={`flex items-center gap-3 px-5 py-3 ${isNext ? "bg-[#6B3FA0]/5" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDone ? "bg-[#D4AF37] text-white" :
                        isNext ? "bg-[#6B3FA0] text-white" :
                        "bg-[#F0F0F0] text-[#AAAAAA]"
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDone ? "text-[#999] line-through" : isNext ? "text-[#6B3FA0]" : "text-[#333]"}`}>
                          {lesson.title}
                        </p>
                      </div>
                      {isNext && (
                        <span className="text-[10px] font-bold bg-[#6B3FA0] text-white px-2 py-0.5 rounded-full shrink-0">UP NEXT</span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-bold text-[#D4AF37] shrink-0">✓ Done</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-5 py-4 bg-[#FAFAFA] border-t border-[#EEEEEE]">
                <Link
                  to={`${createPageUrl("CourseDetail")}?id=${firstCourse.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#6B3FA0] text-white font-bold py-3 rounded-xl hover:bg-[#5A3490] transition-colors text-sm"
                >
                  {completedInFirst === 0 ? "🚀 Start Lesson 1" : completedInFirst >= totalInFirst ? "🏆 Review Course" : `▶ Continue — Lesson ${completedInFirst + 1}`}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div>
          <p className="text-xs font-bold text-[#999] uppercase tracking-widest mb-3">Explore</p>
          <div className="grid grid-cols-3 gap-3">
            <QuickLink to="LiveClassesHub" icon="📡" label="Live Classes" />
            <QuickLink to="Library" icon="🎬" label="Library" />
            <QuickLink to="MyPath" icon="🗺️" label="My Path" />
          </div>
        </div>

      </div>
    </MembershipGate>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link
      to={createPageUrl(to)}
      className="bg-white border border-[#EEEEEE] rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-[#6B3FA0]/30 transition-all text-center"
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-bold text-[#333]">{label}</p>
    </Link>
  );
}