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

        {/* Section 1: Starting Point */}
        <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6 space-y-4">
          <h2 className="font-extrabold text-lg text-[#111]">Your Starting Point</h2>
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-amber-50 rounded-xl p-5 border border-[#D4AF37]/20">
            <p className="text-sm text-[#666] mb-2">You'll start at:</p>
            <p className="text-2xl font-extrabold text-[#D4AF37]">
              {config.phase} — Module {config.module}
            </p>
          </div>
          <div className="flex gap-2 text-xs text-[#999]">
            <span className="px-2 py-1 bg-[#F5F5F5] rounded">Module 1</span>
            <span className="px-2 py-1 bg-[#F5F5F5] rounded">Module 2</span>
            <span className="px-2 py-1 bg-[#D4AF37]/15 text-[#B8960C] font-bold rounded">Module {config.module} ← You start here</span>
            <span className="px-2 py-1 bg-[#F5F5F5] rounded">Module 4</span>
            <span className="px-2 py-1 bg-[#F5F5F5] rounded">...</span>
          </div>
        </div>

        {/* Section 2: First 3 Projects */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-lg text-[#111]">Your First 3 Projects</h2>
          <div className="grid gap-3">
            {config.projects.map((project, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#EEEEEE] p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-[#111]">{project.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#F5F5F5] text-[#666]">{project.difficulty}</span>
                </div>
                <p className="text-sm text-[#666] mb-2">{project.skill}</p>
                <p className="text-xs text-[#999]">⏱ {project.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: 30-Day Action Plan */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-lg text-[#111]">Your 30-Day Action Plan</h2>
          <div className="space-y-2">
            {config.actionPlan.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#EEEEEE] p-4 flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37]/15 shrink-0 font-bold text-[#D4AF37]">
                  {item.week}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111]">Week {item.week}</p>
                  <p className="text-xs text-[#666]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Starter Checklist */}
        <div className="bg-gradient-to-br from-[#6B3FA0]/10 to-purple-50 rounded-2xl border border-[#6B3FA0]/20 p-6">
          <h2 className="font-extrabold text-lg text-[#111] mb-4">Your Starter Checklist</h2>
          <p className="text-sm text-[#666] mb-4">Download your personalized checklist with everything you need to get started.</p>
          <button className="w-full flex items-center justify-center gap-2 bg-[#6B3FA0] text-white font-bold py-3 rounded-xl hover:bg-[#5A3490] transition-colors">
            <Download className="w-4 h-4" /> Download {config.checklist}
          </button>
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
        <div className="bg-gradient-to-br from-[#6B3FA0]/8 to-purple-50 border-2 border-[#6B3FA0]/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6B3FA0]/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#6B3FA0]" />
            </div>
            <h3 className="font-bold text-[#111]">Your results have been sent to your coach and team!</h3>
          </div>
          <p className="text-sm text-[#555] leading-relaxed">
            They will review your responses and send you a personalized plan for your path. In the meantime, feel free to browse the Library and watch the replays at your leisure — more videos are being uploaded daily.
          </p>
          <Link to={createPageUrl("Library")}>
            <button className="mt-2 flex items-center gap-2 bg-[#6B3FA0] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#5A3490] transition-colors">
              <BookOpen className="w-4 h-4" /> Browse the Library
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