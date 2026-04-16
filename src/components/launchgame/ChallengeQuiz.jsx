import React, { useState } from "react";

export default function ChallengeQuiz({ challenge, onComplete }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === challenge.correct;
    const xp = isCorrect ? challenge.xpFull : challenge.xpPartial;
    // Move on quickly — no feedback shown here
    setTimeout(() => onComplete(xp, isCorrect, idx), 600);
  };

  return (
    <div className="space-y-5">
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
    </div>
  );
}