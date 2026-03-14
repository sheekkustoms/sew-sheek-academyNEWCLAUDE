import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Loader2, Play, MessageSquare, Trophy, Calendar, TrendingUp,
  ChevronRight, BookOpen, Zap, Bell, CheckCheck, Gamepad2, Clock, CheckCircle, Download, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/components/shared/useDisplayName";
import { getLevelFromXP, loadThresholds } from "@/components/shared/XPBar";
import moment from "moment";
import ShopNow from "../components/dashboard/ShopNow";
import OnboardingModal from "../components/onboarding/OnboardingModal";
import OnboardingReminder from "../components/onboarding/OnboardingReminder";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-[11px] font-semibold text-[#999] uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-[#111]">{value}</p>
    </div>
  </div>
);

const DashboardCard = ({ title, children, action, actionLabel }) => (
  <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-bold text-[#111] tracking-tight">{title}</h3>
    </div>
    {children}
    {action && actionLabel && (
      <div className="mt-5">
        <Link to={createPageUrl(action)}>
          <Button className="w-full bg-black hover:bg-[#222] text-[#D4AF37] font-semibold rounded-xl h-10 transition-all hover:scale-[1.01]">
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

  const isAdmin = user?.role === "admin";

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

  const { data: allLiveClasses = [] } = useQuery({
    queryKey: ["allLiveClasses"],
    queryFn: () => base44.entities.LiveClass.list("-scheduled_at", 100),
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

  const { data: pendingPosts = [], refetch: refetchPending } = useQuery({
    queryKey: ["pendingPosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ is_approved: false }, "-created_date", 20),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();
  const approvePendingPost = useMutation({
    mutationFn: (id) => base44.entities.CommunityPost.update(id, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

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

  const [thresholds, setThresholds] = useState(null);
  useEffect(() => { loadThresholds(true).then(setThresholds); }, []);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(
    () => !!localStorage.getItem("onboarding_reminder_dismissed")
  );

  useEffect(() => {
    if (!user) return;
    const hasSeen = user.has_seen_onboarding || user.data?.has_seen_onboarding;
    if (!hasSeen) setShowOnboarding(true);
  }, [user?.email]);

  const completedSteps = user?.onboarding_steps || user?.data?.onboarding_steps || [];

  const handleMarkStep = async (stepId) => {
    const current = user?.onboarding_steps || user?.data?.onboarding_steps || [];
    if (current.includes(stepId)) return;
    const updated = [...current, stepId];
    await base44.auth.updateMe({ onboarding_steps: updated });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    await base44.auth.updateMe({ has_seen_onboarding: true });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const handleDismissReminder = () => {
    setReminderDismissed(true);
    localStorage.setItem("onboarding_reminder_dismissed", "1");
  };

  const myPoints = userPoints?.[0];
  const level = isAdmin ? 10 : (thresholds ? getLevelFromXP(myPoints?.total_xp || 0, thresholds) : getLevelFromXP(myPoints?.total_xp || 0));
  const lastEnrollment = enrollments?.[0];
  const lastCourse = courses?.find(c => c.id === lastEnrollment?.course_id);
  const lastLesson = lessons?.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))?.[0];
  const nextLiveClass = liveClasses?.find(lc => new Date(lc.scheduled_at) > new Date());
  const oneHourMs = 60 * 60 * 1000;
  const sewingPatterns = allLiveClasses.filter(
    c => c.pdf_url && new Date(c.scheduled_at).getTime() + oneHourMs <= Date.now()
  );

  const recentActivity = posts?.slice(0, 3) || [];
  const topMembers = leaderboard?.slice(0, 3) || [];
  const liveQuizzes = publishedQuizzes.filter(q => q.quiz_type === "live" && (q.status === "waiting" || q.status === "active")).slice(0, 2);
  const practiceQuizzes = publishedQuizzes.filter(q => q.quiz_type === "practice").slice(0, 2);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries({ type: "active" });
  }, [queryClient]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {showOnboarding && (
        <OnboardingModal
          onClose={handleCloseOnboarding}
          completedSteps={completedSteps}
          onMarkStep={handleMarkStep}
        />
      )}

      {/* Onboarding reminder */}
      {!showOnboarding && !reminderDismissed && completedSteps.length < 4 && (
        <OnboardingReminder
          completedSteps={completedSteps}
          onOpen={() => setShowOnboarding(true)}
          onDismiss={handleDismissReminder}
        />
      )}

      {/* Welcome Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#111] mb-1 tracking-tight">
            Welcome back, {getDisplayName(user)?.split(" ")[0] || "Member"} 👋
          </h1>
          <p className="text-[#666] text-sm">
            {moment().hour() < 12 ? "Good morning" : moment().hour() < 18 ? "Good afternoon" : "Good evening"} — continue your sewing journey.
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="gap-2 bg-black text-[#D4AF37] hover:bg-[#222] whitespace-nowrap shrink-0 rounded-xl font-semibold"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Zap} label="Total XP" value={myPoints?.total_xp || 0} color="bg-[#D4AF37]" />
        <StatCard icon={BookOpen} label="Courses Done" value={myPoints?.courses_completed || 0} color="bg-[#111]" />
        <StatCard icon={TrendingUp} label="Level" value={level} color="bg-[#333]" />
      </div>

      {/* Quick Nav Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { page: "Community", label: "Community", emoji: "💬", desc: "Posts & discussions" },
          { page: "Classes", label: "Classes", emoji: "🎓", desc: "Watch & learn" },
          { page: "LiveClasses", label: "Patterns", emoji: "📄", desc: "Download PDFs" },
          { page: "MemberProfile", label: "My Profile", emoji: "👤", desc: "View your progress" },
        ].map(item => (
          <Link key={item.page} to={createPageUrl(item.page)}>
            <div className="bg-white border border-[#EEEEEE] rounded-2xl p-4 hover:shadow-md hover:border-[#D4AF37] transition-all cursor-pointer group">
              <span className="text-2xl mb-2 block">{item.emoji}</span>
              <p className="font-bold text-[#111] text-sm">{item.label}</p>
              <p className="text-xs text-[#999] mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Admin: Pending Posts Alert */}
      {isAdmin && pendingPosts.length > 0 && (
        <div className="border border-[#D4AF37]/40 bg-[#D4AF37]/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base text-[#B8960C]">
            <Clock className="w-5 h-5" />
            {pendingPosts.length} Post{pendingPosts.length > 1 ? "s" : ""} Awaiting Approval
          </div>
          <div className="space-y-2">
            {pendingPosts.map(post => (
              <div key={post.id} className="flex items-start justify-between gap-3 bg-white rounded-xl p-3 border border-[#EEEEEE]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111] truncate">{post.title}</p>
                  <p className="text-xs text-[#999] mt-0.5">{post.author_name || post.author_email} · {moment.utc(post.created_date).local().fromNow()}</p>
                  <p className="text-xs text-[#666] mt-1 line-clamp-1">{post.content}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#2ECC71] hover:bg-[#27ae60] text-white h-8 text-xs gap-1 shrink-0 rounded-lg font-semibold"
                  onClick={() => approvePendingPost.mutate(post.id)}
                  disabled={approvePendingPost.isPending}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Now Section */}
      <ShopNow />

      {/* Sewing Patterns Library */}
      {sewingPatterns.length > 0 && (
        <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111]">Sewing Patterns</h3>
              <p className="text-xs text-[#999]">PDF patterns from all past live classes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sewingPatterns.map(cls => (
              <a
                key={cls.id}
                href={cls.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#EEEEEE] bg-[#F5F5F5] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111] truncate">{cls.title}</p>
                  <p className="text-xs text-[#999]">{moment(cls.scheduled_at).format("MMM D, YYYY")}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Learning */}
        <DashboardCard title="Continue Learning" action="Classes" actionLabel="Browse Classes">
          {lastCourse ? (
            <div className="space-y-4">
              {lastCourse.thumbnail_url && (
                <img src={lastCourse.thumbnail_url} alt="" className="w-full h-40 object-cover rounded-xl" />
              )}
              <div>
                <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wide mb-1">Last Course</p>
                <h4 className="text-base font-bold text-[#111]">{lastCourse.title}</h4>
                <p className="text-sm text-[#666] mt-1">{lastEnrollment?.progress_percent || 0}% Complete</p>
                <div className="w-full bg-[#EEEEEE] rounded-full h-2 mt-3">
                  <div className="bg-[#D4AF37] h-2 rounded-full transition-all" style={{ width: `${lastEnrollment?.progress_percent || 0}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[#999] py-8 text-center text-sm">Start your first course to see progress here</p>
          )}
        </DashboardCard>

        {/* Latest Lesson */}
        <DashboardCard title="Latest Lesson" action="Classes" actionLabel="View Classes">
          {lastLesson ? (
            <div className="space-y-4">
              <div className="bg-[#F5F5F5] rounded-xl p-6 text-center border border-[#EEEEEE]">
                <Play className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-sm text-[#666] font-medium">New Lesson Available</p>
              </div>
              <div>
                <h4 className="text-base font-bold text-[#111]">{lastLesson.title}</h4>
                <p className="text-sm text-[#666] mt-1">{lastLesson.description}</p>
                <p className="text-xs text-[#999] mt-2">{lastLesson.duration_minutes} minutes</p>
              </div>
            </div>
          ) : (
            <p className="text-[#999] py-8 text-center text-sm">New lessons will appear here</p>
          )}
        </DashboardCard>

        {/* Community Activity */}
        <DashboardCard title="Community Activity" action="Community" actionLabel="View Community">
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map(post => (
                <div key={post.id} className="border-b border-[#F5F5F5] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-[#111] text-sm leading-snug">{post.title}</h4>
                    <span className="text-[10px] bg-[#D4AF37]/10 text-[#B8960C] px-2 py-0.5 rounded-full font-semibold shrink-0 capitalize">
                      {post.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#666] line-clamp-2">{post.content}</p>
                  <p className="text-[11px] text-[#999] mt-1">by {post.author_name || post.author_email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] py-8 text-center text-sm">No community posts yet</p>
          )}
        </DashboardCard>

        {/* Leaderboard Snapshot */}
        <DashboardCard title="Top Members" action="Leaderboard" actionLabel="View Full Leaderboard">
          {topMembers.length > 0 ? (
            <div className="space-y-2">
              {topMembers.map((member, idx) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-xl border border-[#EEEEEE]">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${idx === 0 ? "text-[#D4AF37]" : "text-[#999]"}`}>{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-[#111] text-sm">{member.user_name || member.user_email}</p>
                      <p className="text-xs text-[#999]">{member.total_xp} XP</p>
                    </div>
                  </div>
                  <Zap className={`w-4 h-4 ${idx === 0 ? "text-[#D4AF37]" : "text-[#CFCFCF]"}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] py-8 text-center text-sm">Leaderboard coming soon</p>
          )}
        </DashboardCard>

        {/* Upcoming Live Session */}
        <DashboardCard title="Live Room" action="LiveClasses" actionLabel="Join Now">
          {nextLiveClass ? (
            <div className="bg-[#F5F5F5] rounded-xl p-5 border border-[#D4AF37]/30">
              <h4 className="font-bold text-[#111] mb-1">{nextLiveClass.title}</h4>
              <p className="text-sm text-[#666] mb-3">{nextLiveClass.description}</p>
              <div className="flex items-center gap-2 text-sm text-[#333] font-medium">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                {moment(nextLiveClass.scheduled_at).format("MMM D, h:mm A")}
              </div>
            </div>
          ) : (
            <p className="text-[#999] py-8 text-center text-sm">No live sessions scheduled yet</p>
          )}
        </DashboardCard>

        {/* Quiz Games */}
        <DashboardCard title="Quiz Games" action="QuizHome" actionLabel="Play More Quizzes">
          <div className="space-y-3">
            {liveQuizzes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#E74C3C] mb-2 uppercase tracking-widest">🔴 Live Games</p>
                {liveQuizzes.map(quiz => (
                  <Link key={quiz.id} to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=live`}>
                    <div className="p-3 bg-[#E74C3C]/5 border border-[#E74C3C]/20 rounded-xl hover:border-[#E74C3C]/40 transition-all mb-2">
                      <p className="font-semibold text-[#111] text-sm">{quiz.title}</p>
                      <p className="text-xs text-[#999] mt-0.5">Code: {quiz.game_code}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {practiceQuizzes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#333] mb-2 uppercase tracking-widest">📋 Practice</p>
                {practiceQuizzes.map(quiz => (
                  <Link key={quiz.id} to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=practice`}>
                    <div className="p-3 bg-[#F5F5F5] border border-[#EEEEEE] rounded-xl hover:border-[#D4AF37] transition-all mb-2">
                      <p className="font-semibold text-[#111] text-sm">{quiz.title}</p>
                      <p className="text-xs text-[#999] mt-0.5 capitalize">{quiz.category?.replace(/_/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {liveQuizzes.length === 0 && practiceQuizzes.length === 0 && (
              <p className="text-[#999] text-center py-6 text-sm">No quizzes available yet</p>
            )}
          </div>
        </DashboardCard>

        {/* Progress Overview */}
        <DashboardCard title="Your Progress">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#333]">Overall Progress</span>
                <span className="text-sm font-bold text-[#111]">
                  {enrollments.length > 0 ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length) : 0}%
                </span>
              </div>
              <div className="w-full bg-[#EEEEEE] rounded-full h-2.5">
                <div
                  className="bg-[#D4AF37] h-2.5 rounded-full transition-all"
                  style={{ width: `${enrollments.length > 0 ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length) : 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F5F5F5]">
              <div>
                <p className="text-[10px] text-[#999] uppercase tracking-widest font-semibold">Lessons Done</p>
                <p className="text-2xl font-bold text-[#111]">{myPoints?.lessons_completed || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#999] uppercase tracking-widest font-semibold">Badges</p>
                <p className="text-2xl font-bold text-[#111]">{myPoints?.badges?.length || 0}</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}