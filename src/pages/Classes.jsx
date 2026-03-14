import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Video, Download } from "lucide-react";
import ReplayPlayer from "../components/classes/ReplayPlayer";
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

  const { data: liveClasses = [] } = useQuery({
    queryKey: ["liveClassesAll"],
    queryFn: () => base44.entities.LiveClass.filter({ is_active: true }),
  });

  const oneHourMs = 60 * 60 * 1000;
  const pastClasses = [...liveClasses]
    .filter(c => new Date(c.scheduled_at).getTime() + oneHourMs <= Date.now())
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  // Extract clean Vimeo embed URL from either a raw URL or a pasted <iframe> block
  const getPlayerInfo = (raw) => {
    if (!raw) return null;
    // If it looks like HTML, pull the src attribute out first
    const srcMatch = raw.match(/src=["']([^"']+)["']/);
    const url = srcMatch ? srcMatch[1] : raw.trim();
    // Match any Vimeo video ID from URLs like:
    //   https://vimeo.com/123456789
    //   https://player.vimeo.com/video/123456789
    //   https://player.vimeo.com/video/123456789?h=abc&...
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return {
      type: "iframe",
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0&portrait=0&share=0&download=0&pip=0&transparent=0`
    };
    // Direct video file
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", url };
    return null;
  };

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

      {/* Two-column layout — hidden when Replays tab is active */}
      {filter !== "replays" && (
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
      )}

      {/* Patterns & Past Classes — shown under Replays tab */}
      {filter === "replays" && (
        <div>
          {pastClasses.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-[#EEEEEE] text-[#999]">
              <p className="text-sm">No replays available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pastClasses.map(cls => {
                const player = getPlayerInfo(cls.recording_url);
                return (
                  <div key={cls.id} className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#CFCFCF] transition-all">
                    {/* Embedded player */}
                    {player ? (
                      <ReplayPlayer player={player} title={cls.title} />
                    ) : (
                      <div className="aspect-video bg-[#F5F5F5] flex items-center justify-center">
                        <Video className="w-8 h-8 text-[#CFCFCF]" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-[#111] text-sm leading-snug">{cls.title}</h3>
                        <p className="text-xs text-[#999] mt-0.5">{moment(cls.scheduled_at).format("MMM D, YYYY")}</p>
                        {cls.description && <p className="text-xs text-[#666] mt-1 leading-relaxed">{cls.description}</p>}
                      </div>
                      {cls.pdf_url && (
                        <div className="pt-1 border-t border-[#F5F5F5]">
                          <a href={cls.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#B8960C] gap-1.5 text-xs font-semibold rounded-xl h-8">
                              <Download className="w-3.5 h-3.5" /> Sewing Pattern
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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