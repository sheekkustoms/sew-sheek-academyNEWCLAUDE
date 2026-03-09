import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, BookOpen, Lock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LevelBadge = ({ level }) => {
  const colors = {
    1: "bg-green-100 text-green-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-purple-100 text-purple-700",
    4: "bg-pink-100 text-pink-700",
  };
  const labels = {
    1: "Foundations",
    2: "Beginner",
    3: "Intermediate",
    4: "Advanced",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[level] || colors[1]}`}>
      Level {level}: {labels[level]}
    </span>
  );
};

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: userEnrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myLevel = Math.floor((userPoints?.[0]?.total_xp || 0) / 100) + 1;

  // Filter and group courses
  const filteredCourses = courses
    .filter(c => c.is_published && (c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => (a.level || 1) - (b.level || 1));

  const coursesByLevel = {
    1: filteredCourses.filter(c => (c.level || 1) === 1),
    2: filteredCourses.filter(c => (c.level || 1) === 2),
    3: filteredCourses.filter(c => (c.level || 1) === 3),
    4: filteredCourses.filter(c => (c.level || 1) === 4),
  };

  const CourseCard = ({ course }) => {
    const enrollment = userEnrollments?.find(e => e.course_id === course.id);
    const isLocked = (course.unlock_at_level || 0) > myLevel;

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {course.thumbnail_url && (
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-3">
            <LevelBadge level={course.level || 1} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">{course.description}</p>

          {enrollment ? (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">{enrollment.progress_percent || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-pink-400 h-2 rounded-full"
                  style={{ width: `${enrollment.progress_percent || 0}%` }}
                />
              </div>
              <Link to={createPageUrl(`CourseDetail?id=${course.id}`)}>
                <Button className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-lg transition-colors">
                  Resume
                </Button>
              </Link>
            </div>
          ) : isLocked ? (
            <div className="pt-4 border-t border-gray-100">
              <Button disabled className="w-full bg-gray-200 text-gray-400 font-medium py-2 rounded-lg cursor-not-allowed">
                Unlock at Level {course.unlock_at_level}
              </Button>
            </div>
          ) : (
            <Link to={createPageUrl(`CourseDetail?id=${course.id}`)}>
              <Button className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded-lg transition-colors">
                Start Course
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Learning Paths</h1>
        <p className="text-lg text-gray-600">Develop your sewing skills with our structured curriculum</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      </div>

      {/* Learning Levels */}
      {[1, 2, 3, 4].map(level => (
        coursesByLevel[level]?.length > 0 && (
          <div key={level}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Level {level}: {["Sewing Foundations", "Beginner Projects", "Skill Building", "Advanced Sewing & Selling"][level - 1]}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {["Master the basics of sewing", "Build your first projects", "Develop advanced techniques", "Professional sewing and business"][level - 1]}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesByLevel[level].map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )
      ))}

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No courses found</p>
        </div>
      )}
    </div>
  );
}