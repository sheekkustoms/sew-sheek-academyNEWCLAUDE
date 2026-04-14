import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MembershipGate from "@/components/membership/MembershipGate";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { Map, Radio, BookMarked, TrendingUp, Star, Zap } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

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

  const { data: upcomingClasses = [] } = useQuery({
    queryKey: ["dashboardLiveClasses"],
    queryFn: () => base44.entities.LiveClass.filter({ status: "published" }, "-scheduled_at", 3),
  });

  const completedLessonsCount = enrollments.reduce(
    (sum, e) => sum + (e.completed_lessons?.length || 0),
    0
  );
  const completedCourses = enrollments.filter((e) => e.is_completed).length;
  const hasStarted = completedLessonsCount > 0;
  const hasCompleted = completedCourses > 0;

  // Determine student state
  const isNewStudent = !hasStarted;
  const isInProgress = hasStarted && !hasCompleted;
  const isReturning = hasCompleted;

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <MembershipGate user={user} allowInactive>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">
            {isNewStudent ? `Welcome, ${firstName}! 👋` : `Welcome back, ${firstName}!`}
          </h1>
          <p className="text-sm text-[#666] mt-1">
            {isNewStudent
              ? "You're all set! Let's get you started on your sewing journey."
              : isInProgress
              ? "Keep going — you're making great progress!"
              : "Great work! Keep building on your skills."}
          </p>
        </div>

        {/* NEW STUDENT — Start Here CTA */}
        {isNewStudent && (
          <div className="bg-black rounded-2xl p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">🧵</div>
            <h2 className="text-white text-2xl font-extrabold mb-2">Start Your Learning Journey</h2>
            <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
              Follow your personalized path through beginner to advanced sewing courses — one step at a time.
            </p>
            <Link
              to={createPageUrl("MyPath")}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#F0D060] transition-colors text-sm"
            >
              <Map className="w-4 h-4" /> View My Learning Path
            </Link>
          </div>
        )}

        {/* IN PROGRESS — Resume Hero */}
        {isInProgress && (
          <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1">Keep Going</p>
              <h2 className="text-xl font-extrabold text-[#111] mb-2">You're on your way!</h2>
              <p className="text-sm text-[#666] mb-4">
                You've completed <strong>{completedLessonsCount} lesson{completedLessonsCount !== 1 ? "s" : ""}</strong> so far. Pick up where you left off.
              </p>
              <Link
                to={createPageUrl("MyPath")}
                className="inline-flex items-center gap-2 bg-black text-[#D4AF37] font-bold px-6 py-2.5 rounded-xl hover:bg-[#222] transition-colors text-sm"
              >
                <Map className="w-4 h-4" /> Continue My Path
              </Link>
            </div>
            {userPoints && (
              <div className="flex gap-4 shrink-0">
                <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-[#EEEEEE] min-w-[80px]">
                  <p className="text-2xl font-extrabold text-[#D4AF37]">{userPoints.total_xp || 0}</p>
                  <p className="text-xs text-[#999] mt-0.5">XP Earned</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-[#EEEEEE] min-w-[80px]">
                  <p className="text-2xl font-extrabold text-[#111]">{userPoints.level || 1}</p>
                  <p className="text-xs text-[#999] mt-0.5">Level</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RETURNING STUDENT — Full Stats Dashboard */}
        {isReturning && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Star} label="XP Earned" value={userPoints?.total_xp || 0} color="text-[#D4AF37]" />
              <StatCard icon={Zap} label="Level" value={userPoints?.level || 1} color="text-purple-500" />
              <StatCard icon={TrendingUp} label="Courses Done" value={completedCourses} color="text-green-500" />
              <StatCard icon={BookMarked} label="Lessons Done" value={completedLessonsCount} color="text-blue-500" />
            </div>
          </>
        )}

        {/* Quick Links — shown for in-progress and returning */}
        {!isNewStudent && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <QuickLink to="MyPath" icon={Map} label="My Path" desc="Your course roadmap" />
            <QuickLink to="LiveClassesHub" icon={Radio} label="Live Classes" desc="Join upcoming sessions" />
            <QuickLink to="Library" icon={BookMarked} label="Library" desc="Replays & tutorials" />
          </div>
        )}

        {/* Upcoming Live Classes */}
        {upcomingClasses.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#111] mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500" /> Upcoming Live Classes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {upcomingClasses.map((cls) => (
                <Link
                  key={cls.id}
                  to={createPageUrl("LiveClassesHub")}
                  className="bg-white border border-[#EEEEEE] rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all"
                >
                  <p className="font-semibold text-sm text-[#111] line-clamp-2">{cls.title}</p>
                  {cls.scheduled_at && (
                    <p className="text-xs text-[#999] mt-1">
                      {new Date(cls.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MembershipGate>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl p-4 shadow-sm text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <p className="text-2xl font-extrabold text-[#111]">{value}</p>
      <p className="text-xs text-[#999] mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link
      to={createPageUrl(to)}
      className="bg-white border border-[#EEEEEE] rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#D4AF37]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#111]">{label}</p>
        <p className="text-xs text-[#999]">{desc}</p>
      </div>
    </Link>
  );
}