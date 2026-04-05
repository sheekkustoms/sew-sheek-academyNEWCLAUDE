import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Video, Clock, Download, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { createPageUrl } from "@/utils";

export default function LiveClassDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const classId = location.state?.classId;

  const { data: cls, isLoading } = useQuery({
    queryKey: ["liveClassDetail", classId],
    queryFn: () => base44.entities.LiveClass.list().then(classes => classes.find(c => c.id === classId)),
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="max-w-2xl mx-auto pt-8 text-center">
        <p className="text-gray-500">Class not found</p>
        <Button onClick={() => navigate(createPageUrl("LiveClasses"))} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const handleCopyZoom = () => {
    if (cls.zoom_url) {
      navigator.clipboard.writeText(cls.zoom_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPast = new Date(cls.scheduled_at).getTime() + 60 * 60 * 1000 <= Date.now();

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(cls.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `class-materials-${cls.title?.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(createPageUrl("LiveClasses"))} className="mb-6 gap-2 -ml-2">
        <ChevronLeft className="w-4 h-4" /> Back to Classes
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-violet-500 p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{cls.title}</h1>
              {cls.description && <p className="text-white/80 mt-2">{cls.description}</p>}
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Clock className="w-4 h-4" />
                {moment(cls.scheduled_at).local().format("dddd, MMMM D [at] h:mm A z")}
                {isPast && <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">Past Class</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Zoom Link */}
          {cls.zoom_url && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" /> Join Class
              </h2>
              <div className="flex items-center gap-3">
                <a href={cls.zoom_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Video className="w-4 h-4" /> Open Zoom Link
                  </Button>
                </a>
              </div>
              <div className="mt-3 bg-white border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <code className="text-xs text-blue-600 flex-1 break-all font-mono">{cls.zoom_url}</code>
                <button onClick={handleCopyZoom} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Supply List */}
          {cls.supply_list && cls.supply_list.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Supply List</h2>
              <div className="space-y-3 text-gray-700">
                {cls.supply_list.map((item, idx) => {
                  const trimmed = item.trim();
                  
                  // Category headers (contain emoji at start)
                  if (/^[🧵🪡✂️📌🎨🔧]/.test(trimmed)) {
                    return (
                      <div key={idx} className="pt-2">
                        <p className="font-bold text-lg text-gray-900">{trimmed}</p>
                      </div>
                    );
                  }
                  
                  // OR divider
                  if (trimmed.toUpperCase() === "OR") {
                    return (
                      <div key={idx} className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-amber-300" />
                        <span className="text-xs text-amber-600 font-semibold">OR</span>
                        <div className="flex-1 h-px bg-amber-300" />
                      </div>
                    );
                  }
                  
                  // Regular bullet items
                  return (
                    <p key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{trimmed}</span>
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* PDF Materials */}
          {cls.pdf_url && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" /> Class Materials
              </h2>
              <Button onClick={handleDownloadPDF} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Download className="w-4 h-4" /> Download PDF Materials
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!cls.zoom_url && !cls.pdf_url && (!cls.supply_list || cls.supply_list.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No additional materials available for this class yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}