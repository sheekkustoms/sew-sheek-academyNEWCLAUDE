import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Play, Zap, BookOpen, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryGradients = {
  development: "from-blue-500 to-indigo-600",
  design: "from-pink-500 to-rose-600",
  marketing: "from-amber-400 to-orange-500",
  business: "from-emerald-500 to-green-600",
  data_science: "from-violet-500 to-purple-600",
  personal_development: "from-cyan-500 to-teal-500",
};

const difficultyColors = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

export default function CourseCard({ course, enrollment, index = 0, userLevel = 0 }) {
  const gradient = categoryGradients[course.category] || "from-gray-500 to-gray-600";
  // Compute progress from actual completed lessons for accuracy
  const completedCount = enrollment?.completed_lessons?.length || 0;
  const totalLessons = course.lesson_count || 0;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : (enrollment?.progress_percent || 0);
  const requiredLevel = course.unlock_at_level || 0;
  const isLocked = requiredLevel > 0 && userLevel < requiredLevel;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={isLocked ? "#" : createPageUrl("CourseDetail") + `?id=${course.id}`} onClick={e => isLocked && e.preventDefault()}>
        <div className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${isLocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:border-violet-200"}`}>
          <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-3 right-3">
              <Badge className={`${difficultyColors[course.difficulty]} border text-[10px] uppercase tracking-wider`}>{course.difficulty}</Badge>
            </div>

            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                <Lock className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">Unlock at Level {requiredLevel}</span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1">{course.title}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {course.lesson_count || 0} lessons</span>
              <span className="capitalize text-gray-500">{course.category?.replace(/_/g, " ")}</span>
            </div>
            {enrollment && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    {totalLessons > 0 ? `${completedCount} / ${totalLessons} lessons` : "Progress"}
                  </span>
                  <span className={`font-bold ${progress === 100 ? "text-emerald-500" : "text-violet-600"}`}>
                    {progress === 100 ? "✓ Complete" : `${progress}%`}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${progress === 100 ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-pink-500 to-violet-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}