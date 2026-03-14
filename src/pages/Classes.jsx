import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Video, Download } from "lucide-react";
import CoursesSidebar from "../components/classes/CoursesSidebar";
import CourseView from "../components/classes/CourseView";
import AdminCourseEditor from "../components/admin/CourseManager";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import moment from "moment";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "replays", label: "Replays" },
];

export default function Classes() {
  const [filter, setFilter] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showAdminEditor, setShowAdminEditor] = useState(false);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 200),
  });

  const { data: userEnrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const publishedCourses = courses
    .filter(c => c.is_published)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Auto-select first course
  useEffect(() => {
    if (publishedCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(publishedCourses[0].id);
    }
  }, [publishedCourses.length]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111] tracking-tight">Classes</h1>
            <p className="text-sm text-[#666] mt-0.5">Learn at your own pace</p>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-white border border-[#EEEEEE] rounded-2xl p-1.5 shadow-sm">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  filter === f.value ? "bg-black text-[#D4AF37]" : "text-[#666] hover:text-[#111] hover:bg-[#F5F5F5]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowAdminEditor(true)}
            className="gap-2 bg-black hover:bg-[#222] text-[#D4AF37] font-semibold rounded-xl"
          >
            <Settings className="w-4 h-4" /> Manage
          </Button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 min-h-[75vh]">
        <div className="w-72 shrink-0">
          <CoursesSidebar
            courses={publishedCourses}
            enrollments={userEnrollments}
            selectedCourseId={selectedCourseId}
            onSelect={setSelectedCourseId}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 min-w-0">
          {selectedCourse ? (
            <CourseView
              course={selectedCourse}
              user={user}
              enrollment={userEnrollments.find(e => e.course_id === selectedCourseId) || null}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
              <p className="text-sm">Select a course to get started</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <Dialog open={showAdminEditor} onOpenChange={setShowAdminEditor}>
          <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden rounded-2xl border border-[#EEEEEE]">
            <AdminCourseEditor />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}