import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X, Paperclip } from "lucide-react";
import { getDisplayName } from "../shared/useDisplayName";

const POST_TYPES = [
  { value: "discussion", label: "💬 Discussion" },
  { value: "announcement", label: "📢 Announcement" },
  { value: "student_projects", label: "🏆 Win / Project" },
  { value: "question", label: "❓ Question" },
  { value: "resource", label: "📚 Resource" },
  { value: "ask_the_coach", label: "🎽 Ask the Coach" },
];

export default function PostComposer({ user, isAdmin, onSubmit, isPending, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("discussion");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [postAsCoach, setPostAsCoach] = useState(false);
  const displayName = getDisplayName(user);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, category, imageFile, postAsCoach });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F5]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0 ring-2 ring-[#D4AF37]/30">
            {(displayName)?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-[#111]">{postAsCoach ? "COACH" : displayName}</p>
            <p className="text-xs text-[#999]">Posting to Community</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#CFCFCF] hover:text-[#111] p-1 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {/* Post type */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="border-[#EEEEEE] h-9 text-sm bg-[#F5F5F5] w-52 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Post title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border-[#EEEEEE] font-bold text-[#111] text-base h-11 rounded-xl"
        />

        <Textarea
          placeholder="What's on your mind? Share with the community..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="border-[#EEEEEE] min-h-[120px] resize-none text-[#444] text-sm rounded-xl"
        />

        {/* Image preview */}
        {imagePreview && (
          <div className="relative rounded-xl overflow-hidden border border-[#EEEEEE]">
            <img src={imagePreview} className="w-full max-h-48 object-cover" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment row */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[#666] cursor-pointer hover:text-[#111] px-3 py-2 rounded-xl border border-dashed border-[#CFCFCF] hover:border-[#D4AF37] transition-colors">
            <ImagePlus className="w-4 h-4" /> Add Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </label>
        </div>

        {/* Admin: post as coach toggle */}
        {isAdmin && (
          <div className="flex items-center gap-3 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl">
            <button
              onClick={() => setPostAsCoach(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${postAsCoach ? "bg-[#D4AF37]" : "bg-[#CFCFCF]"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${postAsCoach ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <span className="text-xs font-semibold text-[#B8960C]">Post as 👑 COACH</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#F5F5F5] flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose} className="border-[#CFCFCF] text-[#666] rounded-xl">Cancel</Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || isPending}
          className="bg-black hover:bg-[#222] text-[#D4AF37] font-bold px-6 rounded-xl transition-all hover:scale-[1.02]"
        >
          {isPending ? "Posting..." : "Post to Community"}
        </Button>
      </div>
    </div>
  );
}