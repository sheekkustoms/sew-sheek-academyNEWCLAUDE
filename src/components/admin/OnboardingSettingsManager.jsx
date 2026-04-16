import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Video, CheckCircle, Upload, Gamepad2, ToggleLeft, ToggleRight } from "lucide-react";

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

  const gameEnabled = existing?.launch_game_enabled !== false; // default true

  const toggleGameMutation = useMutation({
    mutationFn: async () => {
      const newVal = !gameEnabled;
      if (existing) {
        await base44.entities.OnboardingSettings.update(existing.id, { launch_game_enabled: newVal });
      } else {
        await base44.entities.OnboardingSettings.create({ label: "default", launch_game_enabled: newVal });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboardingSettings"] }),
  });

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
    <div className="space-y-5">
      {/* Launch Game Toggle */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-pink-600 font-semibold">
          <Gamepad2 className="w-5 h-5" /> Launch Game Settings
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Launch Game (20-Question Quiz)</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              When <strong>ON</strong>, students on Path 1, 2, or 3 will play the 20-question sewing quiz before accessing their path.<br />
              <span className="text-amber-700 font-semibold">3-Day Replay students are always skipped — they never see the game.</span>
            </p>
          </div>
          <button
            onClick={() => toggleGameMutation.mutate()}
            disabled={toggleGameMutation.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shrink-0 ${
              gameEnabled
                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200"
            }`}
          >
            {gameEnabled
              ? <><ToggleRight className="w-5 h-5 text-green-600" /> Game ON</>
              : <><ToggleLeft className="w-5 h-5 text-gray-400" /> Game OFF</>
            }
          </button>
        </div>
        <p className="text-xs text-gray-400">
          💡 Tip: Turn the game <strong>OFF</strong> if you want all students to go straight to their learning path without any quiz.
        </p>
      </div>

      {/* Welcome Video */}
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
    </div>
  );
}