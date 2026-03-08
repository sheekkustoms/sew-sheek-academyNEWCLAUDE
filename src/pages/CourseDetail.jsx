import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, Circle, ArrowLeft, Zap, Clock, BookOpen, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";

export default function CourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => { const r = await base44.entities.Course.filter({ id: courseId }); return r[0]; },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => base44.entities.Lesson.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0)), [lessons]);

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", courseId, user?.email],
    queryFn: async () => {
      const r = await base44.entities.Enrollment.filter({ user_email: user.email, course_id: courseId });
      return r[0] || null;
    },
    enabled: !!user?.email && !!courseId,
  });

  const { data: myPoints } = useQuery({
    queryKey: ["myPointsDetail", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Enrollment.create({ user_email: user.email, course_id: courseId, completed_lessons: [], progress_percent: 0, is_completed: false });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["enrollment"] }); queryClient.invalidateQueries({ queryKey: ["myEnrollments"] }); },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId) => {
      if (!enrollment) return;
      const completed = [...(enrollment.completed_lessons || [])];
      if (completed.includes(lessonId)) return;
      completed.push(lessonId);
      const progress = Math.round((completed.length / sortedLessons.length) * 100);
      const isCompleted = progress >= 100;
      await base44.entities.Enrollment.update(enrollment.id, { completed_lessons: completed, progress_percent: progress, is_completed: isCompleted });
      if (myPoints) {
        const lesson = sortedLessons.find((l) => l.id === lessonId);
        const xpAmount = lesson?.xp_reward || 20;
        const extraUpdates = { lessons_completed: (myPoints.lessons_completed || 0) + 1 };
        if (isCompleted) { extraUpdates.courses_completed = (myPoints.courses_completed || 0) + 1; }
        await awardXP(myPoints.id, myPoints, isCompleted ? xpAmount + (course?.xp_reward || 100) : xpAmount, extraUpdates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["myPointsDetail", "dashboardPoints", "myPoints", "myEnrollments"] });
    },
  });

  const completedLessons = enrollment?.completed_lessons || [];
  const activeLesson = selectedLesson || sortedLessons.find((l) => !completedLessons.includes(l.id)) || sortedLessons[0];

  if (courseLoading) return <div className="max-w-5xl mx-auto h-80 bg-white rounded-2xl animate-pulse border border-gray-100" />;

  if (!course) return (
    <div className="max-w-5xl mx-auto text-center py-20">
      <p className="text-gray-500">Course not found</p>
      <Link to={createPageUrl("Courses")}><Button variant="outline" className="mt-4">Back to Courses</Button></Link>
    </div>
  );

  const difficultyColor = { beginner: "bg-emerald-100 text-emerald-700 border-emerald-200", intermediate: "bg-amber-100 text-amber-700 border-amber-200", advanced: "bg-red-100 text-red-700 border-red-200" };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to={createPageUrl("Courses")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Video player */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg">
            {activeLesson?.video_url ? (
              (() => {
                const url = activeLesson.video_url;
                const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                if (ytMatch) {
                  return <iframe key={activeLesson.id} className="w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
                } else if (vimeoMatch) {
                  return <iframe key={activeLesson.id} className="w-full h-full" src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
                } else {
                  return <video key={activeLesson.id} controls className="w-full h-full object-contain" src={url} />;
                }
              })()
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <Play className="w-16 h-16 mb-2 opacity-30" />
                <p className="text-sm">{enrollment ? "Select a lesson to start" : "Enroll to start watching"}</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xl font-bold text-gray-900">{activeLesson.title}</h2>
              {activeLesson.description && <p className="text-sm text-gray-500 mt-2">{activeLesson.description}</p>}
              {enrollment && !completedLessons.includes(activeLesson.id) && (
                <Button onClick={() => completeLessonMutation.mutate(activeLesson.id)} disabled={completeLessonMutation.isPending}
                  className="mt-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm shadow-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete (+{activeLesson.xp_reward || 20} XP)
                </Button>
              )}
              {enrollment && completedLessons.includes(activeLesson.id) && (
                <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Completed!
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-sm text-gray-500">{course.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={`${difficultyColor[course.difficulty]} border`}>{course.difficulty}</Badge>
              <Badge variant="outline" className="text-gray-500 border-gray-200 capitalize">{course.category?.replace(/_/g, " ")}</Badge>
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><Zap className="w-3 h-3 mr-1" /> +{course.xp_reward || 100} XP</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!enrollment ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 rounded-2xl p-6 text-center shadow-xl shadow-pink-200">
              <BookOpen className="w-10 h-10 text-white/80 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Ready to start?</h3>
              <p className="text-sm text-pink-100 mb-4">Enroll now and start earning XP</p>
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}
                className="w-full bg-white text-violet-700 hover:bg-pink-50 font-bold shadow-md">
                Enroll for Free
              </Button>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-sm text-violet-600 font-bold">{enrollment.progress_percent}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${enrollment.progress_percent}%` }} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-700">Lessons ({sortedLessons.length})</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {sortedLessons.map((lesson, i) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isActive = activeLesson?.id === lesson.id;
                  return (
                    <motion.button key={lesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => enrollment && setSelectedLesson(lesson)} disabled={!enrollment}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isActive ? "bg-violet-50" : "hover:bg-gray-50"} ${!enrollment ? "opacity-50" : ""}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        : !enrollment ? <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                        : <Circle className={`w-5 h-5 shrink-0 ${isActive ? "text-violet-500" : "text-gray-300"}`} />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCompleted ? "text-gray-400" : "text-gray-800"}`}>{lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          {lesson.duration_minutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {lesson.duration_minutes}m</span>}
                          <span className="flex items-center gap-0.5 text-emerald-500 font-medium"><Zap className="w-3 h-3" /> +{lesson.xp_reward || 20}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}