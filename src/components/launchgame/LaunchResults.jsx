import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Zap, ChevronRight, Star, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

function AnswerReview({ answerLog }) {
  const [open, setOpen] = useState(false);

  if (!answerLog || answerLog.length === 0) return null;

  return (
    <div className="w-full border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="font-extrabold text-sm text-white/80 uppercase tracking-widest">Review Your Answers</span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {answerLog.map((entry, i) => (
            <div key={i} className="px-5 py-4 space-y-3">
              <div className="flex items-start gap-2">
                {entry.isCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#E91E8C] uppercase tracking-widest mb-1">{entry.label}</p>
                  <p className="text-sm font-semibold text-white leading-snug">{entry.question}</p>
                </div>
              </div>

              <div className="space-y-1.5 ml-6">
                {entry.options.map((opt, idx) => {
                  const isCorrect = idx === entry.correct;
                  const isChosen = idx === entry.chosen;
                  let cls = "border-white/10 text-white/30 bg-transparent";
                  if (isCorrect) cls = "border-green-500 bg-green-500/15 text-green-300";
                  else if (isChosen && !isCorrect) cls = "border-red-500 bg-red-500/15 text-red-300";

                  return (
                    <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${cls}`}>
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                      {isChosen && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Feedback tip */}
              <div className={`ml-6 rounded-lg px-3 py-2 text-xs font-medium ${entry.isCorrect ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                {entry.isCorrect ? entry.correctFeedback : entry.wrongFeedback}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LaunchResults({ totalXP, challengesDone, quizCorrect, quizTotal, pathParam, answerLog }) {
  const [displayXP, setDisplayXP] = useState(0);
  const isHighScore = totalXP >= 400;
  const accuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

  // Count-up animation
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = totalXP / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= totalXP) {
        setDisplayXP(totalXP);
        clearInterval(timer);
      } else {
        setDisplayXP(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [totalXP]);

  const firstLessonPath = pathParam === "advanced"
    ? createPageUrl("Library")
    : createPageUrl("MyPath");

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      <div className="px-4 py-5 text-center border-b border-white/10 bg-black/30">
        <span className="font-extrabold text-lg tracking-widest text-[#E91E8C] uppercase">Oh Sew Sheek Academy</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 py-8 max-w-lg mx-auto w-full space-y-6">
        {/* Trophy icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${
          isHighScore ? "bg-[#F5C518]/20 shadow-[#F5C518]/30" : "bg-[#7B2FBE]/30 shadow-[#7B2FBE]/30"
        }`}>
          {isHighScore ? (
            <Trophy className="w-10 h-10 text-[#F5C518]" />
          ) : (
            <Star className="w-10 h-10 text-[#7B2FBE]" />
          )}
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold">
            {isHighScore ? "YOU WENT OFF. THAT'S SHEEK ENERGY." : "GOOD START. NOW KEEP GOING."}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            {isHighScore
              ? "You showed up, answered right, and earned your XP. Now go hit Lesson 1 — the real work starts now."
              : "You got your first XP on the board. Every lesson adds more. Keep showing up — that's how you earn the hoodie."}
          </p>
        </div>

        {/* XP Display */}
        <div className="text-center">
          <div className="text-6xl font-extrabold text-[#F5C518]">{displayXP}</div>
          <p className="text-white/40 text-sm mt-1">XP Earned</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{quizCorrect}/{quizTotal}</p>
            <p className="text-xs text-white/40 mt-1">Correct Answers</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{accuracy}%</p>
            <p className="text-xs text-white/40 mt-1">Accuracy</p>
          </div>
        </div>

        {/* Hoodie progress */}
        <div className="w-full bg-[#7B2FBE]/20 border border-[#7B2FBE]/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👕</span>
            <div>
              <p className="font-extrabold text-sm text-white">Hoodie Unlock Progress</p>
              <p className="text-xs text-white/50">Stack 500 XP and you unlock your Oh Sew Sheek Academy hoodie.</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#E91E8C] to-[#F5C518] h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((totalXP / 500) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>{totalXP} XP earned</span>
            <span>500 XP goal</span>
          </div>
        </div>

        {/* Answer Review (collapsible) */}
        <AnswerReview answerLog={answerLog} />

        {/* What's next */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
          <p className="font-extrabold text-sm text-[#E91E8C] uppercase tracking-widest">What's Next</p>
          <p className="text-white/70 text-sm leading-relaxed">Head back to your dashboard and start Lesson 1. Every lesson = <span className="text-[#F5C518] font-bold">+20 XP</span>. Finish your first module = <span className="text-[#F5C518] font-bold">+50 BONUS XP</span>.</p>
        </div>

        {/* CTA */}
        <Link to={firstLessonPath} className="w-full">
          <button className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg shadow-[#E91E8C]/30 flex items-center justify-center gap-2">
            GO TO MY PATH <ChevronRight className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
}