import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Scissors } from "lucide-react";
import CourseCard from "../components/shared/CourseCard";
import { getLevelFromXP } from "../components/shared/XPBar";
import { getOrCreateUserPoints } from "../components/shared/useUserPoints";

export default function Courses() {
  const [search, setSearch] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.filter({ is_published: true }),
  });
  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: myPoints } = useQuery({
    queryKey: ["myPointsCourses", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });
  const userLevel = getLevelFromXP(myPoints?.total_xp || 0);

  const filtered = courses.filter((c) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scissors className="w-6 h-6 text-pink-500" /> Sewing Academy Courses
        </h1>
        <p className="text-sm text-rose-500 font-medium mt-0.5">Learn to sew, create, and earn XP along the way</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-rose-200 focus:border-rose-400 bg-white"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-rose-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-rose-100">
          <BookOpen className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No courses found</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon for new sewing courses!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={enrollments.find((e) => e.course_id === course.id)}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}