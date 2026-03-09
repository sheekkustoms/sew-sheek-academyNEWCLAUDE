import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus, Trash2, Edit2, Eye, BookOpen, Upload, Video,
  ChevronDown, ChevronUp, GripVertical, Zap, Clock, X, CheckCircle2
} from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null; // direct URL, use <video> tag
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "beginner_sewing", label: "Beginner Sewing" },
  { value: "intermediate_sewing", label: "Intermediate Sewing" },
  { value: "advanced_sewing", label: "Advanced Sewing" },
  { value: "pattern_making", label: "Pattern Making" },
  { value: "alterations", label: "Alterations" },
  { value: "embroidery", label: "Embroidery" },
  { value: "quilting", label: "Quilting" },
  { value: "fashion_design", label: "Fashion Design" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

// ─── Lesson Editor ────────────────────────────────────────────────────────────
function LessonEditor({ lesson, courseId, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ ...lesson });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const save = async () => {
    setSaving(true);
    await base44.entities.Lesson.update(lesson.id, form);
    queryClient.invalidateQueries({ queryKey: ["adminLessons", courseId] });
    setSaving(false);
    setExpanded(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
        <span className="w-6 h-6 bg-gradient-to-br from-pink-500 to-violet-500 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{lesson.title || "Untitled Lesson"}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            {lesson.duration_minutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{lesson.duration_minutes}m</span>}
            {lesson.video_url && <span className="flex items-center gap-0.5 text-emerald-500"><Video className="w-3 h-3" /> Video added</span>}
            <span className="flex items-center gap-0.5 text-fuchsia-500"><Zap className="w-3 h-3" />+{lesson.xp_reward || 20} XP</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
          <Input placeholder="Lesson title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white border-gray-200" />
          <Textarea placeholder="Lesson description..." value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white border-gray-200 min-h-[70px]" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Duration (minutes)</label>
              <Input type="number" value={form.duration_minutes || 0} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} className="bg-white border-gray-200 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">XP Reward</label>
              <Input type="number" value={form.xp_reward || 20} onChange={e => setForm({ ...form, xp_reward: +e.target.value })} className="bg-white border-gray-200 h-9" />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lesson Video URL</label>
            <div className="space-y-1.5">
              <Input
                placeholder="Paste YouTube, Vimeo, or direct video URL..."
                value={form.video_url || ""}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
                className="bg-white border-gray-200"
              />
              <p className="text-[10px] text-gray-400">Supports: YouTube (youtube.com/watch, youtu.be), Vimeo, or direct .mp4/.mov links</p>
              {form.video_url && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-emerald-700 flex-1 truncate">{form.video_url}</span>
                  <button onClick={() => setForm({ ...form, video_url: "" })} className="text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            {saving ? "Saving..." : "Save Lesson"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Course Editor ────────────────────────────────────────────────────────────
function CourseEditor({ course, onClose }) {
  const [form, setForm] = useState({ ...course });
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const queryClient = useQueryClient();

  const { data: lessons = [] } = useQuery({
    queryKey: ["adminLessons", course.id],
    queryFn: () => base44.entities.Lesson.filter({ course_id: course.id }),
  });
  const sortedLessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, thumbnail_url: file_url }));
    setUploadingThumb(false);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, pdf_url: file_url }));
    setUploadingPdf(false);
  };

  const saveCourse = async () => {
    setSaving(true);
    await base44.entities.Course.update(course.id, form);
    queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
    setSaving(false);
  };

  const addLesson = useMutation({
    mutationFn: () => base44.entities.Lesson.create({
      course_id: course.id,
      title: `Lesson ${sortedLessons.length + 1}`,
      description: "",
      video_url: "",
      duration_minutes: 0,
      xp_reward: 20,
      order: sortedLessons.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLessons", course.id] });
      base44.entities.Course.update(course.id, { lesson_count: sortedLessons.length + 1 });
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (id) => base44.entities.Lesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminLessons", course.id] }),
  });

  return (
    <div className="bg-white border border-violet-200 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-pink-50 to-violet-50 border-b border-violet-100">
        <BookOpen className="w-5 h-5 text-violet-600" />
        <span className="font-bold text-violet-800 flex-1">Editing: {course.title}</span>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-5 grid md:grid-cols-2 gap-6">
        {/* Course details */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Course Details</p>

          <Input placeholder="Course title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border-gray-200" />
          <Textarea placeholder="Course description..." value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="border-gray-200 min-h-[80px]" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="border-gray-200 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
              <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                <SelectTrigger className="border-gray-200 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">XP Reward</label>
              <Input type="number" value={form.xp_reward || 100} onChange={e => setForm({ ...form, xp_reward: +e.target.value })} className="border-gray-200 h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unlock at Level (0 = always open)</label>
              <Input type="number" min={0} value={form.unlock_at_level || 0} onChange={e => setForm({ ...form, unlock_at_level: +e.target.value })} className="border-gray-200 h-9" />
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Thumbnail Image</label>
            {form.thumbnail_url ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                <img src={form.thumbnail_url} className="w-full h-full object-cover" />
                <button onClick={() => setForm({ ...form, thumbnail_url: "" })}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500/80 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingThumb ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"}`}>
                {uploadingThumb ? (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-300" />
                    <span className="text-xs text-gray-500">Upload thumbnail</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={uploadingThumb} />
              </label>
            )}
            <Input placeholder="Or paste image URL..." value={form.thumbnail_url || ""} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
              className="border-gray-200 h-9 mt-2 text-xs" />
          </div>

          {/* PDF Upload */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Course PDF / Resource (downloadable by members)</label>
            {form.pdf_url ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-700 flex-1 truncate">PDF uploaded ✓</span>
                <button onClick={() => setForm({ ...form, pdf_url: "" })} className="text-gray-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingPdf ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"}`}>
                {uploadingPdf ? (
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs text-gray-500">{uploadingPdf ? "Uploading..." : "Upload PDF"}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
              </label>
            )}
          </div>

          <Button onClick={saveCourse} disabled={saving} className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            {saving ? "Saving..." : "Save Course Details"}
          </Button>
        </div>

        {/* Lessons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Lessons ({sortedLessons.length})</p>
            <Button size="sm" onClick={() => addLesson.mutate()} disabled={addLesson.isPending}
              className="bg-violet-100 text-violet-700 hover:bg-violet-200 gap-1 h-8">
              <Plus className="w-3.5 h-3.5" /> Add Lesson
            </Button>
          </div>
          {sortedLessons.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No lessons yet — add your first one!
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {sortedLessons.map((lesson, i) => (
                <LessonEditor key={lesson.id} lesson={lesson} courseId={course.id} onDelete={(id) => deleteLesson.mutate(id)} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main CourseManager ───────────────────────────────────────────────────────
export default function CourseManager() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newForm, setNewForm] = useState({ title: "", description: "", category: "beginner_sewing", difficulty: "beginner", xp_reward: 100, is_published: false });

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: courses = [] } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: () => base44.entities.Course.list("-created_date", 100),
  });

  const sortedCourses = [...courses].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const newOrder = Array.from(sortedCourses);
    const [moved] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, moved);

    // Update order for affected courses
    const updates = newOrder.map((course, idx) => 
      base44.entities.Course.update(course.id, { order: idx })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
  };

  const createCourse = useMutation({
    mutationFn: () => base44.entities.Course.create({ ...newForm, lesson_count: 0 }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setShowNew(false);
      setNewForm({ title: "", description: "", category: "beginner_sewing", difficulty: "beginner", xp_reward: 100, is_published: false });
      setEditingId(created.id);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCourses"] }); if (editingId) setEditingId(null); },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }) => base44.entities.Course.update(id, { is_published: !published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminCourses"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-700 font-bold">
          <BookOpen className="w-5 h-5" /> Course Manager
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-1">
          <Plus className="w-4 h-4" /> New Course
        </Button>
      </div>

      {/* New course form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-pink-50 to-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3 overflow-hidden"
          >
            <p className="font-bold text-violet-700">Create New Course</p>
            <Input placeholder="Course title..." value={newForm.title} onChange={e => setNewForm({ ...newForm, title: e.target.value })} className="bg-white border-gray-200" />
            <Textarea placeholder="Description..." value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} className="bg-white border-gray-200 min-h-[70px]" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newForm.category} onValueChange={v => setNewForm({ ...newForm, category: v })}>
                <SelectTrigger className="bg-white border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={newForm.difficulty} onValueChange={v => setNewForm({ ...newForm, difficulty: v })}>
                <SelectTrigger className="bg-white border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createCourse.mutate()} disabled={!newForm.title || createCourse.isPending} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                {createCourse.isPending ? "Creating..." : "Create & Add Lessons →"}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline editor */}
      <AnimatePresence>
        {editingId && courses.find(c => c.id === editingId) && (
          <motion.div key={editingId} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <CourseEditor course={courses.find(c => c.id === editingId)} onClose={() => setEditingId(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="courses">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-2 ${snapshot.isDraggingOver ? "bg-violet-50/50 p-2 rounded-xl" : ""}`}>
              {sortedCourses.map((course, index) => (
                <Draggable key={course.id} draggableId={course.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${editingId === course.id ? "border-violet-300" : "border-gray-100"} ${snapshot.isDragging ? "shadow-lg ring-2 ring-violet-300" : ""}`}
                    >
            <div className="flex items-center gap-3 px-4 py-3">
                <div {...provided.dragHandleProps}>
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
                {course.thumbnail_url ? (
                <img src={course.thumbnail_url} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">{course.title}</p>
                  <Badge className={`text-[10px] ${course.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span className="capitalize">{course.category?.replace(/_/g, " ")}</span>
                  <span>·</span>
                  <span className="capitalize">{course.difficulty}</span>
                  <span>·</span>
                  <span>{course.lesson_count || 0} lessons</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8 text-violet-500" title="Edit" onClick={() => setEditingId(editingId === course.id ? null : course.id)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className={`w-8 h-8 ${course.is_published ? "text-amber-500" : "text-emerald-500"}`}
                  title={course.is_published ? "Unpublish" : "Publish"} onClick={() => togglePublish.mutate({ id: course.id, published: course.is_published })}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:bg-red-50" onClick={() => deleteCourse.mutate(course.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No courses yet. Create your first one above!</p>
        )}
      </div>
    </div>
  );
}