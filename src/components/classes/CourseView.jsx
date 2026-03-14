import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, CheckCircle2, FileDown, Star, Lock } from "lucide-react";
import LessonSidebar from "./LessonSidebar";
import LessonViewer from "./LessonViewer";
import { getOrCreateUserPoints, awardXP } from "../shared/useUserPoints";

export default function CourseView({ course, user, enrollment: initialEnrollment }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const queryClient = useQueryClient();

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons", course.id],
    queryFn: () => base44.entities.Lesson.filter({ course_id: course.id }),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", course.id],
    queryFn: () => base44.entities.Module.filter({ course_id: course.id }),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollment", course.id, user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email, course_id: course.id }),
    enabled: !!user?.email,
  });

  const enrollment = enrollments[0] || null;
  const sortedLessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Auto-select first lesson
  useEffect(() => {
    if (sortedLessons.length > 0 && !activeLesson) {
      setActiveLesson(sortedLessons[0]);
    }
  }, [sortedLessons.length]);

  // Reset when course changes
  useEffect(() => {
    setActiveLesson(null);
  }, [course.id]);

  const enrollMutation = useMutation({
    mutationFn: () => base44.entities.Enrollment.create({
      user_email: user.email,
      course_id: course.id,
      completed_lessons: [],
      progress_percent: 0,
      is_completed: false,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollment", course.id, user?.email] }),
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
        await awardXP(pts.id, pts, lesson.xp_reward || 20, {
          lessons_completed: (pts.lessons_completed || 0) + 1,
          ...(isCourseComplete ? { courses_completed: (pts.courses_completed || 0) + 1 } : {}),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", course.id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ["myPoints", user?.email] });
    },
  });

  const isLessonCompleted = (id) => (enrollment?.completed_lessons || []).includes(id);
  const progress = enrollment?.progress_percent || 0;

  // Find next incomplete lesson
  const nextLesson = sortedLessons.find(l => !isLessonCompleted(l.id));

  return (
    <div className="flex flex-col gap-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Course header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-start gap-4 min-w-0">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200" />
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{course.title}</h2>
            {course.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lessons.length} lessons</span>
              {enrollment && <span className="capitalize">{course.difficulty}</span>}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {!enrollment ? (
            <Button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
            >
              <Play className="w-4 h-4" /> {enrollMutation.isPending ? "Enrolling..." : "Start Course"}
            </Button>
          ) : enrollment.is_completed ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
              <Star className="w-4 h-4" /> Course Completed!
            </div>
          ) : (
            <Button
              onClick={() => nextLesson && setActiveLesson(nextLesson)}
              className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
            >
              <Play className="w-4 h-4" /> Continue
            </Button>
          )}
          {enrollment && (
            <div className="flex items-center gap-2 text-xs text-gray-500 w-40">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div className="bg-gray-700 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="shrink-0">{progress}%</span>
            </div>
          )}
          {course.pdf_url && enrollment && (
            <a href={course.pdf_url} target="_blank" rel="noopener noreferrer" download>
              <Button variant="outline" size="sm" className="gap-1.5 border-gray-200 text-gray-600 text-xs">
                <FileDown className="w-3.5 h-3.5" /> Course PDF
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Two-column: lessons + content */}
      <div className="flex min-h-[60vh]">
        {/* Left: modules/lessons */}
        <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto max-h-[72vh]">
          <LessonSidebar
            modules={sortedModules}
            lessons={sortedLessons}
            activeLesson={activeLesson}
            enrollment={enrollment}
            isLessonCompleted={isLessonCompleted}
            onSelectLesson={(lesson) => {
              if (enrollment || sortedLessons.indexOf(lesson) === 0) {
                setActiveLesson(lesson);
              }
            }}
          />
        </div>

        {/* Right: lesson content */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[72vh]">
          {activeLesson ? (
            <LessonViewer
              lesson={activeLesson}
              enrollment={enrollment}
              isCompleted={isLessonCompleted(activeLesson.id)}
              onComplete={() => completeLessonMutation.mutate(activeLesson)}
              isCompletingPending={completeLessonMutation.isPending}
              user={user}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-20">
              <Play className="w-12 h-12 text-gray-200" />
              <p className="text-sm">Select a lesson to begin</p>
              {!enrollment && (
                <p className="text-xs text-gray-300">Enroll to unlock all lessons</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}