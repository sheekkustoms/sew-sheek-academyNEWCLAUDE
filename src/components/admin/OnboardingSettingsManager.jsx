import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Video, CheckCircle, Upload } from "lucide-react";

export default function OnboardingSettingsManager() {
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ["onboardingSettings"],
    queryFn: () => base44.entities.OnboardingSettings.list(),
  });

  const existing = settings[0];

  useEffect(() => {
    if (existing) {
      setVideoUrl(existing.welcome_video_url || "");
      setVideoTitle(existing.welcome_video_title || "");
    }
  }, [existing?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { welcome_video_url: videoUrl, welcome_video_title: videoTitle, label: "default" };
      if (existing) {
        await base44.entities.OnboardingSettings.update(existing.id, data);
      } else {
        await base44.entities.OnboardingSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingSettings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // Parse video embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const id = new URLSearchParams(url.split("?")[1]).get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url; // direct video URL
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl && !videoUrl.includes("youtube") && !videoUrl.includes("youtu.be") && !videoUrl.includes("vimeo");

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-violet-600 font-semibold">
        <Video className="w-5 h-5" /> Onboarding Welcome Video
      </div>
      <p className="text-sm text-gray-500">
        This video is shown to new members in the "Watch the Welcome Video" onboarding step.
        Supports YouTube, Vimeo, or a direct video file URL.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Video Title (optional)</label>
          <Input
            placeholder="Welcome to Sew Sheek Academy!"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="border-gray-200"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Video URL</label>
          <Input
            placeholder="https://www.youtube.com/watch?v=... or Vimeo URL or direct video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="border-gray-200 font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">— or upload a video file —</label>
          <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4 shrink-0" />
            {uploading ? "Uploading..." : "Click to upload video"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setVideoUrl(file_url);
                setUploading(false);
              }}
            />
          </label>
        </div>
      </div>

      {/* Preview */}
      {videoUrl && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Preview:</p>
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video">
            {isDirectVideo ? (
              <video src={videoUrl} controls className="w-full h-full" />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            ) : null}
          </div>
        </div>
      )}

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-black hover:bg-[#222]"} text-white`}
      >
        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : saveMutation.isPending ? "Saving..." : "Save Welcome Video"}
      </Button>
    </div>
  );
}