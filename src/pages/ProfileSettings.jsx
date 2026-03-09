import React, { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    const trimmedName = fullName.trim();
    await base44.auth.updateMe({ full_name: trimmedName, avatar_url: avatarUrl });
    // Also update UserPoints display name
    const pts = await base44.entities.UserPoints.filter({ user_email: user.email });
    if (pts[0]) {
      await base44.entities.UserPoints.update(pts[0].id, { user_name: trimmedName });
    }
    // Update the cached user directly so the name doesn't reset
    queryClient.setQueryData(["currentUser"], (old) => old ? { ...old, full_name: trimmedName, avatar_url: avatarUrl } : old);
    queryClient.invalidateQueries({ queryKey: ["myPoints"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500">Update your name and profile photo</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-28 h-28 rounded-2xl cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="w-28 h-28 rounded-2xl object-cover border-2 border-pink-200" />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-100 to-violet-100 border-2 border-dashed border-pink-300 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-pink-400" />
                <span className="text-[10px] text-pink-400 mt-1 font-medium">Upload Photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <p className="text-xs text-gray-400">Tap photo to change</p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Display Name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your name..."
            className="border-gray-200 h-11 text-base"
          />
          <p className="text-xs text-gray-400">This is the name shown in the community, leaderboard, and messages.</p>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <Input
            value={user?.email || ""}
            disabled
            className="border-gray-200 h-11 bg-gray-50 text-gray-400"
          />
          <p className="text-xs text-gray-400">Email cannot be changed.</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || uploading || !fullName.trim()}
          className="w-full h-11 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold rounded-xl shadow-md"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}