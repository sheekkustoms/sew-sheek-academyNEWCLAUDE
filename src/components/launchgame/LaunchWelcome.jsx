import React from "react";
import { Zap, Target, Clock } from "lucide-react";

const PATH_CONFIG = {
  beginner: {
    label: "FRESH START PATH",
    color: "bg-green-500",
    tierName: "Fresh Start",
    coachMessage: `"Hey. You made it. You've been placed on the Fresh Start path — and that means we're building your foundation right.

No shortcuts. No guessing. We start at the beginning and do it properly.

Every lesson you complete earns you XP. Use those XP points to unlock bonus classes, replays, and premium content inside the Library. The more you show up, the more you unlock.

But first — play the Launch Game. It's 20 questions that show me and YOU exactly where you're starting from.

Let's build something real."`,
  },
  intermediate: {
    label: "RUSTY CREATOR PATH",
    color: "bg-amber-500",
    tierName: "Rusty Creator",
    coachMessage: `"Hey. You've been placed on the Rusty Creator path — you've got skills, they just need some dusting off.

We're not starting from zero. We're picking up where you left off and sharpening everything that matters.

Every lesson you complete earns you XP. Use those XP points to unlock bonus classes, replays, and premium content inside the Library. Stay consistent and keep stacking.

But first — play the Launch Game. It's 20 questions that show me and YOU exactly where your skills are right now.

Let's get back in the groove."`,
  },
  advanced: {
    label: "SKILLED BUILDER PATH",
    color: "bg-violet-500",
    tierName: "Skilled Builder",
    coachMessage: `"Hey. You've been placed on the Skilled Builder path — you already know what you're doing. Now we level up.

This path is for people who are ready to go deep — advanced techniques, specialty work, and building toward something bigger.

Every lesson you complete earns you XP. Use those XP points to unlock bonus classes, replays, and premium content inside the Library. The more you invest, the more you access.

But first — play the Launch Game. It's 20 questions that show me and YOU where your advanced knowledge really stands.

Let's build something extraordinary."`,
  },
};

export default function LaunchWelcome({ pathParam, onStart }) {
  const path = PATH_CONFIG[pathParam] || PATH_CONFIG.beginner;

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 text-center border-b border-white/10 bg-black/30">
        <span className="font-extrabold text-lg tracking-widest text-[#E91E8C] uppercase">Oh Sew Sheek Academy</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-lg mx-auto w-full space-y-8">
        {/* Path badge */}
        <span className={`${path.color} text-white text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg`}>
          {path.label}
        </span>

        {/* Headline */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold leading-tight">
            Your Path Is Chosen.<br />
            <span className="text-[#E91E8C]">The {path.tierName} Journey Starts Now.</span>
          </h1>
        </div>

        {/* Coach message */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white/80 leading-relaxed">
          {path.coachMessage.split("\n\n").map((para, i) => (
            <p key={i} className={i > 0 ? "mt-3" : ""}>
              {para.split("XP").map((part, j, arr) =>
                j < arr.length - 1
                  ? <React.Fragment key={j}>{part}<span className="text-[#F5C518] font-bold">XP</span></React.Fragment>
                  : part
              )}
            </p>
          ))}
          <p className="text-[#E91E8C] font-bold mt-4">— Coach Sheek</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Target className="w-5 h-5 text-[#E91E8C] mx-auto mb-1" />
            <p className="text-xl font-extrabold text-[#F5C518]">20</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Questions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-[#E91E8C] mx-auto mb-1" />
            <p className="text-xl font-extrabold text-[#F5C518]">500</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">XP Total</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-[#E91E8C] mx-auto mb-1" />
            <p className="text-xl font-extrabold text-[#F5C518]">~15</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Minutes</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg shadow-[#E91E8C]/30 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          START THE LAUNCH GAME →
        </button>
      </div>
    </div>
  );
}