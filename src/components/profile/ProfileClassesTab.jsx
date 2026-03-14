import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, ExternalLink } from "lucide-react";
import moment from "moment";

export default function ProfileClassesTab({ enrollments, courses }) {
  const sorted = [...enrollments].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
        <p className="text-sm">No classes enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(e => {
        const course = courses.find(c => c.id === e.course_id);
        if (!course) return null;
        return (
          <div key={e.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-violet-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                {e.is_completed && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[160px]">
                  <div
                    className={`h-1.5 rounded-full ${e.is_completed ? "bg-emerald-500" : "bg-gray-700"}`}
                    style={{ width: `${e.progress_percent || 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{e.progress_percent || 0}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Last activity {moment(e.updated_date).fromNow()}</p>
            </div>
            <Link to={createPageUrl(`CourseDetail?id=${course.id}`)}>
              <Button size="sm" variant="outline" className="gap-1.5 border-gray-200 text-gray-600 shrink-0 text-xs">
                <ExternalLink className="w-3.5 h-3.5" /> View
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}