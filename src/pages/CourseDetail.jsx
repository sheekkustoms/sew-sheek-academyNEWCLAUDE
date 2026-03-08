import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Clock, Zap, CheckCircle2, Lock, Play,
  ChevronRight, Star, Users, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import VideoPlayer from "../components/shared/VideoPlayer";

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function CourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [activeLesson, setActiveLesson] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }).then(r => r[0]),
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => base44.entities.Lesson.filter({ course_id: courseId }),
    enabled: !!courseId,
    onSuccess: (data) => {
      if (data.length > 0 && !activeLesson) {
        setActiveLesson(data.sort((a, b) => (a.order || 0) - (b.order || 0))[0]);
      }
    },
  });

  const sortedLessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollment", courseId, user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email, course_id: courseId }),
    enabled: !!user?.email && !!courseId,
  });

  const enrollment = enrollments[0] || null;

  const enrollMutation = useMutation({
    mutationFn: () => base44.entities.Enrollment.create({
      user_email: user.email,
      course_id: courseId,
      completed_lessons: [],
      progress_percent: 0,
      is_completed: false,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollment", courseId, user?.email] }),
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lesson) => {
      if (!enrollment) return;
      const completed = enrollment.completed_lessons || [];
      if (completed.includes(lesson.id)) return;
      const newCompleted = [...completed, lesson.id];
      const progress = Math.round((newCompleted.length / lessons.length) * 100);
      const isCourseComplete = progress === 100;
      await base44.entities.Enrollment.update(enrollment.id, {
        completed_lessons: newCompleted,
        progress_percent: progress,
        is_completed: isCourseComplete,
      });
      const pts = await getOrCreateUserPoints(user);
      if (pts) {
        const extraUpdates = {
          lessons_completed: (pts.lessons_completed || 0) + 1,
        };
        if (isCourseComplete) {
          extraUpdates.courses_completed = (pts.courses_completed || 0) + 1;
        }
        await awardXP(pts.id, pts, lesson.xp_reward || 20, extraUpdates);
      }
      return { isCourseComplete };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId, user?.email] });
      queryClient.invalidateQueries({ queryKey: ["myPoints", user?.email] });
    },
  });

  const isLessonCompleted = (lessonId) => (enrollment?.completed_lessons || []).includes(lessonId);

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Link to={createPageUrl("Courses")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video player */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg">
            <VideoPlayer
              url={activeLesson?.video_url}
              lessonId={activeLesson?.id}
              enrollmentRequired={!enrollment}
            />
          </div>

          {/* Lesson info */}
          {activeLesson && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p className="text-sm text-gray-500 mt-1">{activeLesson.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-fuchsia-100 text-fuchsia-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> +{activeLesson.xp_reward || 20} XP
                  </Badge>
                </div>
              </div>
              {enrollment && !isLessonCompleted(activeLesson.id) && (
                <Button
                  onClick={() => completeLessonMutation.mutate(activeLesson)}
                  disabled={completeLessonMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-violet-500 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {completeLessonMutation.isPending ? "Marking..." : "Mark as Complete"}
                </Button>
              )}
              {isLessonCompleted(activeLesson.id) && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Completed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Course info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {course.thumbnail_url && (
              <img src={course.thumbnail_url} className="w-full h-40 object-cover" />
            )}
            <div className="p-5 space-y-3">
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
              {course.description && <p className="text-sm text-gray-500">{course.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Badge className={DIFFICULTY_COLORS[course.difficulty] || "bg-gray-100 text-gray-600"}>
                  {course.difficulty}
                </Badge>
                <Badge className="bg-fuchsia-100 text-fuchsia-700 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {course.xp_reward || 100} XP
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {lessons.length} lessons
                </Badge>
              </div>

              {course.pdf_url && enrollment && (
                <a href={course.pdf_url} target="_blank" rel="noopener noreferrer" download
                  className="w-full flex items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors">
                  <FileDown className="w-4 h-4" /> Download Course PDF
                </a>
              )}

              {!enrollment ? (
                <Button
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white"
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll Now — Free"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{enrollment.progress_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percent || 0}%` }}
                    />
                  </div>
                  {enrollment.is_completed && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                      <Star className="w-4 h-4" /> Course Completed!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lessons list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Lessons
            </div>
            <div className="divide-y divide-gray-50">
              {sortedLessons.map((lesson, i) => {
                const completed = isLessonCompleted(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <motion.button
                    key={lesson.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (enrollment || i === 0) setActiveLesson(lesson);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-violet-50" : "hover:bg-gray-50"
                    } ${!enrollment && i > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      completed ? "bg-emerald-100 text-emerald-600" : isActive ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {completed ? <CheckCircle2 className="w-4 h-4" /> : !enrollment && i > 0 ? <Lock className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-violet-700" : "text-gray-700"}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {lesson.duration_minutes > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{lesson.duration_minutes}m
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-fuchsia-400">
                          <Zap className="w-3 h-3" />+{lesson.xp_reward || 20}
                        </span>
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />}
                  </motion.button>
                );
              })}
              {sortedLessons.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No lessons yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}