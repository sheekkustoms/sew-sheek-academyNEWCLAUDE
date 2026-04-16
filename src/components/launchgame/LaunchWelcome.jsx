import React from "react";
import { Zap, Target, Clock } from "lucide-react";

const PATH_CONFIG = {
  beginner: { label: "BEGINNER PATH", color: "bg-green-500" },
  intermediate: { label: "INTERMEDIATE PATH", color: "bg-amber-500" },
  advanced: { label: "ADVANCED PATH", color: "bg-violet-500" },
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
            <span className="text-[#E91E8C]">Now the Real Work Begins.</span>
          </h1>
        </div>

        {/* Coach message */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white/80 leading-relaxed space-y-2">
          <p>"Hey. You made it. You chose your path — and that alone says something.</p>
          <p>This isn't a YouTube playlist. This is a structured academy built to take you from where you are to where you're trying to go.</p>
          <p>Every lesson earns XP. Every challenge levels you up. Hit <span className="text-[#F5C518] font-bold">500 XP</span> and you unlock your <span className="font-bold text-white">OSS Academy Hoodie</span>.</p>
          <p>But first — play the Launch Game. It tells me and YOU where you're starting from.</p>
          <p>Read the guide. Play the game. Then go hit Lesson 1. Let's build something real."</p>
          <p className="text-[#E91E8C] font-bold mt-2">— Coach Sheek</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { Icon: Target, value: "7", label: "Challenges" },
            { Icon: Zap, value: "500", label: "XP Total" },
            { Icon: Clock, value: "~12", label: "Minutes" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <Icon className="w-5 h-5 text-[#E91E8C] mx-auto mb-1" />
              <p className="text-xl font-extrabold text-[#F5C518]">{value}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
            </div>
          ))}
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