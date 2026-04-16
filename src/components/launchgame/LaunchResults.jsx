import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Zap, ChevronRight, Star, CheckCircle2, XCircle, ChevronDown, Copy, Check } from "lucide-react";

// Generate a unique code per user based on their email — deterministic but non-guessable
function generatePerfectCode(email) {
  if (!email) return "OSS-PERFECT-0000";
  let hash = 0;
  const str = email.toLowerCase() + "ohsewsheek2026";
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `OSS-PERFECT-${code}`;
}

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

function XPTally({ perQuestionXP, totalXP, onDone }) {
  const [revealed, setRevealed] = useState([]);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!perQuestionXP || perQuestionXP.length === 0) { onDone(); return; }

    let idx = 0;
    let runningTotal = 0;

    const showNext = () => {
      if (idx >= perQuestionXP.length) {
        setDone(true);
        setTimeout(onDone, 800);
        return;
      }
      runningTotal += perQuestionXP[idx];
      setRevealed(prev => [...prev, { xp: perQuestionXP[idx], running: runningTotal }]);
      setDisplayTotal(runningTotal);
      idx++;
      setTimeout(showNext, 180);
    };

    const startDelay = setTimeout(showNext, 400);
    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col items-center justify-center px-5 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[#E91E8C] font-extrabold uppercase tracking-widest text-sm">Tallying Your XP...</p>
        <div className="text-7xl font-extrabold text-[#F5C518] tabular-nums">{displayTotal}</div>
        <p className="text-white/40 text-sm">XP Earned</p>
      </div>

      <div className="w-full max-w-sm space-y-1.5 max-h-80 overflow-y-auto">
        {revealed.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl animate-pulse-once">
            <span className="text-white/60 text-xs font-semibold">Question {i + 1}</span>
            <span className={`font-extrabold text-sm ${item.xp > 0 ? "text-[#F5C518]" : "text-white/30"}`}>
              {item.xp > 0 ? `+${item.xp} XP` : "No XP"}
            </span>
          </div>
        ))}
      </div>

      {done && (
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}

function PerfectScoreCard({ code, copied, onCopy }) {
  return (
    <div className="w-full bg-gradient-to-br from-[#F5C518]/20 to-[#E91E8C]/20 border-2 border-[#F5C518] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="font-extrabold text-[#F5C518] text-base">PERFECT SCORE! YOU DID THAT.</p>
          <p className="text-white/70 text-xs mt-0.5">You answered every question correctly. That's elite level.</p>
        </div>
      </div>

      <div className="bg-black/40 border border-[#F5C518]/40 rounded-xl p-4 space-y-2">
        <p className="text-xs text-white/60 font-semibold uppercase tracking-widest">Your Unique Bonus Code</p>
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#F5C518] text-xl tracking-widest flex-1">{code}</span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 bg-[#F5C518] text-black font-bold text-xs px-3 py-2 rounded-lg hover:bg-[#F0D060] transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 leading-relaxed space-y-2">
        <p className="font-bold text-white">📧 Email this code to Coach Sheek:</p>
        <p>Send an email to <span className="text-[#E91E8C] font-bold">coach@sewsheek.com</span> with the subject line:</p>
        <p className="font-extrabold text-[#F5C518]">"I got a perfect score — {code}"</p>
        <p className="text-white/60 text-xs">Your code is unique to your account. Coach will verify it and award your bonus XP. Do not share this code — it's tied to your email address.</p>
      </div>
    </div>
  );
}

export default function LaunchResults({ totalXP, challengesDone, quizCorrect, quizTotal, pathParam, answerLog, perQuestionXP, userEmail, pathActivated }) {
  const [showTally, setShowTally] = useState(true);
  const [displayXP, setDisplayXP] = useState(0);
  const [copied, setCopied] = useState(false);

  const isPerfect = quizCorrect === quizTotal && quizTotal === 20;
  const isHighScore = totalXP >= 400;
  const accuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;
  const perfectCode = generatePerfectCode(userEmail);

  // Count-up after tally screen
  useEffect(() => {
    if (showTally) return;
    let start = 0;
    const step = totalXP / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= totalXP) { setDisplayXP(totalXP); clearInterval(timer); }
      else setDisplayXP(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [showTally, totalXP]);

  const handleCopy = () => {
    navigator.clipboard.writeText(perfectCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showTally) {
    return (
      <XPTally
        perQuestionXP={perQuestionXP || []}
        totalXP={totalXP}
        onDone={() => setShowTally(false)}
      />
    );
  }

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
          isPerfect ? "bg-[#F5C518]/30 shadow-[#F5C518]/50" :
          isHighScore ? "bg-[#F5C518]/20 shadow-[#F5C518]/30" : "bg-[#7B2FBE]/30 shadow-[#7B2FBE]/30"
        }`}>
          {isPerfect || isHighScore ? (
            <Trophy className={`w-10 h-10 ${isPerfect ? "text-[#F5C518]" : "text-[#F5C518]"}`} />
          ) : (
            <Star className="w-10 h-10 text-[#7B2FBE]" />
          )}
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold">
            {isPerfect ? "PERFECT. ABSOLUTELY PERFECT." :
             isHighScore ? "YOU WENT OFF. THAT'S SHEEK ENERGY." :
             "GOOD START. NOW KEEP GOING."}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            {isPerfect
              ? "100% correct. Every single one. You've already got the knowledge — now let's build the skill. Collect your bonus code below."
              : isHighScore
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

        {/* Perfect score card */}
        {isPerfect && (
          <PerfectScoreCard code={perfectCode} copied={copied} onCopy={handleCopy} />
        )}

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
        {pathActivated ? (
          <>
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <p className="font-extrabold text-sm text-[#E91E8C] uppercase tracking-widest">What's Next</p>
              <p className="text-white/70 text-sm leading-relaxed">Head back to your dashboard and start Lesson 1. Every lesson = <span className="text-[#F5C518] font-bold">+20 XP</span>. Finish your first module = <span className="text-[#F5C518] font-bold">+50 BONUS XP</span>.</p>
            </div>
            <Link to={firstLessonPath} className="w-full">
              <button className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg shadow-[#E91E8C]/30 flex items-center justify-center gap-2">
                GO TO MY PATH <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-full bg-[#E91E8C]/10 border border-[#E91E8C]/30 rounded-2xl p-5 space-y-2">
              <p className="font-extrabold text-sm text-[#E91E8C] uppercase tracking-widest">⏳ Your Path Is Being Activated</p>
              <p className="text-white/70 text-sm leading-relaxed">
                You earned <span className="text-[#F5C518] font-bold">{totalXP} XP</span> on the Launch Game — amazing start! Your personal learning path is being reviewed and will be activated by Coach Sheek shortly.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                In the meantime, head to the <span className="text-[#F5C518] font-bold">Library</span> to watch replays and get a head start!
              </p>
            </div>
            <Link to={createPageUrl("Library")} className="w-full">
              <button className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg shadow-[#E91E8C]/30 flex items-center justify-center gap-2">
                GO TO THE LIBRARY <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}