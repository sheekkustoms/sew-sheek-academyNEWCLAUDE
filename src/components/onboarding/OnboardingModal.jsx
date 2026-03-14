import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const STEPS = [
  {
    id: "welcome_video",
    label: "Watch the Welcome Video",
    description: "Get oriented with a quick intro from your coach.",
    cta: "Go to Welcome Class",
    page: "Classes",
  },
  {
    id: "intro_post",
    label: "Introduce Yourself in the Community",
    description: "Say hi! Tell us who you are and what you're excited to sew.",
    cta: "Post Your Intro",
    page: "Community",
  },
  {
    id: "first_class",
    label: "Enroll in Your First Class",
    description: "Pick a course and start your sewing journey.",
    cta: "View Classes",
    page: "Classes",
  },
  {
    id: "starter_pattern",
    label: "Download Your Starter Pattern",
    description: "Grab your first pattern PDF from the live class library.",
    cta: "Go to Sewing Patterns",
    page: "LiveClasses",
  },
];

export default function OnboardingModal({ onClose, completedSteps, onMarkStep }) {
  const [phase, setPhase] = useState("welcome"); // "welcome" | "checklist"

  const { data: onboardingSettings = [] } = useQuery({
    queryKey: ["onboardingSettings"],
    queryFn: () => base44.entities.OnboardingSettings.list(),
  });
  const settings = onboardingSettings[0];
  const welcomeVideoUrl = settings?.welcome_video_url;

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
    return url;
  };
  const embedUrl = getEmbedUrl(welcomeVideoUrl);
  const isDirectVideo = welcomeVideoUrl && !welcomeVideoUrl.includes("youtube") && !welcomeVideoUrl.includes("youtu.be") && !welcomeVideoUrl.includes("vimeo");

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EEEEEE]"
          >
            <div className="h-1.5 bg-[#D4AF37]" />
            <div className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#111] leading-tight tracking-tight">
                  Welcome to SEW SHEEK ACADEMY
                </h1>
                <p className="text-[#666] mt-2 text-sm leading-relaxed">
                  You're in the room where sewists become <span className="font-bold text-[#111]">SHEEK.</span>
                </p>
              </div>
              <div className="pt-1 space-y-3">
                <Button
                  onClick={() => setPhase("checklist")}
                  className="w-full bg-black hover:bg-[#222] text-[#D4AF37] h-11 rounded-xl font-bold gap-2 transition-all hover:scale-[1.01]"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
                <button onClick={onClose} className="text-sm text-[#999] hover:text-[#666] transition-colors">
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "checklist" && (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#EEEEEE]"
          >
            <div className="h-1.5 bg-[#D4AF37]" />
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111] tracking-tight">Academy Setup</h2>
                  <p className="text-xs text-[#999] mt-0.5">{completedSteps.length} of {STEPS.length} completed</p>
                </div>
                <button onClick={onClose} className="text-[#CFCFCF] hover:text-[#666] transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#F5F5F5] rounded-full h-1.5">
                <motion.div
                  className="bg-[#D4AF37] h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-2.5">
                {STEPS.map((step, i) => {
                  const done = completedSteps.includes(step.id);
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                        done ? "bg-[#F5F5F5] border-[#EEEEEE]" : "bg-white border-[#EEEEEE] hover:border-[#D4AF37]/40"
                      }`}
                    >
                      <button onClick={() => onMarkStep(step.id)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                        {done
                          ? <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                          : <Circle className="w-5 h-5 text-[#CFCFCF]" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${done ? "line-through text-[#999]" : "text-[#111]"}`}>{step.label}</p>
                        {!done && <p className="text-xs text-[#666] mt-0.5">{step.description}</p>}
                      </div>
                      {!done && (
                        <Link to={createPageUrl(step.page)} onClick={onClose}>
                          <Button size="sm" className="shrink-0 bg-black hover:bg-[#222] text-[#D4AF37] text-xs h-8 whitespace-nowrap rounded-lg font-semibold">
                            {step.cta}
                          </Button>
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {completedSteps.length === STEPS.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 text-center"
                >
                  <p className="font-extrabold text-[#111]">🎉 You're all set!</p>
                  <p className="text-sm text-[#666] mt-1">Your Academy experience is fully set up.</p>
                  <Button onClick={onClose} className="mt-3 bg-black hover:bg-[#222] text-[#D4AF37] font-bold h-9 px-6 rounded-lg text-sm">
                    Go to Dashboard
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}