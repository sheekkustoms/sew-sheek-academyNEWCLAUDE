import React from "react";
import { Eye, X } from "lucide-react";

export default function MemberPreviewBanner({ onExit }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-black flex items-center justify-between px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Eye className="w-4 h-4" />
        <span>Member Preview Mode — you're seeing the app as a regular member</span>
      </div>
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" /> Exit Preview
      </button>
    </div>
  );
}