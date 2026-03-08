import React from "react";
import { Play } from "lucide-react";

function getVideoEmbed(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`, allowExtra: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`, allowExtra: "autoplay; fullscreen; picture-in-picture" };

  // Google Drive — handle all share/view/open/uc formats
  // Use /preview with no UI controls to prevent download/save options
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) return { type: "gdrive", src: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`, fileId: gdriveMatch[1] };

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

  if (embed.type === "gdrive") {
    return (
      <div className="relative w-full h-full" onContextMenu={(e) => e.preventDefault()}>
        <iframe
          key={lessonId}
          className="w-full h-full"
          src={embed.src}
          allow="autoplay; fullscreen"
          allowFullScreen
        />

      </div>
    );
  }

  if (embed.type === "iframe") {
    return (
      <iframe
        key={lessonId}
        className="w-full h-full"
        src={embed.src}
        allow={embed.allowExtra || "fullscreen"}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
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