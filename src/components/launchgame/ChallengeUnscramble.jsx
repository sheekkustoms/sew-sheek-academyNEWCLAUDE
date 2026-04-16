import React, { useState } from "react";
import { RotateCcw, CheckCircle2 } from "lucide-react";

export default function ChallengeUnscramble({ challenge, onComplete }) {
  const [tiles, setTiles] = useState(challenge.letters.map((l, i) => ({ letter: l, id: i, used: false })));
  const [answer, setAnswer] = useState([]); // {letter, id}
  const [result, setResult] = useState(null); // null | "correct" | "wrong"

  const tapTile = (tile) => {
    if (tile.used || result === "correct") return;
    const newAnswer = [...answer, { letter: tile.letter, id: tile.id }];
    setAnswer(newAnswer);
    setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, used: true } : t));

    if (newAnswer.length === challenge.letters.length) {
      const word = newAnswer.map(t => t.letter).join("");
      if (word === challenge.answer) {
        setResult("correct");
        setTimeout(() => onComplete(challenge.xpFull, true), 1500);
      } else {
        setResult("wrong");
        setTimeout(() => {
          setResult(null);
          setAnswer([]);
          setTiles(challenge.letters.map((l, i) => ({ letter: l, id: i, used: false })));
        }, 1200);
      }
    }
  };

  const reset = () => {
    setAnswer([]);
    setTiles(challenge.letters.map((l, i) => ({ letter: l, id: i, used: false })));
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/70 text-sm">Tap the letters in the correct order to spell out the sewing term.</p>
        <p className="text-white/40 text-xs mt-1 italic">Hint: {challenge.hint}</p>
      </div>

      {/* Answer slots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {Array(challenge.letters.length).fill(0).map((_, i) => {
          const t = answer[i];
          let slotCls = "border-white/20 bg-white/5 text-white";
          if (result === "correct") slotCls = "border-green-400 bg-green-500/30 text-green-300";
          else if (result === "wrong") slotCls = "border-red-400 bg-red-500/30 text-red-300";
          return (
            <div key={i} className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-extrabold transition-all ${slotCls}`}>
              {t?.letter || ""}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {result === "correct" && (
        <div className="text-center flex items-center justify-center gap-2 text-green-400 font-bold">
          <CheckCircle2 className="w-5 h-5" /> SELVAGE — correct!
        </div>
      )}
      {result === "wrong" && (
        <div className="text-center text-red-400 font-bold text-sm">Not quite — try again!</div>
      )}

      {/* Letter tiles */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tapTile(tile)}
            disabled={tile.used || result === "correct"}
            className={`w-11 h-12 rounded-xl border-2 font-extrabold text-lg transition-all ${
              tile.used
                ? "border-white/10 bg-white/5 text-white/20 cursor-not-allowed"
                : "border-[#E91E8C] bg-[#E91E8C]/20 text-white hover:bg-[#E91E8C]/40 active:scale-95"
            }`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold transition-colors mx-auto"
      >
        <RotateCcw className="w-4 h-4" /> Reset
      </button>
    </div>
  );
}