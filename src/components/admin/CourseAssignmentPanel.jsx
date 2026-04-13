import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, X, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CourseAssignmentPanel() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers", {});
      return res.data?.users || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 100),
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["enrollmentsForUser", selectedUser?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: selectedUser.email }),
    enabled: !!selectedUser?.email,
  });

  const enrollMutation = useMutation({
    mutationFn: ({ courseId }) =>
      base44.entities.Enrollment.create({
        user_email: selectedUser.email,
        course_id: courseId,
        completed_lessons: [],
        progress_percent: 0,
        is_completed: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollmentsForUser", selectedUser?.email] });
      toast.success("Course assigned!");
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId) => base44.entities.Enrollment.delete(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollmentsForUser", selectedUser?.email] });
      toast.success("Course removed.");
    },
  });

  const publishedCourses = courses.filter((c) => c.is_published !== false);
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.role !== "admin" &&
        (u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    );
  }, [allUsers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-violet-600 font-semibold text-base">
        <GraduationCap className="w-5 h-5" /> Assign Courses to Members
      </div>
      <p className="text-sm text-gray-500">Select a member, then toggle which courses they're enrolled in.</p>

      {/* Member picker */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-1">
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                selectedUser?.id === u.id
                  ? "bg-violet-50 border border-violet-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(u.full_name || u.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name || u.email}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              {selectedUser?.id === u.id && <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Course assignment */}
      {selectedUser && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-bold text-gray-800">
            Courses for <span className="text-violet-600">{selectedUser.full_name || selectedUser.email}</span>
          </p>
          {loadingEnrollments ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : publishedCourses.length === 0 ? (
            <p className="text-xs text-gray-400">No published courses yet.</p>
          ) : (
            <div className="space-y-2">
              {publishedCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const enrollment = enrollments.find((e) => e.course_id === course.id);
                return (
                  <div
                    key={course.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isEnrolled ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} className="w-12 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{course.title}</p>
                      {isEnrolled && (
                        <p className="text-[10px] text-green-600 font-medium">
                          Enrolled · {enrollment?.progress_percent || 0}% complete
                        </p>
                      )}
                    </div>
                    {isEnrolled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50 shrink-0"
                        onClick={() => unenrollMutation.mutate(enrollment.id)}
                        disabled={unenrollMutation.isPending}
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                        onClick={() => enrollMutation.mutate({ courseId: course.id })}
                        disabled={enrollMutation.isPending}
                      >
                        <Plus className="w-3.5 h-3.5" /> Assign
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}