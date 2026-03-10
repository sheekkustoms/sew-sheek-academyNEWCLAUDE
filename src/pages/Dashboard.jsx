import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Loader2, Play, MessageSquare, Trophy, Calendar, TrendingUp,
  ChevronRight, BookOpen, Zap, Bell, CheckCheck, Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/components/shared/useDisplayName";
import moment from "moment";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const DashboardCard = ({ title, children, action, actionLabel }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
    {action && actionLabel && (
      <div className="mt-6">
        <Link to={createPageUrl(action)}>
          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-colors">
            {actionLabel}
          </Button>
        </Link>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => base44.entities.Lesson.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ is_approved: true }, "-created_date", 5),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 3),
  });

  const { data: liveClasses = [] } = useQuery({
    queryKey: ["liveClasses"],
    queryFn: () => base44.entities.LiveClass.filter({ is_active: true }),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }),
    enabled: !!user?.email,
  });

  const { data: publishedQuizzes = [] } = useQuery({
    queryKey: ["publishedQuizzes"],
    queryFn: () => base44.entities.Quiz.filter({ is_published: true }),
  });

  const queryClient = useQueryClient();

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
    },
  });

  const myPoints = userPoints?.[0];
  const lastEnrollment = enrollments?.[0];
  const lastCourse = courses?.find(c => c.id === lastEnrollment?.course_id);
  const lastLesson = lessons?.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))?.[0];
  const nextLiveClass = liveClasses?.find(lc => new Date(lc.scheduled_at) > new Date());

  const recentActivity = posts?.slice(0, 3) || [];
  const topMembers = leaderboard?.slice(0, 3) || [];
  const liveQuizzes = publishedQuizzes.filter(q => q.quiz_type === "live" && (q.status === "waiting" || q.status === "active")).slice(0, 2);
  const practiceQuizzes = publishedQuizzes.filter(q => q.quiz_type === "practice").slice(0, 2);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome Header */}
       <div className="flex items-start justify-between">
         <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            Welcome back, {user.role === "admin" ? "Coach" : (getDisplayName(user)?.split(" ")[0] || "Member")}
          </h1>
         <p className="text-lg text-gray-600">
           {moment().hour() < 12 ? "Good morning" : moment().hour() < 18 ? "Good afternoon" : "Good evening"}. Continue your learning journey.
         </p>
         </div>
         {notifications.length > 0 && (
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => markAllRead.mutate()}
             disabled={markAllRead.isPending}
             className="gap-2 text-gray-600 whitespace-nowrap"
           >
             <CheckCheck className="w-4 h-4" /> Mark {notifications.length} as read
           </Button>
         )}
       </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Zap} label="Total Points" value={myPoints?.total_xp || 0} color="bg-yellow-500" />
        <StatCard icon={BookOpen} label="Courses" value={myPoints?.courses_completed || 0} color="bg-pink-400" />
        <StatCard icon={TrendingUp} label="Level" value={Math.floor((myPoints?.total_xp || 0) / 100) + 1} color="bg-gray-800" />
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Learning */}
        <DashboardCard title="Continue Learning" action="Courses" actionLabel="Browse Courses">
          {lastCourse ? (
            <div className="space-y-4">
              {lastCourse.thumbnail_url && (
                <img src={lastCourse.thumbnail_url} alt="" className="w-full h-40 object-cover rounded-lg" />
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Course</p>
                <h4 className="text-lg font-semibold text-gray-900">{lastCourse.title}</h4>
                <p className="text-sm text-gray-600 mt-2">
                  {lastEnrollment?.progress_percent || 0}% Complete
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${lastEnrollment?.progress_percent || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">Start your first course to see progress here</p>
          )}
        </DashboardCard>

        {/* Latest Lesson */}
        <DashboardCard title="Latest Lesson" action="Courses" actionLabel="View Courses">
          {lastLesson ? (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">New Lesson Available</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{lastLesson.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{lastLesson.description}</p>
                <p className="text-xs text-gray-500 mt-3">
                  {lastLesson.duration_minutes} minutes
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">New lessons will appear here</p>
          )}
        </DashboardCard>

        {/* Community Activity */}
        <DashboardCard title="Community Activity" action="Community" actionLabel="View Community">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map(post => (
                <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{post.title}</h4>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                      {post.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    by {post.author_name || post.author_email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No community posts yet</p>
          )}
        </DashboardCard>

        {/* Leaderboard Snapshot */}
        <DashboardCard title="Top Members" action="Leaderboard" actionLabel="View Full Leaderboard">
          {topMembers.length > 0 ? (
            <div className="space-y-3">
              {topMembers.map((member, idx) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-600 w-6">{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{member.user_name || member.user_email}</p>
                      <p className="text-xs text-gray-500">{member.total_xp} XP</p>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">Leaderboard coming soon</p>
          )}
        </DashboardCard>

        {/* Upcoming Live Session */}
        <DashboardCard title="Live Room" action="LiveClasses" actionLabel="Join Now">
          {nextLiveClass ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-lg p-6 border border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-2">{nextLiveClass.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{nextLiveClass.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                  {moment(nextLiveClass.scheduled_at).format("MMM D, h:mm A")}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No live sessions scheduled yet</p>
          )}
        </DashboardCard>

        {/* Quiz Games */}
        <DashboardCard title="Quiz Games" action="QuizHome" actionLabel="Play More Quizzes">
          <div className="space-y-4">
            {liveQuizzes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-600 mb-2 uppercase">🔴 Live Games</p>
                {liveQuizzes.map(quiz => (
                  <Link key={quiz.id} to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=live`}>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{quiz.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Code: {quiz.game_code}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {practiceQuizzes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-violet-600 mb-2 uppercase">📋 Practice</p>
                {practiceQuizzes.map(quiz => (
                  <Link key={quiz.id} to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=practice`}>
                    <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{quiz.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{quiz.category?.replace(/_/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {liveQuizzes.length === 0 && practiceQuizzes.length === 0 && (
              <p className="text-gray-500 text-center py-6 text-sm">No quizzes available yet</p>
            )}
          </div>
        </DashboardCard>

        {/* Progress Overview */}
        <DashboardCard title="Your Progress">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">
                  {enrollments.length > 0
                    ? Math.round(
                        enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length
                      )
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-pink-400 h-3 rounded-full"
                  style={{
                    width: enrollments.length > 0
                      ? Math.round(
                          enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length
                        )
                      : 0
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Lessons Completed</p>
                <p className="text-2xl font-bold text-gray-900">{myPoints?.lessons_completed || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">{myPoints?.badges?.length || 0}</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}