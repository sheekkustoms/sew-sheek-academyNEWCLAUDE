import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Trophy, ChevronRight, Star } from "lucide-react";
import { getOrCreateUserPoints, awardXP } from "@/components/shared/useUserPoints";

import LaunchWelcome from "@/components/launchgame/LaunchWelcome";
import ChallengeQuiz from "@/components/launchgame/ChallengeQuiz";
import ChallengeSpinWheel from "@/components/launchgame/ChallengeSpinWheel";
import ChallengeUnscramble from "@/components/launchgame/ChallengeUnscramble";
import ChallengeTapTool from "@/components/launchgame/ChallengeTapTool";
import LaunchResults from "@/components/launchgame/LaunchResults";

const CHALLENGES = [
  {
    id: 1,
    type: "quiz",
    label: "🧵 TRIVIA — TENSION",
    xpFull: 60,
    xpPartial: 18,
    question: "Your stitches have loops on the BOTTOM of the fabric. What does that mean?",
    options: [
      "Your top tension is too loose",
      "Your top tension is too tight",
      "Your bobbin is out of thread",
      "Your needle is the wrong size",
    ],
    correct: 1,
    correctFeedback: "That's right! Loops on the bottom = top tension too tight. Bring that dial down and test on a scrap.",
    wrongFeedback: "Loops on the BOTTOM mean your top thread is being pulled too tight. Lower the tension slightly and retest.",
  },
  {
    id: 2,
    type: "spin",
    label: "🎡 SPIN THE WHEEL",
    xpFull: 80,
    segments: [
      { text: "Name 3 Seam Finishes", challenge: "Name 3 different seam finishes you know." },
      { text: "Fabric Weight?", challenge: "What weight fabric works best for a structured tote bag?" },
      { text: "Press or Iron?", challenge: "What's the difference between pressing and ironing — in one sentence?" },
      { text: "Needle Size?", challenge: "What needle size would you use for quilting cotton?" },
      { text: "Grain Line!", challenge: "True or false: You can fix off-grain cutting with pressing." },
      { text: "Tension Tip!", challenge: "Before touching the tension dial, what do you check first?" },
    ],
  },
  {
    id: 3,
    type: "quiz",
    label: "👗 TRIVIA — FABRIC",
    xpFull: 70,
    xpPartial: 21,
    question: "You're making a sleep bonnet. Which fabric weight is the best choice?",
    options: [
      "Lightweight — soft and drapey, gentle on hair",
      "Heavy weight — more durable and structured",
      "Medium weight — it's the safe choice for everything",
      "Doesn't matter — any fabric works for a bonnet",
    ],
    correct: 0,
    correctFeedback: "Yes! A bonnet needs to be soft and breathable. Lightweight is the move.",
    wrongFeedback: "For a sleep bonnet, you want lightweight fabric — soft, breathable, and gentle against hair.",
  },
  {
    id: 4,
    type: "unscramble",
    label: "🔤 UNSCRAMBLE IT",
    xpFull: 80,
    letters: ["G", "L", "S", "E", "V", "A", "E"],
    answer: "SELVAGE",
    hint: "The finished edge of a fabric bolt — and where you measure grain line from.",
  },
  {
    id: 5,
    type: "quiz",
    label: "✂️ TRIVIA — SEAM FINISHES",
    xpFull: 70,
    xpPartial: 21,
    question: "Which seam finish is best for a lightweight, dressy fabric with no visible raw edges?",
    options: [
      "Zigzag stitch — fast and gets the job done",
      "Serged edge — standard in ready-to-wear",
      "French seam — enclosed finish, zero raw edges",
      "No finish needed — lightweight fabric doesn't fray",
    ],
    correct: 2,
    correctFeedback: "French seam all day! Encases the raw edge completely. Perfect for delicate or sheer fabrics.",
    wrongFeedback: "French seam is the answer. It wraps the raw edge completely inside — clean on both sides, no serger required.",
  },
  {
    id: 6,
    type: "taptool",
    label: "👆 TAP THE RIGHT TOOL",
    xpFull: 70,
    xpPartial: 28,
    items: [
      { emoji: "🔥", label: "Iron", correct: true },
      { emoji: "✂️", label: "Scissors", correct: false },
      { emoji: "🧲", label: "Pressing Cloth", correct: true },
      { emoji: "📏", label: "Ruler", correct: false },
      { emoji: "🎭", label: "Tailor's Ham", correct: true },
      { emoji: "🪡", label: "Thread", correct: false },
      { emoji: "📦", label: "Seam Roll", correct: true },
      { emoji: "🪢", label: "Bobbin", correct: false },
    ],
  },
  {
    id: 7,
    type: "quiz",
    label: "🏁 FINAL QUESTION",
    xpFull: 70,
    xpPartial: 21,
    question: "What is the MOST important habit that separates a good sewist from a great one?",
    options: [
      "Buying the most expensive machine",
      "Pressing every seam before sewing over it",
      "Sewing as fast as possible",
      "Posting every project on social media",
    ],
    correct: 1,
    correctFeedback: "THAT'S IT. Press as you go. That one habit is the difference between messy and professional.",
    wrongFeedback: "The answer is pressing every seam before sewing the next one. It's the habit that transforms everything.",
  },
];

export default function LaunchGame() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pathParam = urlParams.get("path") || "beginner";

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  // Check if already completed
  const { data: assessment } = useQuery({
    queryKey: ["placementAssessment", user?.email],
    queryFn: () => base44.entities.PlacementAssessment.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const [screen, setScreen] = useState("welcome"); // welcome | game | results
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [xpFlash, setXpFlash] = useState(null); // "+60 XP"
  const [challengeResults, setChallengeResults] = useState([]); // {xp, correct}
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  // Redirect if launch game already completed
  useEffect(() => {
    if (assessment?.launch_game_completed) {
      navigate(createPageUrl("MyPath"), { replace: true });
    }
  }, [assessment]);

  const flashXP = (amount) => {
    setXpFlash(`+${amount} XP`);
    setTimeout(() => setXpFlash(null), 1500);
  };

  const handleChallengeComplete = (xpEarned, isCorrect = null) => {
    const newTotal = totalXP + xpEarned;
    setTotalXP(newTotal);
    flashXP(xpEarned);
    setChallengeResults(prev => [...prev, { xp: xpEarned, correct: isCorrect }]);
    if (isCorrect !== null) {
      setQuizTotal(prev => prev + 1);
      if (isCorrect) setQuizCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentChallenge < CHALLENGES.length - 1) {
        setCurrentChallenge(prev => prev + 1);
      } else {
        finishGame(newTotal);
      }
    }, 400);
  };

  const saveGameMutation = useMutation({
    mutationFn: async (xpTotal) => {
      if (!user) return;
      const pts = await getOrCreateUserPoints(user);
      if (pts) {
        await awardXP(pts.id, pts, xpTotal, {});
      }
      if (assessment?.id) {
        await base44.entities.PlacementAssessment.update(assessment.id, {
          launch_game_completed: true,
          launch_game_xp: xpTotal,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPoints", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["placementAssessment", user?.email] });
    },
  });

  const finishGame = (finalXP) => {
    setScreen("results");
    saveGameMutation.mutate(finalXP);
  };

  const challenge = CHALLENGES[currentChallenge];

  if (screen === "welcome") {
    return <LaunchWelcome pathParam={pathParam} onStart={() => setScreen("game")} />;
  }

  if (screen === "results") {
    return (
      <LaunchResults
        totalXP={totalXP}
        challengesDone={challengeResults.length}
        quizCorrect={quizCorrect}
        quizTotal={quizTotal}
        pathParam={pathParam}
      />
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <span className="font-extrabold text-sm tracking-widest text-[#E91E8C] uppercase">OSS Academy</span>
        <div className="flex items-center gap-1.5 bg-[#F5C518]/20 px-3 py-1.5 rounded-full">
          <Zap className="w-4 h-4 text-[#F5C518]" />
          <span className="font-extrabold text-[#F5C518] text-sm">{totalXP} / 500 XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Challenge {currentChallenge + 1} of {CHALLENGES.length}</span>
          <span>{Math.round(((currentChallenge) / CHALLENGES.length) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentChallenge) / CHALLENGES.length) * 100}%` }}
          />
        </div>
        {/* Dot indicators */}
        <div className="flex gap-1.5 justify-center">
          {CHALLENGES.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < currentChallenge ? "bg-[#E91E8C]" :
              i === currentChallenge ? "bg-white scale-125" :
              "bg-white/20"
            }`} />
          ))}
        </div>
      </div>

      {/* XP Flash */}
      {xpFlash && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#F5C518] text-black font-extrabold text-lg px-4 py-2 rounded-2xl shadow-lg shadow-[#F5C518]/40">
            {xpFlash}
          </div>
        </div>
      )}

      {/* Challenge label */}
      <div className="px-4 pt-4">
        <span className="text-xs font-bold text-[#E91E8C] uppercase tracking-widest">{challenge.label}</span>
      </div>

      {/* Challenge content */}
      <div className="flex-1 px-4 py-4 overflow-auto">
        {challenge.type === "quiz" && (
          <ChallengeQuiz challenge={challenge} onComplete={handleChallengeComplete} />
        )}
        {challenge.type === "spin" && (
          <ChallengeSpinWheel challenge={challenge} onComplete={handleChallengeComplete} />
        )}
        {challenge.type === "unscramble" && (
          <ChallengeUnscramble challenge={challenge} onComplete={handleChallengeComplete} />
        )}
        {challenge.type === "taptool" && (
          <ChallengeTapTool challenge={challenge} onComplete={handleChallengeComplete} />
        )}
      </div>
    </div>
  );
}