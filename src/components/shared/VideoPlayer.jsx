import React from "react";
import { Play } from "lucide-react";

function getVideoEmbed(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };

  // Google Drive  (handles /view, /preview, sharing links)
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) return { type: "iframe", src: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview` };

  // Direct video file
  return { type: "video", src: url };
}

export default function VideoPlayer({ url, lessonId, enrollmentRequired }) {
  const embed = getVideoEmbed(url);

  if (!url || (!embed && enrollmentRequired)) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
        <Play className="w-16 h-16 mb-2 opacity-30" />
        <p className="text-sm">{enrollmentRequired ? "Enroll to start watching" : "Select a lesson to start"}</p>
      </div>
    );
  }

  if (!embed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
        <Play className="w-16 h-16 mb-2 opacity-30" />
        <p className="text-sm">Select a lesson to start</p>
      </div>
    );
  }

  if (embed.type === "iframe") {
    return (
      <iframe
        key={lessonId}
        className="w-full h-full"
        src={embed.src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <video
      key={lessonId}
      controls
      autoPlay
      className="w-full h-full object-contain"
      src={embed.src}
    />
  );
}