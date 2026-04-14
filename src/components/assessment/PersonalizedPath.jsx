import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Zap, BookMarked, Lock, CheckCircle } from "lucide-react";

const TIER_CONFIG = {
  tier_1: {
    label: "Fresh Start",
    description: "Perfect for beginners with little or no sewing experience",
    color: "from-green-500 to-emerald-600",
    courses: [
      { order: 1, title: "Your First Stitch", description: "Master the basics and thread your first seam" },
      { order: 2, title: "Hand Sewing Essentials", description: "Build foundational hand-sewing skills" },
      { order: 3, title: "Machine Confidence", description: "Get comfortable with the sewing machine" },
      { order: 4, title: "Your First Project", description: "Complete a simple pillow cover" },
    ]
  },
  tier_2: {
    label: "Rusty Creator",
    description: "You've sewn before but need a refresher and want to build new skills",
    color: "from-amber-500 to-orange-600",
    courses: [
      { order: 1, title: "Refresh & Level Up", description: "Shake off the rust and build confidence" },
      { order: 2, title: "Pattern Reading", description: "Learn to read and follow patterns" },
      { order: 3, title: "Intermediate Projects", description: "Create bags, accessories, and more" },
      { order: 4, title: "Finishing Techniques", description: "Master professional finishes" },
    ]
  },
  tier_3: {
    label: "Skilled Builder",
    description: "You're ready to tackle advanced projects and expand your repertoire",
    color: "from-purple-500 to-indigo-600",
    courses: [
      { order: 1, title: "Advanced Techniques", description: "Master complex sewing methods" },
      { order: 2, title: "Your Specialty", description: "Deep dive into your chosen focus (garments, sublimation, etc)" },
      { order: 3, title: "Business & Scaling", description: "Turn your passion into a business" },
      { order: 4, title: "Portfolio Building", description: "Create showcase pieces" },
    ]
  }
};

export default function PersonalizedPath({ tier, assessment }) {
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Tier header */}
      <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-8 text-white`}>
        <h1 className="text-3xl font-extrabold mb-2">{config.label}</h1>
        <p className="text-white/90">{config.description}</p>
      </div>

      {/* Your recommended starting point */}
      {assessment && (
        <div className="bg-white border-2 border-[#D4AF37] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Your Starting Point</p>
              <h2 className="text-xl font-extrabold text-[#111]">
                {assessment.starting_phase} — Module {assessment.starting_module}
              </h2>
              <p className="text-sm text-[#666] mt-1">This is where your personalized journey begins</p>
            </div>
            <Link to={createPageUrl("Library")} className="shrink-0">
              <button className="bg-[#D4AF37] text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0D060] transition-colors shadow-md shadow-[#D4AF37]/20 flex items-center gap-2">
                Start Learning <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Learning path roadmap */}
      <div>
        <h3 className="text-lg font-extrabold text-[#111] mb-4">Your Learning Path</h3>
        <div className="space-y-3">
          {config.courses.map((course, idx) => (
            <div key={idx} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-[#6B3FA0] text-white flex items-center justify-center font-bold shrink-0 flex-col text-xs">
                <span>{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#111] text-sm">{course.title}</h4>
                <p className="text-xs text-[#666] mt-0.5">{course.description}</p>
              </div>
              {idx === 0 && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] uppercase shrink-0">
                  Start Here
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended resources */}
      <div className="bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50 rounded-2xl p-6 border border-[#6B3FA0]/10">
        <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-[#6B3FA0]" />
          Resources Available in Your Library
        </h3>
        <ul className="space-y-2 text-sm text-[#666]">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Class replays from all instructional sessions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Step-by-step tutorials matching your level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Downloadable supply lists and project guides</span>
          </li>
        </ul>
      </div>

      {/* Action button */}
      <Link to={createPageUrl("Library")}>
        <button className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl hover:bg-[#F0D060] transition-colors shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          Explore Your Learning Path
        </button>
      </Link>
    </div>
  );
}