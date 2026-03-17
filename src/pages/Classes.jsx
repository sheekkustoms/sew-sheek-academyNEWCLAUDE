import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Video, Download, Radio, PlayCircle, ExternalLink, Calendar } from "lucide-react";
import ReplayPlayer from "../components/classes/ReplayPlayer";
import CoursesSidebar from "../components/classes/CoursesSidebar";
import CourseView from "../components/classes/CourseView";
import AdminCourseEditor from "../components/admin/CourseManager";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import moment from "moment";

const FILTERS = [
  { value: "all",          label: "All Classes" },
  { value: "live",         label: "Live" },
  { value: "prerecorded",  label: "Prerecorded" },
  { value: "courses",      label: "Courses" },
];

// Extract clean video player info from raw URL or iframe embed
const getPlayerInfo = (raw) => {
  if (!raw) return null;
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  const url = srcMatch ? srcMatch[1] : raw.trim();
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return {
    type: "iframe",
    url: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0&portrait=0&share=0&download=0&pip=0&transparent=0`,
  };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", url };
  return null;
};

function LiveClassCard({ cls }) {
  const now = Date.now();
  const scheduledMs = cls.scheduled_at ? new Date(cls.scheduled_at).getTime() : null;
  const isUpcoming = scheduledMs && scheduledMs > now;
  const isPast = scheduledMs && scheduledMs + 60 * 60 * 1000 <= now;
  const player = getPlayerInfo(cls.recording_url);

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#CFCFCF] transition-all">
      {/* Thumbnail or player */}
      {isPast && player ? (
        <ReplayPlayer player={player} title={cls.title} />
      ) : cls.thumbnail_url ? (
        <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
          <Radio className="w-10 h-10 text-red-300" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {isUpcoming && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wide flex items-center gap-1">
              <Radio className="w-2.5 h-2.5" /> Upcoming Live
            </span>
          )}
          {isPast && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
              Replay Available
            </span>
          )}
          {!scheduledMs && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 uppercase tracking-wide flex items-center gap-1">
              <Radio className="w-2.5 h-2.5" /> Live Class
            </span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
          {cls.scheduled_at && (
            <p className="text-xs text-[#999] mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {moment(cls.scheduled_at).format("MMM D, YYYY [at] h:mm A")}
            </p>
          )}
          {cls.description && (
            <p className="text-xs text-[#666] mt-1 leading-relaxed line-clamp-2">{cls.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#F5F5F5]">
          {isUpcoming && cls.zoom_url && (
            <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white gap-1.5 text-xs font-semibold rounded-xl h-8">
                <ExternalLink className="w-3.5 h-3.5" /> Join Live Class
              </Button>
            </a>
          )}
          {cls.pdf_url && (
            <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl h-8 border-[#D4AF37]/40 text-[#B8960C] hover:bg-[#D4AF37]/10">
                <Download className="w-3.5 h-3.5" /> Materials
              </Button>
            </a>
          )}
        </div>

        {/* Supply list */}
        {cls.supply_list?.length > 0 && (
          <div className="pt-2 border-t border-[#F5F5F5]">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-1">Supplies</p>
            <ul className="space-y-0.5">
              {cls.supply_list.map((s, i) => (
                <li key={i} className="text-xs text-[#555] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function PrerecordedCard({ cls }) {
  const player = getPlayerInfo(cls.recording_url);

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#CFCFCF] transition-all">
      {/* Player or thumbnail */}
      {player ? (
        <ReplayPlayer player={player} title={cls.title} />
      ) : cls.thumbnail_url ? (
        <img src={cls.thumbnail_url} alt={cls.title} className="w-full aspect-video object-cover" />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
          <PlayCircle className="w-10 h-10 text-violet-300" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-wide flex items-center gap-1">
            <PlayCircle className="w-2.5 h-2.5" /> Prerecorded
          </span>
        </div>
        <div>
          <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
          {cls.description && (
            <p className="text-xs text-[#666] mt-1 leading-relaxed line-clamp-2">{cls.description}</p>
          )}
        </div>
        {cls.pdf_url && (
          <div className="pt-1 border-t border-[#F5F5F5]">
            <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-xl h-8 border-[#D4AF37]/40 text-[#B8960C] hover:bg-[#D4AF37]/10">
                <Download className="w-3.5 h-3.5" /> Materials
              </Button>
            </a>
          </div>
        )}
        {cls.supply_list?.length > 0 && (
          <div className="pt-2 border-t border-[#F5F5F5]">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-1">Supplies</p>
            <ul className="space-y-0.5">
              {cls.supply_list.map((s, i) => (
                <li key={i} className="text-xs text-[#555] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Classes() {
  const [filter, setFilter] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showAdminEditor, setShowAdminEditor] = useState(false);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date", 200),
    staleTime: 60000,
  });

  const { data: userEnrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch ALL LiveClass records — filter client-side so no records are missed
  const { data: allLiveClasses = [] } = useQuery({
    queryKey: ["memberClasses"],
    queryFn: () => base44.entities.LiveClass.list("-created_date", 100),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Only show published classes (treat missing status as published for legacy records)
  const publishedClasses = allLiveClasses.filter(c => !c.status || c.status === "published");

  // Separate by class_type
  const liveClasses = publishedClasses.filter(c => c.class_type === "live" || !c.class_type);
  const prerecordedClasses = publishedClasses.filter(c => c.class_type === "prerecorded");

  // Sort live: upcoming first, then past
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const sortedLive = [...liveClasses].sort((a, b) => {
    const aMs = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const bMs = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    const aUpcoming = aMs > now;
    const bUpcoming = bMs > now;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    return bMs - aMs;
  });
  const sortedPrerecorded = [...prerecordedClasses].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const publishedCourses = courses
    .filter(c => c.is_published)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Auto-select first course only on desktop (md+); on mobile let user pick from list
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  useEffect(() => {
    if (publishedCourses.length > 0 && !selectedCourseId && !isMobile) {
      setSelectedCourseId(publishedCourses[0].id);
    }
  }, [publishedCourses.length]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || null;

  const showCourses = filter === "all" || filter === "courses";
  const showLive = filter === "all" || filter === "live";
  const showPrerecorded = filter === "all" || filter === "prerecorded";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#111] tracking-tight">Classes</h1>
              <p className="text-sm text-[#666] mt-0.5">Live sessions, replays & courses</p>
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white border border-[#EEEEEE] rounded-2xl p-1.5 shadow-sm w-fit">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

      <div className="space-y-8">
        {/* ── LIVE CLASSES section ── */}
        {showLive && (
          <section>
            {filter === "all" && (
              <h2 className="text-lg font-bold text-[#111] mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" /> Live Classes
              </h2>
            )}
            {sortedLive.length === 0 ? (
              filter !== "all" ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
                  <p className="text-sm">No live classes yet</p>
                </div>
              ) : null
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedLive.map(cls => <LiveClassCard key={cls.id} cls={cls} />)}
              </div>
            )}
          </section>
        )}

        {/* ── PRERECORDED section ── */}
        {showPrerecorded && (
          <section>
            {filter === "all" && (
              <h2 className="text-lg font-bold text-[#111] mb-3 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-violet-500" /> Prerecorded Classes
              </h2>
            )}
            {sortedPrerecorded.length === 0 ? (
              filter !== "all" ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
                  <p className="text-sm">No prerecorded classes yet</p>
                </div>
              ) : null
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedPrerecorded.map(cls => <PrerecordedCard key={cls.id} cls={cls} />)}
              </div>
            )}
          </section>
        )}

        {/* ── COURSES section ── */}
        {showCourses && (
          <section>
            {filter === "all" && (
              <h2 className="text-lg font-bold text-[#111] mb-3 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#D4AF37]" /> Courses
              </h2>
            )}

            {coursesLoading ? (
              /* Loading state — never show empty while fetching */
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-white rounded-xl border border-[#EEEEEE] animate-pulse" />
                ))}
              </div>
            ) : publishedCourses.length === 0 ? (
              /* Only show empty state after load confirms no data */
              filter !== "all" && (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
                  <p className="text-sm">No courses published yet</p>
                </div>
              )
            ) : (
              <div className="flex flex-col md:flex-row gap-5">
                {/* Sidebar: always show on desktop; on mobile only show when no course selected */}
                <div className={`md:w-72 md:shrink-0 ${selectedCourseId ? "hidden md:block" : "block"}`}>
                  <CoursesSidebar
                    courses={publishedCourses}
                    enrollments={userEnrollments}
                    selectedCourseId={selectedCourseId}
                    onSelect={setSelectedCourseId}
                    isLoading={false}
                  />
                </div>

                {/* Course detail: show when selected */}
                {selectedCourse ? (
                  <div className="flex-1 min-w-0">
                    <button
                      className="md:hidden flex items-center gap-1.5 text-sm text-[#666] mb-3 hover:text-[#111]"
                      onClick={() => setSelectedCourseId(null)}
                    >
                      ← Back to courses
                    </button>
                    <CourseView
                      course={selectedCourse}
                      user={user}
                      enrollment={userEnrollments.find(e => e.course_id === selectedCourseId) || null}
                    />
                  </div>
                ) : (
                  /* Desktop: prompt to select; mobile: this state shows the sidebar list above */
                  <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-2xl border border-[#EEEEEE] text-[#999]" style={{ minHeight: "75vh" }}>
                    <p className="text-sm">Select a course to get started</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Empty state for "all" tab */}
        {filter === "all" && sortedLive.length === 0 && sortedPrerecorded.length === 0 && publishedCourses.length === 0 && !coursesLoading && (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
            <p className="text-sm">No classes available yet</p>
          </div>
        )}
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