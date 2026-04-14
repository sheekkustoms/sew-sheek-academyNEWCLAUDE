import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, MessageSquare, CheckCircle2 } from "lucide-react";
import moment from "moment";

export default function ProfileOverviewTab({ enrollments, courses, posts, comments }) {
  const activeEnrollments = enrollments
    .filter(e => !e.is_completed && e.progress_percent > 0)
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 3);

  const completedEnrollments = enrollments.filter(e => e.is_completed);

  // Recent activity: mix posts, comments, completions sorted by date
  const recentActivity = [
    ...posts.map(p => ({ type: "post", label: p.title, date: p.created_date, icon: MessageSquare })),
    ...comments.map(c => ({ type: "comment", label: c.content?.slice(0, 60) + (c.content?.length > 60 ? "…" : ""), date: c.created_date, icon: MessageSquare })),
    ...completedEnrollments.map(e => {
      const course = courses.find(c => c.id === e.course_id);
      return { type: "completion", label: `Completed: ${course?.title || "a course"}`, date: e.updated_date, icon: CheckCircle2 };
    }),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Currently Enrolled */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Currently Enrolled</h3>
        {activeEnrollments.length === 0 ? (
          <div className="text-center py-10 bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50 rounded-2xl border border-[#6B3FA0]/10">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-[#333] text-sm mb-1">No courses in progress yet</p>
            <p className="text-xs text-[#999] mb-4">Start your learning journey on My Path</p>
            <a href="/MyPath" className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#F0D060] transition-colors">
              🚀 Go to My Path
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEnrollments.map(e => {
              const course = courses.find(c => c.id === e.course_id);
              if (!course) return null;
              return (
                <div key={e.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-[#6B3FA0] h-1.5 rounded-full" style={{ width: `${e.progress_percent || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{e.progress_percent || 0}%</span>
                    </div>
                  </div>
                  <Link to={createPageUrl(`CourseDetail?id=${course.id}`)}>
                    <Button size="sm" className="gap-1.5 bg-[#6B3FA0] hover:bg-[#5A3490] text-white shrink-0 rounded-xl text-xs">
                      <Play className="w-3.5 h-3.5" /> Resume
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  a.type === "completion" ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  <a.icon className={`w-3.5 h-3.5 ${a.type === "completion" ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{a.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{moment(a.date).fromNow()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}