import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Video, Edit2, X, Upload, CheckCircle2, Bell, Radio, PlayCircle, Eye, EyeOff } from "lucide-react";
import moment from "moment";

const EMPTY = {
  title: "",
  description: "",
  class_type: "live",
  status: "published",
  scheduled_at: "",
  zoom_url: "",
  thumbnail_url: "",
  pdf_url: "",
  recording_url: "",
  is_active: true,
};

export default function LiveClassManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ["adminLiveClasses"],
    queryFn: () => base44.entities.LiveClass.list("-scheduled_at", 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveClass.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLiveClasses"] });
      queryClient.invalidateQueries({ queryKey: ["liveClassesAll"] });
      queryClient.invalidateQueries({ queryKey: ["memberClasses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveClass.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLiveClasses"] });
      queryClient.invalidateQueries({ queryKey: ["liveClassesAll"] });
      queryClient.invalidateQueries({ queryKey: ["memberClasses"] });
      setForm(EMPTY);
      setEditingId(null);
    },
  });

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const payload = { ...form };
    // Remove scheduled_at if prerecorded and empty
    if (payload.class_type === "prerecorded" && !payload.scheduled_at) {
      delete payload.scheduled_at;
    }
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload });
    } else {
      await base44.entities.LiveClass.create(payload);
      queryClient.invalidateQueries({ queryKey: ["adminLiveClasses"] });
      queryClient.invalidateQueries({ queryKey: ["liveClassesAll"] });
      queryClient.invalidateQueries({ queryKey: ["memberClasses"] });
      if (notifyMembers) {
        await base44.functions.invoke("notifyNewLiveClass", {
          title: form.title,
          scheduled_at: form.scheduled_at,
          zoom_url: form.zoom_url,
          description: form.description,
        });
      }
    }
    setForm(EMPTY);
    setEditingId(null);
    setNotifyMembers(false);
    setSaving(false);
  };

  const handleEdit = (cls) => {
    setForm({
      title: cls.title || "",
      description: cls.description || "",
      class_type: cls.class_type || "live",
      status: cls.status || "published",
      scheduled_at: cls.scheduled_at || "",
      zoom_url: cls.zoom_url || "",
      thumbnail_url: cls.thumbnail_url || "",
      pdf_url: cls.pdf_url || "",
      recording_url: cls.recording_url || "",
      supply_list: cls.supply_list || [],
      is_active: cls.is_active !== false,
    });
    setEditingId(cls.id);
  };

  const handleCancel = () => { setForm(EMPTY); setEditingId(null); };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, pdf_url: file_url }));
    setUploadingPdf(false);
  };

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, thumbnail_url: file_url }));
    setUploadingThumb(false);
  };

  const toggleStatus = async (cls) => {
    const newStatus = cls.status === "published" ? "draft" : "published";
    await base44.entities.LiveClass.update(cls.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["adminLiveClasses"] });
    queryClient.invalidateQueries({ queryKey: ["liveClassesAll"] });
    queryClient.invalidateQueries({ queryKey: ["memberClasses"] });
  };

  const isLive = form.class_type === "live";

  return (
    <div className="space-y-6">
      {/* ── Form ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Video className="w-4 h-4 text-violet-500" />
            {editingId ? "Edit Class" : "Add New Class"}
          </h3>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-gray-500">
              Clear
            </Button>
          )}
        </div>

        {/* Class Type Toggle */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-semibold uppercase tracking-wide">Class Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, class_type: "live" }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                form.class_type === "live"
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Radio className="w-4 h-4" /> LIVE
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, class_type: "prerecorded" }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                form.class_type === "prerecorded"
                  ? "border-violet-400 bg-violet-50 text-violet-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <PlayCircle className="w-4 h-4" /> PRERECORDED
            </button>
          </div>
        </div>

        {/* Publish Status */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-semibold uppercase tracking-wide">Publish Status</label>
          <div className="flex gap-2">
            {["published", "draft", "archived"].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                  form.status === s
                    ? s === "published"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : s === "draft"
                      ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                      : "border-gray-400 bg-gray-100 text-gray-600"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {form.status === "published" ? "✅ Members will see this class" : form.status === "draft" ? "🔒 Hidden from members" : "📦 Archived — hidden from members"}
          </p>
        </div>

        <Input placeholder="Class title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea placeholder="Description (optional)..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[70px]" />

        {/* Live-only fields */}
        {isLive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date & Time</label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Zoom / Meeting Link</label>
              <Input placeholder="https://zoom.us/j/..." value={form.zoom_url} onChange={e => setForm({ ...form, zoom_url: e.target.value })} />
            </div>
          </div>
        )}

        {/* Recording — relevant for both (prerecorded primary, live replay) */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isLive ? "Recording / Replay — paste Vimeo URL or embed code" : "Video URL — Vimeo URL, embed code, or direct file link"}
          </label>
          <Input
            placeholder="https://vimeo.com/123456789  or  <iframe src=…>"
            value={form.recording_url || ""}
            onChange={e => setForm({ ...form, recording_url: e.target.value })}
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Thumbnail Image</label>
          {form.thumbnail_url ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <img src={form.thumbnail_url} className="w-10 h-10 rounded object-cover" />
              <span className="text-xs text-emerald-700 flex-1 truncate">Thumbnail uploaded ✓</span>
              <button onClick={() => setForm({ ...form, thumbnail_url: "" })} className="text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingThumb ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-violet-50"}`}>
              {uploadingThumb ? <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
              <span className="text-xs text-gray-500">{uploadingThumb ? "Uploading..." : "Upload thumbnail image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={uploadingThumb} />
            </label>
          )}
        </div>

        {/* PDF */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Class Materials PDF</label>
          {form.pdf_url ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700 flex-1 truncate">PDF uploaded ✓</span>
              <button onClick={() => setForm({ ...form, pdf_url: "" })} className="text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingPdf ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"}`}>
              {uploadingPdf ? <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
              <span className="text-xs text-gray-500">{uploadingPdf ? "Uploading..." : "Upload PDF"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
            </label>
          )}
        </div>

        {/* Supply list */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Supply List (one per line)</label>
          <textarea
            value={(form.supply_list || []).join("\n")}
            onChange={e => setForm({ ...form, supply_list: e.target.value.split("\n").filter(s => s.trim()) })}
            placeholder="Thread&#10;Needle&#10;Fabric scraps..."
            className="w-full p-3 border border-gray-200 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Notify toggle — new classes only */}
        {!editingId && form.class_type === "live" && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => setNotifyMembers(v => !v)} className={`relative w-10 h-5 rounded-full transition-colors ${notifyMembers ? "bg-violet-500" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifyMembers ? "translate-x-5" : ""}`} />
            </div>
            <Bell className={`w-3.5 h-3.5 ${notifyMembers ? "text-violet-500" : "text-gray-400"}`} />
            <span className="text-sm text-gray-600">Notify all members via email</span>
          </label>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !form.title} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2 flex-1">
            <Plus className="w-4 h-4" /> {saving ? "Saving..." : editingId ? "Update Class" : "Add Class"}
          </Button>
          {editingId && (
            <Button onClick={handleCancel} variant="outline" className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* ── Class List ── */}
      <div className="space-y-2">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start justify-between gap-3 shadow-sm hover:border-gray-300 transition-all">
            <div onClick={() => handleEdit(cls)} className="flex-1 cursor-pointer min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{cls.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${cls.class_type === "live" ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600"}`}>
                  {cls.class_type === "live" ? "🔴 LIVE" : "▶ PRERECORDED"}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                  cls.status === "published" ? "bg-green-100 text-green-700" :
                  cls.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {cls.status || "published"}
                </span>
              </div>
              {cls.scheduled_at && (
                <p className="text-xs text-gray-400">{moment(cls.scheduled_at).format("MMM D, YYYY [at] h:mm A")}</p>
              )}
              {!cls.scheduled_at && cls.class_type === "prerecorded" && (
                <p className="text-xs text-gray-400">Prerecorded class</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon" variant="ghost"
                className={`w-8 h-8 ${cls.status === "published" ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                onClick={() => toggleStatus(cls)}
                title={cls.status === "published" ? "Visible to members — click to unpublish" : "Hidden from members — click to publish"}
              >
                {cls.status === "published" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="text-violet-500 hover:bg-violet-50 w-8 h-8" onClick={() => handleEdit(cls)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-50 w-8 h-8" onClick={() => deleteMutation.mutate(cls.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {classes.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No classes yet.</p>}
      </div>
    </div>
  );
}