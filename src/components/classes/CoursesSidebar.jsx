import React from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";

export default function CoursesSidebar({ courses, enrollments, selectedCourseId, onSelect, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm sticky top-6 max-h-[calc(100vh-8rem)] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {courses.length} Course{courses.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-y-auto flex-1">
        {courses.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            No courses yet
          </div>
        ) : (
          courses.map(course => {
            const enrollment = enrollments?.find(e => e.course_id === course.id);
            const isSelected = selectedCourseId === course.id;
            const progress = enrollment?.progress_percent || 0;
            const isCompleted = enrollment?.is_completed;

            return (
              <button
                key={course.id}
                onClick={() => onSelect(course.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-all last:border-0 ${
                  isSelected ? "bg-gray-50 border-l-2 border-l-gray-900" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate leading-snug ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                      {course.title}
                    </p>
                    {course.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{course.description}</p>
                    )}
                    {enrollment ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <>
                            <div className="flex-1 bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-gray-700 h-1 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">{progress}%</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="mt-1 inline-block text-[10px] text-gray-400">Not enrolled</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}