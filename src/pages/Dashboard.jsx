import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { BookOpen, Trophy, Flame, Target, ArrowRight, Zap, Star, Brain, Camera, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import XPBar, { getLevelFromXP } from "../components/shared/XPBar";
import BadgeIcon from "../components/shared/BadgeIcon";
import CourseCard from "../components/shared/CourseCard";
import { getOrCreateUserPoints } from "../components/shared/useUserPoints";
import ProfileSetupModal from "../components/shared/ProfileSetupModal";

function StatCard({ icon: Icon, label, value, gradient, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileDone, setProfileDone] = useState(false);
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const needsProfileSetup = user && (!user.avatar_url || !user.full_name) && !profileDone;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setUploadingPhoto(false);
  };

  const { data: myPoints } = useQuery({
    queryKey: ["dashboardPoints", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.filter({ is_published: true }),
  });

  const { data: topLearners = [] } = useQuery({
    queryKey: ["topLearners"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 5),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: () => base44.entities.User.list("-created_date", 30),
  });

  const enrolledCourseIds = enrollments.map((e) => e.course_id);
  const inProgressCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));
  const recommendedCourses = courses.filter((c) => !enrolledCourseIds.includes(c.id)).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {needsProfileSetup && <ProfileSetupModal user={user} onComplete={() => setProfileDone(true)} />}
      {/* Welcome hero */}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 p-6 md:p-8 shadow-xl shadow-pink-200"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-start gap-5">
          {/* Profile photo */}
          <div className="shrink-0">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-dashed border-white/50 flex flex-col items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white/70" />
                  <span className="text-[9px] text-white/70 mt-0.5">Add Photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              Welcome back, {user?.full_name?.split(" ")[0] || "Learner"} 👋
            </h1>
            <p className="text-pink-100 text-sm mb-5">Keep learning and earn more XP today!</p>
            <div className="max-w-md">
              <XPBar xp={myPoints?.total_xp || 0} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Courses Completed" value={myPoints?.courses_completed || 0} gradient="from-blue-500 to-indigo-500" delay={0.1} />
        <StatCard icon={Target} label="Lessons Done" value={myPoints?.lessons_completed || 0} gradient="from-emerald-500 to-green-500" delay={0.15} />
        <StatCard icon={Flame} label="Day Streak" value={myPoints?.streak_days || 0} gradient="from-orange-500 to-red-500" delay={0.2} />
        <StatCard icon={Star} label="Badges Earned" value={myPoints?.badges?.length || 0} gradient="from-amber-400 to-yellow-400" delay={0.25} />
      </div>

      {/* Daily Challenge CTA */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-fuchsia-50 to-violet-50 border border-fuchsia-200 rounded-2xl p-5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center shadow-md shadow-fuchsia-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Daily Challenge Available!</p>
            <p className="text-sm text-gray-500">Score 5/5 to earn the Quiz Master badge + 250 XP</p>
          </div>
        </div>
        <Link to={createPageUrl("DailyChallenges")}>
          <Button className="bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shrink-0 shadow-md shadow-fuchsia-200">
            Start <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </motion.div>

      {/* Badges */}
      {myPoints?.badges?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Badges</h2>
          <div className="flex flex-wrap gap-4">
            {myPoints.badges.map((badge) => <BadgeIcon key={badge} name={badge} size="md" />)}
          </div>
        </div>
      )}

      {/* Continue learning */}
      {inProgressCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
            <Link to={createPageUrl("Courses")} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.slice(0, 3).map((course, i) => (
              <CourseCard key={course.id} course={course} enrollment={enrollments.find((e) => e.course_id === course.id)} index={i} userLevel={getLevelFromXP(myPoints?.total_xp || 0)} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended */}
      {recommendedCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
            <Link to={createPageUrl("Courses")} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium">
              Browse all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedCourses.map((course, i) => <CourseCard key={course.id} course={course} index={i} userLevel={getLevelFromXP(myPoints?.total_xp || 0)} />)}
          </div>
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" /> Members
            </h2>
            <span className="text-xs text-gray-400">{members.length} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="relative group" title={m.full_name || m.email}>
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-sm font-bold">
                      {(m.full_name || m.email || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {user?.role === "admin" && m.email !== user?.email && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${m.full_name || m.email}?`)) return;
                      await base44.entities.User.delete(m.id);
                      queryClient.invalidateQueries({ queryKey: ["allMembers"] });
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      {topLearners.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Top Learners
            </h2>
            <Link to={createPageUrl("Leaderboard")} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium">
              Full leaderboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
            {topLearners.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 text-center text-sm font-bold text-gray-400">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                  {(entry.user_name || entry.user_email || "?")[0].toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{entry.user_name || entry.user_email}</span>
                <span className="text-sm text-fuchsia-600 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> {entry.total_xp || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}