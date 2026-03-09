import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Video, Edit2, X, Upload, CheckCircle2 } from "lucide-react";
import moment from "moment";

const EMPTY = { title: "", description: "", scheduled_at: "", zoom_url: "", pdf_url: "", is_active: true };

export default function LiveClassManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ["adminLiveClasses"],
    queryFn: () => base44.entities.LiveClass.list("-scheduled_at", 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveClass.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminLiveClasses"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveClass.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLiveClasses", "liveClasses"] });
      setForm(EMPTY);
      setEditingId(null);
    },
  });

  const handleSave = async () => {
    if (!form.title || !form.scheduled_at) return;
    setSaving(true);
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: form });
    } else {
      await base44.entities.LiveClass.create(form);
      queryClient.invalidateQueries({ queryKey: ["adminLiveClasses", "liveClasses"] });
    }
    setForm(EMPTY);
    setEditingId(null);
    setSaving(false);
  };

  const handleEdit = (cls) => {
    setForm({ ...cls });
    setEditingId(cls.id);
  };

  const handleCancel = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, pdf_url: file_url }));
    setUploadingPdf(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Video className="w-4 h-4 text-violet-500" /> {editingId ? "Edit Class" : "Schedule New Class"}</h3>
          {editingId && <Button variant="ghost" size="sm" onClick={handleCancel} className="text-gray-500 hover:text-gray-700">Clear</Button>}
        </div>
        <Input placeholder="Class title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea placeholder="Description (optional)..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[70px]" />
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
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Supply List (one per line)</label>
          <textarea
            value={(form.supply_list || []).join("\n")}
            onChange={e => setForm({ ...form, supply_list: e.target.value.split("\n").filter(s => s.trim()) })}
            placeholder="Thread&#10;Needle&#10;Fabric scraps..."
            className="w-full p-3 border border-gray-200 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !form.title || !form.scheduled_at} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2 flex-1">
            <Plus className="w-4 h-4" /> {saving ? "Saving..." : editingId ? "Update Class" : "Add Class"}
          </Button>
          {editingId && (
            <Button onClick={handleCancel} variant="outline" className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
            <div onClick={() => handleEdit(cls)} className="flex-1 cursor-pointer">
              <p className="text-sm font-semibold text-gray-800">{cls.title}</p>
              <p className="text-xs text-gray-400">{moment(cls.scheduled_at).format("MMM D, YYYY [at] h:mm A")}</p>
            </div>
            <div className="flex gap-1">
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