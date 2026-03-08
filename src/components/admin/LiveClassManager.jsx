import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Video, Edit2, X } from "lucide-react";
import moment from "moment";

const EMPTY = { title: "", description: "", scheduled_at: "", zoom_url: "", is_active: true };

export default function LiveClassManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Video className="w-4 h-4 text-violet-500" /> Schedule New Class</h3>
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
        <Button onClick={handleSave} disabled={saving || !form.title || !form.scheduled_at} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2">
          <Plus className="w-4 h-4" /> {saving ? "Saving..." : "Add Class"}
        </Button>
      </div>

      <div className="space-y-2">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-800">{cls.title}</p>
              <p className="text-xs text-gray-400">{moment(cls.scheduled_at).format("MMM D, YYYY [at] h:mm A")}</p>
            </div>
            <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-50 w-8 h-8" onClick={() => deleteMutation.mutate(cls.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {classes.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No classes yet.</p>}
      </div>
    </div>
  );
}