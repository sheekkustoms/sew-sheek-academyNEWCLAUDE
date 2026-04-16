import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ChallengeQuiz({ challenge, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selected === challenge.correct;
    const xp = isCorrect ? challenge.xpFull : challenge.xpPartial;
    setTimeout(() => onComplete(xp, isCorrect), 1800);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-extrabold text-white leading-snug">{challenge.question}</h2>

      <div className="space-y-3">
        {challenge.options.map((opt, idx) => {
          let cls = "border-white/20 bg-white/5 text-white";
          if (submitted) {
            if (idx === challenge.correct) cls = "border-green-400 bg-green-500/20 text-green-300";
            else if (idx === selected && selected !== challenge.correct) cls = "border-red-400 bg-red-500/20 text-red-300";
            else cls = "border-white/10 bg-white/5 text-white/40";
          } else if (selected === idx) {
            cls = "border-[#E91E8C] bg-[#E91E8C]/20 text-white";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-3 ${cls}`}
            >
              <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
              {submitted && idx === challenge.correct && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
              {submitted && idx === selected && selected !== challenge.correct && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className={`rounded-xl p-4 text-sm font-semibold ${selected === challenge.correct ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {selected === challenge.correct ? challenge.correctFeedback : challenge.wrongFeedback}
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}