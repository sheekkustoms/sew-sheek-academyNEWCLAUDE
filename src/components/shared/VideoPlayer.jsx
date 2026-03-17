import React from "react";
import { Play } from "lucide-react";

function getVideoEmbed(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`, allowExtra: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" };

  // Vimeo — handle both plain URL and full embed code HTML
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`, allowExtra: "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" };

  // Google Drive — handle all share/open/uc formats with public viewing
  // Use /preview endpoint with proper params to prevent access prompts
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    // Use embedded preview with usp=sharing to bypass access request
    return { type: "gdrive", src: `https://drive.google.com/file/d/${fileId}/preview?usp=sharing`, fileId };
  }

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
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        {/* Block the pop-out arrow — small square top-right with branding */}
        <div
          className="absolute top-0 right-0 bg-gray-900 flex items-center justify-center"
          style={{ width: "80px", height: "52px", zIndex: 20, pointerEvents: "all", cursor: "default" }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[9px] font-extrabold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent leading-tight text-center">
            Oh Sew<br />Sheek
          </span>
        </div>
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