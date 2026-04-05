import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileSetupModal({ user, onComplete }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    if (!avatarUrl) { setError("Please upload a profile photo."); return; }
    setSaving(true);
    await base44.auth.updateMe({ full_name: fullName.trim(), avatar_url: avatarUrl });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6">
        <div>
          <div className="text-4xl mb-2">🧵</div>
          <h2 className="text-xl font-extrabold text-gray-900">Complete Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Add your name and photo before joining the academy!</p>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="relative w-24 h-24 rounded-2xl cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="w-24 h-24 rounded-2xl object-cover border-2 border-pink-200" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-100 to-violet-100 border-2 border-dashed border-pink-300 flex flex-col items-center justify-center">
                <Camera className="w-7 h-7 text-pink-400" />
                <span className="text-[10px] text-pink-400 mt-1 font-medium">Upload Photo</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {!uploading && avatarUrl && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <p className="text-[11px] text-gray-400">Required — tap to upload</p>
        </div>

        {/* Name */}
        <div className="text-left space-y-1">
          <label className="text-xs font-semibold text-gray-600">Full Name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name..."
            className="border-gray-200"
          />
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold h-11 rounded-xl shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Continue 🎉"}
        </Button>
      </div>
    </div>
  );
}