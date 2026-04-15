import React from "react";
import { ChevronRight, Download, CheckCircle2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIER_CONFIG = {
  tier_1: {
    name: "Fresh Start",
    color: "#4A9D6F",
    bgColor: "#4A9D6F",
    phase: "Phase 1",
    module: 1,
    description: "You're ready to discover the joy of sewing. We'll start with the absolute fundamentals and build your confidence step by step.",
    projects: [
      { name: "Straight Line Bookmark", skill: "Basic stitching", time: "30 min", difficulty: "Beginner" },
      { name: "Simple Tote Bag", skill: "Seams and stitching", time: "2 hours", difficulty: "Beginner" },
      { name: "Elastic Waist Skirt", skill: "Patterns and sewing", time: "3 hours", difficulty: "Beginner" },
    ],
    actionPlan: [
      { week: 1, text: "Complete Modules 1 and 2 — learn your sewing machine" },
      { week: 2, text: "Complete Modules 3 and 4 — master basic stitches" },
      { week: 3, text: "Complete your first project and post it to the community" },
      { week: 4, text: "Take your Phase 1 quiz and unlock Phase 2" },
    ],
    coachNote: "You belong here. We start exactly where you are, and I'm going to walk you through every single step. Sewing is just muscle memory — and you're about to build yours.",
    checklist: "Beginner Supply List",
  },
  tier_2: {
    name: "Rusty Creator",
    color: "#B8960C",
    bgColor: "#D4AF37",
    phase: "Phase 1",
    module: 3,
    description: "You've got the basics down, but it's been a minute. Time to shake off the rust and level up your skills with intention.",
    projects: [
      { name: "Lined Zipper Pouch", skill: "Linings and zippers", time: "2 hours", difficulty: "Intermediate" },
      { name: "Basic Joggers", skill: "Patterns and fit", time: "4 hours", difficulty: "Intermediate" },
      { name: "Sublimation Tumbler", skill: "New technique", time: "1.5 hours", difficulty: "Intermediate" },
    ],
    actionPlan: [
      { week: 1, text: "Complete Modules 3 and 4 — refresh your skills" },
      { week: 2, text: "Complete Modules 5 and 6 — introduce new techniques" },
      { week: 3, text: "Complete your first project and post it to the community" },
      { week: 4, text: "Take your Phase 1 quiz and unlock Phase 2" },
    ],
    coachNote: "You have more than you think. That muscle memory is still there — we're just about to unlock it and take you beyond where you were before.",
    checklist: "Intermediate Tools Upgrade",
  },
  tier_3: {
    name: "Skilled Builder",
    color: "#8B5CC0",
    bgColor: "#6B3FA0",
    phase: "Phase 2",
    module: 1,
    description: "You're ready for the next level. Let's take your skills and turn them into something amazing — whether that's for yourself or your business.",
    projects: [
      { name: "Full Wrap Sublimation Hoodie", skill: "Advanced sublimation", time: "5 hours", difficulty: "Advanced" },
      { name: "Custom Bonnet Line", skill: "Business production", time: "6 hours", difficulty: "Advanced" },
      { name: "Patterned Garment with Lining", skill: "Complex construction", time: "6 hours", difficulty: "Advanced" },
    ],
    actionPlan: [
      { week: 1, text: "Complete Modules 1 and 2 of Phase 2" },
      { week: 2, text: "Complete Modules 3 and 4 — dive into advanced techniques" },
      { week: 3, text: "Complete your first project and post it to the community" },
      { week: 4, text: "Take your Phase 2 quiz and unlock Phase 3" },
    ],
    coachNote: "You already have the skill. Now let's build the business around it. You're at a level where you can teach this — and that's exactly where we're going.",
    checklist: "Business Setup Checklist",
  },
};

export default function PlacementResults({ tier, onStart }) {
  const config = TIER_CONFIG[tier];

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-10 pb-20">
        {/* Tier Badge */}
        <div className="text-center space-y-4">
          <div
            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg"
            style={{ backgroundColor: config.bgColor }}
          >
            <span className="text-white text-4xl font-extrabold">{tier === "tier_1" ? "1" : tier === "tier_2" ? "2" : "3"}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111]">{config.name}</h1>
          <p className="text-sm text-[#666] leading-relaxed max-w-md mx-auto">{config.description}</p>
        </div>

        {/* Coach Note */}
        <div className="bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-6 italic text-[#333] leading-relaxed">
          <p className="text-sm mb-3">
            "
            {config.coachNote}
            "
          </p>
          <p className="text-xs font-semibold text-[#999]">— Coach Sheek</p>
        </div>

        {/* Confirmation message */}
        <div className="bg-gradient-to-br from-[#D4AF37]/10 to-amber-50 border-2 border-[#D4AF37]/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-[#B8960C]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111] text-base">Thank you — you're all set! 🎉</h3>
              <p className="text-xs text-[#888] mt-0.5">Assessment submitted successfully</p>
            </div>
          </div>
          <p className="text-sm text-[#444] leading-relaxed">
            Your responses have been submitted to your coach and the Oh Sew Sheek team. We'll review your answers and personally assign you a customized learning plan within <span className="font-bold text-[#111]">24 hours</span>. Keep an eye on your inbox — your journey is about to get very intentional.
          </p>
          <p className="text-sm text-[#555] leading-relaxed">
            In the meantime, you have full access to the Library — dive into past class replays, tutorials, and bonus content. New videos are added regularly, so there's always something fresh to explore.
          </p>
          <Link to={createPageUrl("Library")}>
            <button className="mt-1 w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#F0D060] transition-colors shadow-md shadow-[#D4AF37]/20">
              <BookOpen className="w-4 h-4" /> Browse the Library While You Wait
            </button>
          </Link>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full bg-[#D4AF37] text-black font-bold px-6 py-4 rounded-xl hover:bg-[#F0D060] transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
        >
          View My Path
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}