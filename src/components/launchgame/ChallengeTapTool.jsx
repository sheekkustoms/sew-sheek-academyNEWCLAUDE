import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ChallengeTapTool({ challenge, onComplete }) {
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggle = (idx) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correctOnes = challenge.items.filter(i => i.correct);
    const allCorrect = correctOnes.every((_, i) => {
      const idx = challenge.items.indexOf(correctOnes[i]);
      return selected.has(idx);
    }) && [...selected].every(idx => challenge.items[idx].correct);

    const xp = allCorrect ? challenge.xpFull : challenge.xpPartial;
    setTimeout(() => onComplete(xp, allCorrect), 2000);
  };

  return (
    <div className="space-y-5">
      <p className="text-white/70 text-sm">Tap ALL the tools you need for proper pressing. Avoid the wrong ones.</p>

      <div className="grid grid-cols-4 gap-2">
        {challenge.items.map((item, idx) => {
          const isSelected = selected.has(idx);
          let cls = "bg-white/5 border-white/20";
          if (isSelected && !submitted) cls = "bg-[#E91E8C]/30 border-[#E91E8C]";
          if (submitted) {
            if (item.correct && isSelected) cls = "bg-green-500/30 border-green-400";
            else if (item.correct && !isSelected) cls = "bg-green-500/20 border-green-400 opacity-70";
            else if (!item.correct && isSelected) cls = "bg-red-500/30 border-red-400";
            else cls = "bg-white/5 border-white/10 opacity-40";
          }

          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${cls}`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[9px] font-bold text-white/70 text-center leading-tight px-0.5">{item.label}</span>
              {submitted && item.correct && isSelected && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </div>
              )}
              {submitted && !item.correct && isSelected && (
                <div className="absolute top-1 right-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/60 text-center">
          Correct tools: Iron, Pressing Cloth, Tailor's Ham, Seam Roll
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-xl disabled:opacity-40"
        >
          Submit Selection
        </button>
      )}
    </div>
  );
}