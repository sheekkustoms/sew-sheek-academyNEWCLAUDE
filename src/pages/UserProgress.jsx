import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BookOpen, Award, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const BadgeIcon = ({ badgeName }) => {
  const badges = {
    "First Steps": "👣", "Streak Master": "🔥", "Course Conqueror": "🏆",
    "Community Star": "⭐", "Perfect Score": "💯", "Week Warrior": "⚔️"
  };
  return <span className="text-2xl">{badges[badgeName] || "🎖️"}</span>;
};

export default function UserProgress() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPoints = [] } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["allLessons"],
    queryFn: () => base44.entities.Lesson.list(),
  });

  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ["myDailyChallenges", user?.email],
    queryFn: () => base44.entities.DailyChallenge.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const myPoints = userPoints[0];

  // Course completion data
  const courseData = useMemo(() => {
    return enrollments.map((enrollment) => {
      const course = courses.find(c => c.id === enrollment.course_id);
      const courseLessons = lessons.filter(l => l.course_id === enrollment.course_id);
      return {
        name: course?.title || "Unknown",
        progress: enrollment.progress_percent || 0,
        completed: enrollment.is_completed ? "✓" : "",
        lessonsCompleted: enrollment.completed_lessons?.length || 0,
        totalLessons: courseLessons.length,
      };
    });
  }, [enrollments, courses, lessons]);

  // XP trend over last 30 days
  const xpTrendData = useMemo(() => {
    const last30Days = {};
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('MMM D');
      last30Days[date] = 0;
    }

    dailyChallenges.forEach(dc => {
      const date = moment(dc.challenge_date).format('MMM D');
      if (last30Days.hasOwnProperty(date)) {
        last30Days[date] += dc.xp_earned || 0;
      }
    });

    return Object.entries(last30Days).map(([date, xp]) => ({ date, xp }));
  }, [dailyChallenges]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-sm text-gray-500">Track your learning journey</p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-xs text-gray-500 font-semibold">Total XP</p>
          <p className="text-2xl font-bold text-fuchsia-600 flex items-center gap-2">
            <Zap className="w-5 h-5" /> {myPoints?.total_xp || 0}
          </p>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs text-gray-500 font-semibold">Courses Completed</p>
          <p className="text-2xl font-bold text-violet-600">{myPoints?.courses_completed || 0}</p>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs text-gray-500 font-semibold">Lessons Completed</p>
          <p className="text-2xl font-bold text-pink-600">{myPoints?.lessons_completed || 0}</p>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs text-gray-500 font-semibold">Badges Earned</p>
          <p className="text-2xl font-bold text-amber-600">{myPoints?.badges?.length || 0}</p>
        </Card>
      </div>

      {/* Course Completion */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold text-gray-900">Course Progress</h2>
        </div>
        {courseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="progress" fill="#ec4899" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No courses enrolled yet</p>
        )}
      </Card>

      {/* XP Trend */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-pink-600" />
          <h2 className="text-lg font-bold text-gray-900">XP Trend (Last 30 Days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={xpTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis />
            <Tooltip formatter={(value) => `${value} XP`} />
            <Line type="monotone" dataKey="xp" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Badges */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Badges Earned</h2>
        </div>
        {myPoints?.badges?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {myPoints.badges.map((badge, idx) => (
              <div key={idx} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-100">
                <BadgeIcon badgeName={badge} />
                <p className="text-sm font-semibold text-gray-800 mt-2">{badge}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No badges earned yet. Keep learning!</p>
        )}
      </Card>
    </div>
  );
}