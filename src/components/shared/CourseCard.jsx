import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Play, Zap, BookOpen } from "lucide-react";
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

export default function CourseCard({ course, enrollment, index = 0 }) {
  const gradient = categoryGradients[course.category] || "from-gray-500 to-gray-600";
  const progress = enrollment?.progress_percent || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={createPageUrl("CourseDetail") + `?id=${course.id}`}>
        <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all duration-300 shadow-sm">
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
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-emerald-300 text-xs font-bold bg-black/30 rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3" /> +{course.xp_reward} XP
            </div>
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
                  <span className="text-gray-400">Progress</span>
                  <span className="text-violet-600 font-semibold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}