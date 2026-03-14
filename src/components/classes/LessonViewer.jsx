import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileDown, ExternalLink } from "lucide-react";
import VideoPlayer from "../shared/VideoPlayer";

export default function LessonViewer({ lesson, enrollment, isCompleted, onComplete, isCompletingPending, user }) {
  return (
    <div className="flex flex-col">
      {/* Video */}
      <div className="relative bg-gray-900 aspect-video">
        <VideoPlayer
          url={lesson.video_url}
          lessonId={lesson.id}
          enrollmentRequired={!enrollment}
        />
      </div>

      {/* Lesson info */}
      <div className="p-6 space-y-4">
        {/* Title + complete button */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900 leading-snug">{lesson.title}</h3>
          {enrollment && (
            isCompleted ? (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onComplete}
                disabled={isCompletingPending}
                className="bg-gray-900 hover:bg-gray-800 text-white gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompletingPending ? "Saving..." : "Mark Complete"}
              </Button>
            )
          )}
        </div>

        {/* Description */}
        {lesson.description && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About this lesson</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
          </div>
        )}

        {/* Downloadable resources */}
        {lesson.video_url && lesson.video_url.includes("drive.google.com") && (
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resources</h4>
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Google Drive
            </a>
          </div>
        )}
      </div>
    </div>
  );
}