import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";
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
    label: "🧵 TENSION",
    xpFull: 25,
    xpPartial: 8,
    question: "Your stitches have loops on the BOTTOM of the fabric. What does that mean?",
    options: [
      "Your top tension is too loose",
      "Your top tension is too tight",
      "Your bobbin is out of thread",
      "Your needle is the wrong size",
    ],
    correct: 1,
    correctFeedback: "Right! Loops on the bottom = top tension too tight. Lower the dial and test on a scrap.",
    wrongFeedback: "Loops on the bottom mean your top thread is being pulled too tight. Lower tension slightly.",
  },
  {
    id: 2,
    type: "quiz",
    label: "✂️ SEAM ALLOWANCE",
    xpFull: 25,
    xpPartial: 8,
    question: "The standard seam allowance for most home sewing patterns is:",
    options: ["1/4 inch", "5/8 inch", "1 inch", "1/2 inch"],
    correct: 1,
    correctFeedback: "Yes! 5/8 inch is the standard in most home sewing patterns.",
    wrongFeedback: "The standard is 5/8 inch. Always check your pattern — some (like quilting) use 1/4 inch.",
  },
  {
    id: 3,
    type: "quiz",
    label: "🪡 NEEDLE KNOWLEDGE",
    xpFull: 25,
    xpPartial: 8,
    question: "Which needle type should you use when sewing knit (stretch) fabric?",
    options: ["Universal needle", "Ballpoint / stretch needle", "Leather needle", "Denim needle"],
    correct: 1,
    correctFeedback: "Ballpoint needle! It slides between knit fibers instead of piercing and breaking them.",
    wrongFeedback: "Use a ballpoint or stretch needle for knits — it pushes fibers aside instead of cutting them.",
  },
  {
    id: 4,
    type: "quiz",
    label: "🧶 FABRIC GRAIN",
    xpFull: 25,
    xpPartial: 8,
    question: "What happens when you cut fabric off-grain?",
    options: [
      "The seams press more easily",
      "The fabric stretches or twists after washing",
      "You get a stronger seam",
      "Nothing — grain doesn't matter for home projects",
    ],
    correct: 1,
    correctFeedback: "Correct! Off-grain cutting causes garments to twist and seams to pull after washing.",
    wrongFeedback: "Off-grain fabric stretches or twists after washing. Always align your pattern to the grain line.",
  },
  {
    id: 5,
    type: "quiz",
    label: "🔥 PRESSING",
    xpFull: 25,
    xpPartial: 8,
    question: "What is the most important habit that separates a good sewist from a great one?",
    options: [
      "Sewing as fast as possible",
      "Buying expensive tools",
      "Pressing every seam before sewing the next one",
      "Always using a serger",
    ],
    correct: 2,
    correctFeedback: "EXACTLY. Press as you go. That one habit transforms messy into professional.",
    wrongFeedback: "Pressing every seam before you sew over it is THE habit. It's what makes garments look professional.",
  },
  {
    id: 6,
    type: "quiz",
    label: "🧵 BOBBIN BASICS",
    xpFull: 25,
    xpPartial: 8,
    question: "Stitches are looping on the TOP of your fabric. This usually means:",
    options: [
      "The bobbin tension is too tight",
      "The top thread tension is too loose",
      "Your needle is dull",
      "The bobbin thread ran out",
    ],
    correct: 1,
    correctFeedback: "Yes! Loops on top usually mean the top tension is too loose — it's being pulled down by the bobbin.",
    wrongFeedback: "Loops on top = top tension too loose. Increase it slightly and test on a scrap.",
  },
  {
    id: 7,
    type: "quiz",
    label: "👗 FABRIC WEIGHT",
    xpFull: 25,
    xpPartial: 8,
    question: "You're making a structured tote bag. Which fabric is the BEST choice?",
    options: [
      "Chiffon — lightweight and flowy",
      "Canvas or duck cloth — sturdy and heavy",
      "Silk charmeuse — elegant and smooth",
      "Jersey knit — stretchy and comfortable",
    ],
    correct: 1,
    correctFeedback: "Canvas all day! It holds shape and handles weight. Perfect for bags.",
    wrongFeedback: "Canvas or duck cloth is the right answer — it's structured and durable for bags.",
  },
  {
    id: 8,
    type: "quiz",
    label: "✂️ SEAM FINISHES",
    xpFull: 25,
    xpPartial: 8,
    question: "Which seam finish gives you a completely enclosed seam with no raw edges — no serger needed?",
    options: [
      "Zigzag stitch",
      "Pinked edges",
      "French seam",
      "Flat-felled seam",
    ],
    correct: 2,
    correctFeedback: "French seam! Wraps the raw edges completely inside. Beautiful and clean.",
    wrongFeedback: "A French seam encloses raw edges completely inside the seam — no serger needed.",
  },
  {
    id: 9,
    type: "quiz",
    label: "📏 MEASURING",
    xpFull: 25,
    xpPartial: 8,
    question: "When taking body measurements for a pattern, which tool do you use?",
    options: [
      "A rigid ruler",
      "A flexible tape measure",
      "A yardstick",
      "A quilting square",
    ],
    correct: 1,
    correctFeedback: "Flexible tape measure! It curves with your body for accurate measurements.",
    wrongFeedback: "Always use a flexible tape measure — it conforms to your body shape for accurate readings.",
  },
  {
    id: 10,
    type: "quiz",
    label: "🎯 BACKSTITCHING",
    xpFull: 25,
    xpPartial: 8,
    question: "Why do you backstitch at the beginning and end of a seam?",
    options: [
      "To make the seam look prettier",
      "To lock the stitches so they don't unravel",
      "To increase seam strength throughout",
      "It's optional — just a personal preference",
    ],
    correct: 1,
    correctFeedback: "Correct! Backstitching locks the thread ends so your seam doesn't unravel.",
    wrongFeedback: "Backstitching locks the thread at seam ends to prevent unraveling. Always do it!",
  },
  {
    id: 11,
    type: "quiz",
    label: "🧵 THREAD WEIGHT",
    xpFull: 25,
    xpPartial: 8,
    question: "You're sewing a lightweight chiffon blouse. Which thread should you choose?",
    options: [
      "Heavy upholstery thread",
      "Fine (50wt) cotton or polyester thread",
      "Elastic thread",
      "Topstitching thread",
    ],
    correct: 1,
    correctFeedback: "Fine thread for fine fabric! Heavier thread would pucker and damage delicate fabrics.",
    wrongFeedback: "Use fine thread (50wt) for lightweight fabrics — heavy thread causes puckering.",
  },
  {
    id: 12,
    type: "quiz",
    label: "✂️ CUTTING TOOLS",
    xpFull: 25,
    xpPartial: 8,
    question: "Why should you NEVER use fabric scissors to cut paper?",
    options: [
      "Paper doesn't cut cleanly with fabric scissors",
      "Paper dulls the blades quickly, ruining them for fabric",
      "It's just a sewing myth — scissors are scissors",
      "Paper is too thick for fabric scissors",
    ],
    correct: 1,
    correctFeedback: "Yes! Paper contains clay and coating that dull blades fast. Keep your fabric scissors fabric-only!",
    wrongFeedback: "Paper dulls fabric scissor blades quickly. Always keep a separate pair for paper.",
  },
  {
    id: 13,
    type: "quiz",
    label: "🪡 STITCH LENGTH",
    xpFull: 25,
    xpPartial: 8,
    question: "You want to gather fabric for a ruffle. Which stitch length setting do you use?",
    options: [
      "Shortest stitch length (1.0)",
      "Standard stitch length (2.5)",
      "Longest stitch length (4.0–5.0)",
      "Zigzag stitch",
    ],
    correct: 2,
    correctFeedback: "Longest stitch! Long stitches are easy to pull to create gathers. Use two rows for control.",
    wrongFeedback: "Use the longest stitch length for gathering. It pulls easily into gathers without breaking.",
  },
  {
    id: 14,
    type: "quiz",
    label: "📌 PINNING",
    xpFull: 25,
    xpPartial: 8,
    question: "Which direction should you place pins relative to the seam line when machine sewing?",
    options: [
      "Parallel to the seam line",
      "Perpendicular (at a right angle) to the seam line",
      "Diagonal at 45 degrees",
      "It doesn't matter",
    ],
    correct: 1,
    correctFeedback: "Perpendicular! This lets you remove pins easily as you sew toward them.",
    wrongFeedback: "Pins should be perpendicular to the seam — you can remove them right before the needle reaches them.",
  },
  {
    id: 15,
    type: "quiz",
    label: "🔤 SELVAGE",
    xpFull: 25,
    xpPartial: 8,
    question: "What is the selvage of a fabric?",
    options: [
      "The raw cut edge of the fabric",
      "The finished woven edge that runs lengthwise on the bolt",
      "The printed design on the fabric",
      "A type of seam finish",
    ],
    correct: 1,
    correctFeedback: "Correct! The selvage is the finished edge — it doesn't fray and is where grain line starts.",
    wrongFeedback: "The selvage is the factory-finished edge along the length of the bolt. It never frays.",
  },
  {
    id: 16,
    type: "quiz",
    label: "🧵 INTERFACING",
    xpFull: 25,
    xpPartial: 8,
    question: "What is interfacing used for in sewing?",
    options: [
      "To add stretch to a garment",
      "To add structure, stiffness, or stability to fabric",
      "To reduce bulk in seams",
      "To mark the grain line on pattern pieces",
    ],
    correct: 1,
    correctFeedback: "Yes! Interfacing adds body and structure — think collars, waistbands, and bag handles.",
    wrongFeedback: "Interfacing adds structure and stability. It's used in collars, waistbands, button plackets, and bags.",
  },
  {
    id: 17,
    type: "quiz",
    label: "✂️ CLIPPING & NOTCHING",
    xpFull: 25,
    xpPartial: 8,
    question: "You sewed a curved seam and need to turn it right-side out. What should you do to the seam allowance?",
    options: [
      "Leave it as-is — it will relax on its own",
      "Clip (cut small notches into) the curved seam allowance",
      "Press the seam flat without clipping",
      "Trim the seam to 1/4 inch all the way around",
    ],
    correct: 1,
    correctFeedback: "Clip or notch curved seams! It releases tension so the curve lays smooth when turned.",
    wrongFeedback: "Clipping curved seams releases tension so they turn smoothly without bunching or puckering.",
  },
  {
    id: 18,
    type: "quiz",
    label: "👗 EASE",
    xpFull: 25,
    xpPartial: 8,
    question: "What does 'ease' mean in a sewing pattern?",
    options: [
      "How simple the pattern is to sew",
      "Extra room built into the garment beyond your body measurements",
      "The stretch percentage of a knit fabric",
      "The distance between pattern markings",
    ],
    correct: 1,
    correctFeedback: "Ease is the extra room that makes a garment comfortable and allows movement. Very important!",
    wrongFeedback: "Ease is the extra space beyond your body measurements — it allows movement and comfort.",
  },
  {
    id: 19,
    type: "quiz",
    label: "🔥 IRON SETTINGS",
    xpFull: 25,
    xpPartial: 8,
    question: "You're pressing polyester fabric. Which iron setting should you use?",
    options: [
      "High / linen setting",
      "Low / synthetic setting",
      "Steam only, no heat",
      "Cotton setting with lots of steam",
    ],
    correct: 1,
    correctFeedback: "Low heat for synthetics! High heat melts or shines polyester permanently.",
    wrongFeedback: "Polyester needs a low / synthetic iron setting. High heat will melt or permanently shine the fabric.",
  },
  {
    id: 20,
    type: "quiz",
    label: "🏁 FINAL QUESTION",
    xpFull: 25,
    xpPartial: 8,
    question: "Before you cut into new fabric, what should you ALWAYS do first?",
    options: [
      "Wash and dry it (pre-wash)",
      "Iron it with high heat",
      "Cut along the selvage edge first",
      "Apply interfacing to the whole piece",
    ],
    correct: 0,
    correctFeedback: "Pre-wash always! Fabric can shrink after washing — pre-washing prevents your finished project from shrinking.",
    wrongFeedback: "Always pre-wash fabric first! Skipping this step can cause shrinking and warping after your project is done.",
  },
];

export default function LaunchGame() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pathParam = urlParams.get("path") || "beginner";

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: assessment } = useQuery({
    queryKey: ["placementAssessment", user?.email],
    queryFn: () => base44.entities.PlacementAssessment.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // Check onboarding settings for game enabled toggle
  const { data: onboardingSettings } = useQuery({
    queryKey: ["onboardingSettings"],
    queryFn: () => base44.entities.OnboardingSettings.list().then(r => r[0] || null),
  });

  const [screen, setScreen] = useState("welcome");
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [challengeResults, setChallengeResults] = useState([]);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [answerLog, setAnswerLog] = useState([]);
  const [perQuestionXP, setPerQuestionXP] = useState([]);

  // Redirect if already completed, or if game disabled, or if 3day_replay path
  useEffect(() => {
    if (!user || !assessment || onboardingSettings === undefined) return;

    if (assessment.launch_game_completed) {
      navigate(createPageUrl("MyPath"), { replace: true });
      return;
    }

    // Skip game for 3day_replay path
    if (assessment.path_view === "3day_replay") {
      markGameSkipped();
      return;
    }

    // Skip if admin disabled the game
    if (onboardingSettings && onboardingSettings.launch_game_enabled === false) {
      markGameSkipped();
    }
  }, [assessment, onboardingSettings, user]);

  const saveGameMutation = useMutation({
    mutationFn: async ({ xpTotal, skipped }) => {
      if (!user) return;
      if (!skipped) {
        const pts = await getOrCreateUserPoints(user);
        if (pts) await awardXP(pts.id, pts, xpTotal, {});
      }
      if (assessment?.id) {
        await base44.entities.PlacementAssessment.update(assessment.id, {
          launch_game_completed: true,
          launch_game_xp: skipped ? 0 : xpTotal,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPoints", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["placementAssessment", user?.email] });
    },
  });

  const markGameSkipped = () => {
    if (assessment?.id && !assessment.launch_game_completed) {
      saveGameMutation.mutate({ xpTotal: 0, skipped: true });
    }
    navigate(createPageUrl("MyPath"), { replace: true });
  };

  const handleChallengeComplete = (xpEarned, isCorrect = null, chosenIdx = null) => {
    const newTotal = totalXP + xpEarned;
    setTotalXP(newTotal);
    setChallengeResults(prev => [...prev, { xp: xpEarned, correct: isCorrect }]);
    setPerQuestionXP(prev => [...prev, xpEarned]);
    if (isCorrect !== null) {
      setQuizTotal(prev => prev + 1);
      if (isCorrect) setQuizCorrect(prev => prev + 1);
      // Log the answer for end-of-game review
      const c = CHALLENGES[currentChallenge];
      setAnswerLog(prev => [...prev, {
        label: c.label,
        question: c.question,
        options: c.options,
        correct: c.correct,
        chosen: chosenIdx,
        isCorrect,
        correctFeedback: c.correctFeedback,
        wrongFeedback: c.wrongFeedback,
      }]);
    }

    setTimeout(() => {
      if (currentChallenge < CHALLENGES.length - 1) {
        setCurrentChallenge(prev => prev + 1);
      } else {
        finishGame(newTotal);
      }
    }, 400);
  };

  const finishGame = (finalXP) => {
    setScreen("results");
    saveGameMutation.mutate({ xpTotal: finalXP, skipped: false });
  };

  const challenge = CHALLENGES[currentChallenge];
  const maxXP = CHALLENGES.reduce((sum, c) => sum + c.xpFull, 0);

  if (screen === "welcome") {
    return (
      <LaunchWelcome
        pathParam={pathParam}
        onStart={() => setScreen("game")}
        isAdmin={user?.role === "admin"}
        onAdminSkip={markGameSkipped}
      />
    );
  }

  if (screen === "results") {
    return (
      <LaunchResults
        totalXP={totalXP}
        maxXP={maxXP}
        challengesDone={challengeResults.length}
        quizCorrect={quizCorrect}
        quizTotal={quizTotal}
        pathParam={pathParam}
        answerLog={answerLog}
        perQuestionXP={perQuestionXP}
        userEmail={user?.email}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <span className="font-extrabold text-sm tracking-widest text-[#E91E8C] uppercase">OSS Academy</span>
        <div className="flex items-center gap-1.5 bg-[#F5C518]/20 px-3 py-1.5 rounded-full">
          <Zap className="w-4 h-4 text-[#F5C518]" />
          <span className="font-extrabold text-[#F5C518] text-sm">Q {currentChallenge + 1} / {CHALLENGES.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Question {currentChallenge + 1} of {CHALLENGES.length}</span>
          <span>{Math.round(((currentChallenge) / CHALLENGES.length) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-[#E91E8C] to-[#7B2FBE] h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentChallenge) / CHALLENGES.length) * 100}%` }}
          />
        </div>
        {/* Dot indicators — show only first 20 */}
        <div className="flex gap-1 justify-center flex-wrap">
          {CHALLENGES.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < currentChallenge ? "bg-[#E91E8C]" :
              i === currentChallenge ? "bg-white scale-125" :
              "bg-white/20"
            }`} />
          ))}
        </div>
      </div>

      {/* Challenge label */}
      <div className="px-4 pt-4">
        <span className="text-xs font-bold text-[#E91E8C] uppercase tracking-widest">{challenge.label}</span>
      </div>

      {/* Challenge content */}
      <div className="flex-1 px-4 py-4 overflow-auto">
        {challenge.type === "quiz" && (
          <ChallengeQuiz key={currentChallenge} challenge={challenge} onComplete={handleChallengeComplete} />
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