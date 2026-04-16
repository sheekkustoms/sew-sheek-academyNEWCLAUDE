import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, CheckCircle, ChevronRight, Clock, BookOpen, Zap } from "lucide-react";
import MembershipGate from "@/components/membership/MembershipGate";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import PlacementQuiz from "@/components/assessment/PlacementQuiz";
import PlacementResults from "@/components/assessment/PlacementResults";
import PersonalizedPath from "@/components/assessment/PersonalizedPath";

export default function MyPath() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assessmentState, setAssessmentState] = useState("check");
  const [quizData, setQuizData] = useState(null);
  const [assignedTier, setAssignedTier] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const viewingEmail = usePreviewEmail(user);
  useActivityTracker(user, "MyPath");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["pathCourses"],
    queryFn: () => base44.entities.Course.list("order", 100),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", viewingEmail],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: viewingEmail }),
    enabled: !!viewingEmail,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => base44.entities.Lesson.list("order", 500),
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ["myQuizResults", viewingEmail],
    queryFn: () => base44.entities.DailyChallenge.filter({ user_email: viewingEmail }),
    enabled: !!viewingEmail,
  });

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["placementAssessment", viewingEmail],
    queryFn: () => base44.entities.PlacementAssessment.filter({ user_email: viewingEmail }).then(r => r[0] || null),
    enabled: !!viewingEmail,
  });

  useEffect(() => {
    if (!user || assessmentLoading || assessmentState !== "check" || isLoading) return;
    if (assessment && assessment.completed) {
      const daysAgo = (Date.now() - new Date(assessment.created_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < 60) {
        // 3-day replay students: if path activated, send them to the 3-day course
        if (assessment.path_view === "3day_replay" && assessment.path_activated) {
          const threeDayCourse = published.find(c => c.title && c.title.includes("3 Day Replay"));
          if (threeDayCourse) {
            navigate(`${createPageUrl("CourseDetail")}?id=${threeDayCourse.id}`, { replace: true });
            return;
          }
        }
        
        // 3-day replay students skip the game entirely
        const is3DayReplay = assessment.path_view === "3day_replay";
        // If launch game not done yet and not 3day_replay, send them there (regardless of path_activated)
        if (!assessment.launch_game_completed && !is3DayReplay) {
          const pathMap = { tier_1: "beginner", tier_2: "intermediate", tier_3: "advanced" };
          navigate(`${createPageUrl("LaunchGame")}?path=${pathMap[assessment.tier] || "beginner"}`, { replace: true });
          return;
        }
        // After game is done, only show the path if admin has activated it
        if (assessment.path_activated) {
          setAssessmentState("path");
        } else {
          setAssessmentState("results");
          setAssignedTier(assessment.tier);
        }
      } else {
        setAssessmentState("quiz");
      }
    } else if (assessment === null) {
      setAssessmentState("quiz");
    }
  }, [user, assessment, assessmentLoading, assessmentState, published, navigate]);

  const saveAssessmentMutation = useMutation({
    mutationFn: async (data) => {
      const { answers, experienceScore } = data;
      
      let tier, startPhase, startModule;
      if (experienceScore <= 10) {
        tier = "tier_1";
        startPhase = "Phase 1";
        startModule = 1;
      } else if (experienceScore <= 16) {
        tier = "tier_2";
        startPhase = "Phase 1";
        startModule = 3;
      } else {
        tier = "tier_3";
        const isSublamation = answers[6] === 2;
        startPhase = isSublamation ? "Phase 3" : "Phase 2";
        startModule = 1;
      }

      const res = await base44.functions.invoke('saveAssessment', {
        answers,
        experienceScore,
        tier,
        startPhase,
        startModule,
      });

      setAssignedTier(res.data.tier);
      setAssessmentState("results");
    },
    onError: (error) => {
      console.error("[MyPath] Mutation error:", error);
    }
  });

  const published = courses.filter(c => c.is_published).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const enrollmentMap = {};
  enrollments.forEach(e => { enrollmentMap[e.course_id] = e; });

  const completedCount = enrollments.filter(e => e.is_completed).length;

  // Check if user passed the quiz for a given course with ≥90%
  const passedQuizForCourse = (courseId) => {
    return quizResults.some(r =>
      r.course_id === courseId &&
      r.total_questions > 0 &&
      (r.score / r.total_questions) >= 0.9
    );
  };

  // Show loading spinner while determining assessment state
  if (assessmentState === "check") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#6B3FA0]/20 border-t-[#6B3FA0] rounded-full animate-spin" />
      </div>
    );
  }

  if (assessmentState === "quiz") {
    return (
      <PlacementQuiz
        onComplete={(data) => {
          setQuizData(data);
          saveAssessmentMutation.mutate(data);
        }}
      />
    );
  }

  if (assessmentState === "results" && assignedTier) {
    return (
      <PlacementResults
        tier={assignedTier}
        pathActivated={assessment?.path_activated || false}
        gameCompleted={assessment?.launch_game_completed || false}
        onStart={() => {
          if (assessment?.path_activated) {
            setAssessmentState("path");
            queryClient.invalidateQueries({ queryKey: ["placementAssessment", user?.email] });
          }
        }}
      />
    );
  }

  if (assessmentState === "path" && assessment) {
    return (
      <PersonalizedPath tier={assessment.tier} assessment={assessment} />
    );
  }

  // Determine which courses are unlocked:
  // - First course: always unlocked
  // - Subsequent courses: require passing the quiz linked to the previous course with ≥90%
  const courseStatuses = published.map((course, idx) => {
    const enrollment = enrollmentMap[course.id];
    const isCompleted = enrollment?.is_completed || false;
    const progress = enrollment?.progress_percent || 0;
    const isActive = !isCompleted && progress > 0;
    let isUnlocked = idx === 0; // First course always unlocked
    if (idx > 0) {
      const prevCourse = published[idx - 1];
      isUnlocked = passedQuizForCourse(prevCourse.id);
    }
    const courseLessons = lessons.filter(l => l.course_id === course.id);
    return { course, enrollment, isCompleted, isActive, isUnlocked, progress, lessonCount: courseLessons.length };
  });

  return (
    <MembershipGate user={user}>
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">My Learning Path</h1>
          <p className="text-sm text-[#666] mt-1">Pass the weekly quiz with 90% or higher to unlock the next course</p>
        </div>

        {/* Progress summary */}
        {completedCount > 0 && (
          <div className="bg-gradient-to-r from-[#6B3FA0] to-[#8B5CC0] rounded-2xl p-4 text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-[#D4A017]" />
            </div>
            <div>
              <p className="text-sm font-bold">{completedCount} course{completedCount !== 1 ? "s" : ""} completed!</p>
              <p className="text-xs text-white/70">Keep going — every course unlocks new skills</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-[#EEEEEE] animate-pulse" />
            ))}
          </div>
        ) : published.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50 rounded-3xl border border-[#6B3FA0]/10 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-[#6B3FA0]/10 flex items-center justify-center mb-5">
              <BookOpen className="w-9 h-9 text-[#6B3FA0]" />
            </div>
            <h3 className="text-lg font-extrabold text-[#111] mb-2">Your path is being built!</h3>
            <p className="text-sm text-[#666] leading-relaxed mb-6">
              Your learning path is being crafted just for you — check back soon!<br />
              In the meantime, explore the Library.
            </p>
            <Link to={createPageUrl("Library")} className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#F0D060] transition-colors shadow-md shadow-[#D4AF37]/20 text-sm">
              🎬 Explore the Library
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[#EEEEEE] z-0" />

            <div className="space-y-4 relative z-10">
              {courseStatuses.map(({ course, enrollment, isCompleted, isActive, isUnlocked, progress, lessonCount }, idx) => (
                <div key={course.id} className="flex gap-4 items-start">
                  {/* Node indicator */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isCompleted ? "bg-[#D4A017] border-[#D4A017]" :
                    isActive ? "bg-[#6B3FA0] border-[#6B3FA0] animate-pulse" :
                    isUnlocked ? "bg-white border-[#6B3FA0]" :
                    "bg-[#F5F5F5] border-[#DDDDDD]"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : !isUnlocked ? (
                      <Lock className="w-4 h-4 text-[#BBBBBB]" />
                    ) : (
                      <span className="text-sm font-bold text-[#6B3FA0]">{idx + 1}</span>
                    )}
                  </div>

                  {/* Course card */}
                  <div className={`flex-1 rounded-2xl border p-4 transition-all ${
                    isCompleted ? "bg-white border-[#D4A017]/30" :
                    isActive ? "bg-white border-[#6B3FA0]/50 shadow-md" :
                    isUnlocked ? "bg-white border-[#EEEEEE] hover:shadow-md hover:border-[#6B3FA0]/30" :
                    "bg-[#F9F9F9] border-[#EEEEEE] opacity-60"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isCompleted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4A017]/15 text-[#B8960C] uppercase">✓ Complete</span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6B3FA0]/15 text-[#6B3FA0] uppercase">In Progress</span>
                          )}
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 uppercase">🔒 Quiz Required</span>
                          )}
                        </div>
                        <h3 className={`font-bold text-sm leading-snug ${!isUnlocked ? "text-[#AAAAAA]" : "text-[#111]"}`}>
                          {course.title}
                        </h3>
                        {course.description && isUnlocked && (
                          <p className="text-xs text-[#666] mt-1 line-clamp-2">{course.description}</p>
                        )}
                        {!isUnlocked && idx > 0 && (
                          <p className="text-xs text-[#AAAAAA] mt-1">Score 90%+ on the Weekly Challenge to unlock</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {lessonCount > 0 && (
                            <span className="text-[10px] text-[#999] flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {course.xp_reward > 0 && isUnlocked && (
                            <span className="text-[10px] text-[#B8960C] flex items-center gap-1">
                              <Zap className="w-3 h-3" /> {course.xp_reward} XP
                            </span>
                          )}
                        </div>
                        {/* Progress bar for active */}
                        {(isActive || isCompleted) && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#EEEEEE] rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-[#D4A017]" : "bg-[#6B3FA0]"}`}
                                  style={{ width: `${isCompleted ? 100 : progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[#999] shrink-0">{isCompleted ? 100 : progress}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {isUnlocked && (
                        <Link to={`${createPageUrl("CourseDetail")}?id=${course.id}`} className="shrink-0">
                          <button className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                            isCompleted ? "bg-[#D4A017]/10 text-[#B8960C] hover:bg-[#D4A017]/20" :
                            isActive ? "bg-[#6B3FA0] text-white hover:bg-[#5A3490]" :
                            "bg-[#F5F5F5] text-[#6B3FA0] hover:bg-[#6B3FA0]/10"
                          }`}>
                            {isCompleted ? "Review" : isActive ? "Resume" : "Start"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MembershipGate>
  );
}