import React, { useRef, useState, useEffect } from "react";

const COLORS = ["#7B2FBE", "#E91E8C", "#9C27B0", "#F50057", "#6A1B9A", "#AD1457"];

export default function ChallengeSpinWheel({ challenge, onComplete }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [angle, setAngle] = useState(0);
  const animRef = useRef(null);

  const segments = challenge.segments;
  const numSegments = segments.length;
  const segAngle = (2 * Math.PI) / numSegments;

  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
      const start = currentAngle + i * segAngle;
      const end = start + segAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#1A1A2E";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(segments[i].text, r - 10, 4);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#1A1A2E";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx + r + 8, cy);
    ctx.lineTo(cx + r - 14, cy - 8);
    ctx.lineTo(cx + r - 14, cy + 8);
    ctx.closePath();
    ctx.fillStyle = "#F5C518";
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(angle);
  }, []);

  const spin = () => {
    if (spinning || result) return;
    setSpinning(true);
    const totalRotation = (5 + Math.random() * 5) * 2 * Math.PI;
    const duration = 3000;
    const start = performance.now();
    const startAngle = angle;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + totalRotation * ease;
      drawWheel(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setAngle(current);
        setSpinning(false);
        // Determine winner: pointer at right (angle 0), so we adjust
        const normalized = ((current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((2 * Math.PI - normalized) % (2 * Math.PI)) / segAngle) % numSegments;
        setResult(segments[idx]);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center space-y-5">
      <p className="text-white/70 text-sm text-center">Spin the wheel to reveal your challenge. Complete it for full XP.</p>

      {/* Wheel */}
      <div className="relative">
        <canvas ref={canvasRef} width={280} height={280} className="rounded-full shadow-lg shadow-[#7B2FBE]/40" />
      </div>

      {!result && (
        <button
          onClick={spin}
          disabled={spinning}
          className="bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold px-10 py-4 rounded-2xl text-lg disabled:opacity-60 transition-all shadow-lg shadow-[#E91E8C]/30"
        >
          {spinning ? "SPINNING..." : "SPIN!"}
        </button>
      )}

      {result && (
        <div className="w-full space-y-4">
          <div className="bg-[#7B2FBE]/30 border border-[#7B2FBE]/50 rounded-2xl p-5 text-center space-y-2">
            <p className="text-[#E91E8C] font-extrabold text-xs uppercase tracking-widest">Your Challenge</p>
            <p className="text-white font-bold text-base">{result.challenge}</p>
          </div>
          <button
            onClick={() => onComplete(challenge.xpFull, null)}
            className="w-full bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] text-white font-extrabold py-4 rounded-xl text-lg shadow-lg shadow-[#E91E8C]/30"
          >
            I Did It — Earn {challenge.xpFull} XP ⚡
          </button>
        </div>
      )}
    </div>
  );
}