import React, { useState, useEffect } from "react";

const TIME_LIMIT = 5;

export default function ChallengeQuiz({ challenge, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft <= 0) {
      // Time's up — auto-submit as wrong (no XP)
      setSelected(-1);
      setTimeout(() => onComplete(0, false, -1), 600);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, selected]);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === challenge.correct;
    const xp = isCorrect ? challenge.xpFull : challenge.xpPartial;
    setTimeout(() => onComplete(xp, isCorrect, idx), 600);
  };

  const pct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft <= 2 ? "#EF4444" : timeLeft <= 3 ? "#F5C518" : "#E91E8C";

  return (
    <div className="space-y-5">
      {/* Countdown timer */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, backgroundColor: timerColor }}
          />
        </div>
        <span className="font-extrabold text-lg shrink-0" style={{ color: timerColor, minWidth: "1.5rem", textAlign: "right" }}>
          {timeLeft}
        </span>
      </div>

      <h2 className="text-xl font-extrabold text-white leading-snug">{challenge.question}</h2>

      <div className="space-y-3">
        {challenge.options.map((opt, idx) => {
          let cls = "border-white/20 bg-white/5 text-white hover:border-[#E91E8C]/60 hover:bg-[#E91E8C]/10";
          if (selected !== null) {
            if (idx === selected) cls = "border-[#E91E8C] bg-[#E91E8C]/20 text-white";
            else cls = "border-white/10 bg-white/5 text-white/30";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-3 ${cls} disabled:cursor-default`}
            >
              <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {selected === -1 && (
        <p className="text-center text-red-400 font-bold text-sm">⏱ Time's up!</p>
      )}
    </div>
  );
}