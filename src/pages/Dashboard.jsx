import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Loader2, Radio, PlayCircle, BookOpen, GraduationCap, TrendingUp,
  Calendar, ChevronRight, Clock, Search, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayName } from "@/components/shared/useDisplayName";
import { getLevelFromXP, loadThresholds } from "@/components/shared/XPBar";
import moment from "moment";

function ContentTypeCard({ icon: Icon, title, desc, page, color, count }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className={`bg-white border border-[#EEEEEE] rounded-2xl p-5 hover:shadow-md hover:border-[#D4AF37]/40 transition-all cursor-pointer group`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-[#111] text-sm">{title}</p>
            <p className="text-xs text-[#999] mt-0.5">{desc}</p>
          </div>
          {count != null && <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{count}</span>}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-[#D4AF37] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [thresholds, setThresholds] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 100),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => base44.entities.Lesson.list("-created_date", 200),
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ["allClassesHub"],
    queryFn: () => base44.entities.LiveClass.list("-created_date", 200),
    staleTime: 30000,
  });

  useEffect(() => { loadThresholds(true).then(setThresholds); }, []);

  if (!user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  const myPoints = userPoints?.[0];
  const level = thresholds ? getLevelFromXP(myPoints?.total_xp || 0, thresholds) : getLevelFromXP(myPoints?.total_xp || 0);

  const published = allClasses.filter(c => !c.status || c.status === "published");
  const now = Date.now();

  const liveClasses = published.filter(c => c.class_type === "live" || !c.class_type);
  const upcomingLive = liveClasses.filter(c => c.scheduled_at && new Date(c.scheduled_at).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const replays = published.filter(c => {
    if (c.class_type === "replay") return true;
    if ((c.class_type === "live" || !c.class_type) && c.recording_url && c.scheduled_at)
      return new Date(c.scheduled_at).getTime() + 60 * 60 * 1000 <= now;
    return false;
  });

  const tutorials = published.filter(c => c.class_type === "prerecorded" || c.class_type === "tutorial");
  const publishedCourses = courses.filter(c => c.is_published);

  // Continue learning — most recently active enrollment
  const activeEnrollments = enrollments
    .filter(e => !e.is_completed && e.progress_percent > 0)
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  const continueCourse = activeEnrollments[0] ? courses.find(c => c.id === activeEnrollments[0].course_id) : null;
  const continueEnrollment = activeEnrollments[0] || null;

  // Search across all content
  const searchResults = search.trim()
    ? [
        ...liveClasses.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, _type: "live" })),
        ...replays.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, _type: "replay" })),
        ...tutorials.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, _type: "tutorial" })),
        ...publishedCourses.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map(c => ({ ...c, _type: "course" })),
      ]
    : [];

  const typeLabel = { live: "Live Class", replay: "Replay", tutorial: "Tutorial", course: "Course" };
  const typeColor = { live: "bg-red-100 text-red-600", replay: "bg-orange-100 text-orange-600", tutorial: "bg-violet-100 text-violet-600", course: "bg-[#D4AF37]/15 text-[#B8960C]" };
  const typePage = { live: "LiveClassesHub", replay: "ReplaysHub", tutorial: "TutorialsHub", course: "Classes" };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111] tracking-tight">
          Welcome back, {getDisplayName(user)?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-sm text-[#666] mt-1">Ready to keep learning? Jump right in.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
        <Input
          placeholder="Search classes, tutorials, courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-11 h-12 rounded-2xl border-[#EEEEEE] bg-white shadow-sm text-sm"
        />
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div className="bg-white border border-[#EEEEEE] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F5F5F5]">
            <p className="text-sm font-semibold text-[#333]">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"</p>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-[#999] px-4 py-6 text-center">Nothing found. Try a different search term.</p>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {searchResults.slice(0, 8).map((item, i) => (
                <Link key={i} to={createPageUrl(typePage[item._type])} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} className="w-12 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-9 rounded-lg bg-[#F5F5F5] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111] truncate">{item.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeColor[item._type]}`}>{typeLabel[item._type]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continue Learning */}
      {continueCourse && !search && (
        <div className="bg-black rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Continue Learning</p>
            <h3 className="text-lg font-bold text-white">{continueCourse.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-white/10 rounded-full h-1.5 max-w-xs">
                <div className="bg-[#D4AF37] h-1.5 rounded-full" style={{ width: `${continueEnrollment.progress_percent || 0}%` }} />
              </div>
              <span className="text-xs text-white/60">{continueEnrollment.progress_percent || 0}%</span>
            </div>
          </div>
          <Link to={createPageUrl("Classes")}>
            <Button className="bg-[#D4AF37] hover:bg-[#C49B2A] text-black font-bold rounded-xl shrink-0">
              Resume Course
            </Button>
          </Link>
        </div>
      )}

      {/* Content Type Grid */}
      {!search && (
        <div>
          <h2 className="text-base font-bold text-[#111] mb-4">Browse Content</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <ContentTypeCard icon={Radio}         title="Live Classes"  desc="Join scheduled sessions" page="LiveClassesHub" color="bg-red-500"       count={upcomingLive.length > 0 ? `${upcomingLive.length} upcoming` : undefined} />
            <ContentTypeCard icon={PlayCircle}    title="Replays"       desc="Watch past sessions"    page="ReplaysHub"    color="bg-orange-500"    count={replays.length} />
            <ContentTypeCard icon={BookOpen}      title="Tutorials"     desc="Learn at your pace"     page="TutorialsHub"  color="bg-violet-500"    count={tutorials.length} />
            <ContentTypeCard icon={GraduationCap} title="Courses"       desc="Structured learning"    page="Classes"       color="bg-[#D4AF37]"     count={publishedCourses.length} />
          </div>
        </div>
      )}

      {/* Upcoming Live */}
      {!search && upcomingLive.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> Upcoming Live Classes
            </h2>
            <Link to={createPageUrl("LiveClassesHub")} className="text-xs text-[#D4AF37] font-semibold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingLive.slice(0, 2).map(cls => (
              <div key={cls.id} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 flex gap-3 hover:shadow-md transition-all">
                {cls.thumbnail_url ? (
                  <img src={cls.thumbnail_url} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <Radio className="w-6 h-6 text-red-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#111] truncate">{cls.title}</h4>
                  <p className="text-xs text-[#999] mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {moment(cls.scheduled_at).format("MMM D [at] h:mm A")}
                  </p>
                  {cls.zoom_url && (
                    <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer">
                      <span className="text-xs text-red-500 font-semibold hover:underline mt-1 inline-block">Join →</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Replays */}
      {!search && replays.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111]">Recent Replays</h2>
            <Link to={createPageUrl("ReplaysHub")} className="text-xs text-[#D4AF37] font-semibold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {replays.slice(0, 4).map(cls => (
              <Link key={cls.id} to={createPageUrl("ReplaysHub")}>
                <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                  {cls.thumbnail_url ? (
                    <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video bg-orange-50 flex items-center justify-center">
                      <PlayCircle className="w-7 h-7 text-orange-200" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold text-[#111] line-clamp-2">{cls.title}</p>
                    <p className="text-[10px] text-[#999] mt-1">{moment(cls.scheduled_at || cls.created_date).format("MMM D, YYYY")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My Courses Progress */}
      {!search && enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#111]">My Courses</h2>
            <Link to={createPageUrl("Classes")} className="text-xs text-[#D4AF37] font-semibold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enrollments.slice(0, 4).map(enrollment => {
              const course = courses.find(c => c.id === enrollment.course_id);
              if (!course) return null;
              return (
                <Link key={enrollment.id} to={createPageUrl("Classes")}>
                  <div className="bg-white border border-[#EEEEEE] rounded-2xl p-4 hover:shadow-md transition-all flex gap-3">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} className="w-16 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111] truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 bg-[#EEEEEE] rounded-full h-1.5">
                          <div className="bg-[#D4AF37] h-1.5 rounded-full transition-all" style={{ width: `${enrollment.progress_percent || 0}%` }} />
                        </div>
                        <span className="text-[10px] text-[#999] font-semibold shrink-0">{enrollment.progress_percent || 0}%</span>
                      </div>
                      {enrollment.is_completed && <span className="text-[10px] text-green-600 font-bold">✓ Completed</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {!search && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "XP Earned", value: myPoints?.total_xp || 0, icon: Zap },
            { label: "Level", value: level, icon: TrendingUp },
            { label: "Courses", value: myPoints?.courses_completed || 0, icon: GraduationCap },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
              <stat.icon className="w-5 h-5 text-[#D4AF37] mb-1" />
              <p className="text-xl font-bold text-[#111]">{stat.value}</p>
              <p className="text-[10px] text-[#999] uppercase tracking-wide mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}