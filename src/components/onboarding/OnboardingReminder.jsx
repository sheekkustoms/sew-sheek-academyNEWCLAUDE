import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";

const STEP_LABELS = [
  { id: "welcome_video",    label: "Watch the Welcome Video" },
  { id: "intro_post",       label: "Introduce Yourself" },
  { id: "first_class",      label: "Enroll in a Class" },
  { id: "starter_pattern",  label: "Download Starter Pattern" },
];

export default function OnboardingReminder({ completedSteps, onOpen, onDismiss }) {
  const remaining = STEP_LABELS.length - completedSteps.length;
  if (remaining === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#D4AF37]/30 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-bold text-[#111] text-sm">Finish setting up your Academy experience</p>
          <p className="text-xs text-[#999] mt-0.5">{completedSteps.length} of {STEP_LABELS.length} steps complete</p>

          <div className="w-full bg-[#F5F5F5] rounded-full h-1.5 mt-3">
            <div
              className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.length / STEP_LABELS.length) * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {STEP_LABELS.map(s => {
              const done = completedSteps.includes(s.id);
              return (
                <span
                  key={s.id}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                    done ? "bg-[#F5F5F5] text-[#CFCFCF] line-through" : "bg-[#D4AF37]/10 text-[#B8960C] border border-[#D4AF37]/30"
                  }`}
                >
                  {done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {s.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpen}
            className="flex items-center gap-1 text-xs font-bold text-[#111] bg-black hover:bg-[#222] text-[#D4AF37] px-3 py-2 rounded-xl transition-all"
          >
            Continue <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDismiss} className="text-[#CFCFCF] hover:text-[#666] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}