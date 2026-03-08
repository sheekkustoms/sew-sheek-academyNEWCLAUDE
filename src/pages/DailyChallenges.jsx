import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain, Zap, CheckCircle2, XCircle, Trophy, Star,
  Flame, ChevronRight, Sparkles, Lock
} from "lucide-react";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import BadgeIcon from "../components/shared/BadgeIcon";

// Use ISO week number to gate one attempt per week
function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

const THIS_WEEK = getWeekKey();
const PERFECT_XP = 250;
const PARTIAL_XP_PER_CORRECT = 30;

function ResultScreen({ score, total, isPerfect, xpEarned, earnedBadge }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-5 py-4"
    >
      <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl ${
        isPerfect ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/30" : "bg-gradient-to-br from-indigo-500 to-purple-600"
      }`}>
        {isPerfect ? "🏆" : score / total >= 0.6 ? "🎉" : "📚"}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isPerfect ? "Perfect Score!" : score / total >= 0.6 ? "Great Job!" : "Keep Practicing!"}
        </h2>
        <p className="text-gray-500 mt-1">
          You answered <span className="text-gray-900 font-semibold">{score}/{total}</span> questions correctly
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-500">
        <Zap className="w-6 h-6" />
        +{xpEarned} XP earned
      </div>

      {earnedBadge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-5 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-fuchsia-600 font-semibold">
            <Sparkles className="w-5 h-5" /> New Badge Unlocked!
          </div>
          <BadgeIcon name="Quiz Master" size="lg" />
          <p className="text-sm text-gray-500">You scored perfectly on a Weekly Challenge</p>
        </motion.div>
      )}

      {isPerfect && !earnedBadge && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          🏅 You already have the Quiz Master badge — impressive!
        </div>
      )}

      <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
        Come back next week for a new challenge!
      </div>
    </motion.div>
  );
}

export default function DailyChallenges() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: myPoints } = useQuery({
    queryKey: ["myPointsChallenge", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ["weeklyChallengeSettings"],
    queryFn: () => base44.entities.WeeklyChallengeSettings.list(),
  });

  const { data: questions = [], isLoading: loadingQ } = useQuery({
    queryKey: ["weeklyChallengeQuestions"],
    queryFn: () => base44.entities.WeeklyChallengeQuestion.list("order", 50),
  });

  // Past challenge records for this user
  const { data: allChallenges = [] } = useQuery({
    queryKey: ["allChallenges", user?.email],
    queryFn: () => base44.entities.DailyChallenge.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const settings = settingsList[0];
  const isEnabled = settings?.is_enabled !== false;
  const sortedQ = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const alreadyDoneThisWeek = allChallenges.some(c => c.challenge_date === THIS_WEEK);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const score = sortedQ.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
      const total = sortedQ.length;
      const isPerfect = score === total && total > 0;
      const xpEarned = isPerfect ? PERFECT_XP : score * PARTIAL_XP_PER_CORRECT;
      const earnedBadge = isPerfect && !myPoints?.badges?.includes("Quiz Master");

      await base44.entities.DailyChallenge.create({
        user_email: user.email,
        challenge_date: THIS_WEEK,
        course_title: settings?.week_label || "Weekly Challenge",
        score,
        total_questions: total,
        passed: total > 0 && score / total >= 0.6,
        xp_earned: xpEarned,
        perfect_score: isPerfect,
      });

      if (myPoints && xpEarned > 0) {
        await awardXP(myPoints.id, myPoints, xpEarned, { quiz_master_badge: earnedBadge });
      }

      return { score, total, isPerfect, xpEarned, earnedBadge };
    },
    onSuccess: (result) => {
      setQuizResult(result);
      setPhase("result");
      queryClient.invalidateQueries({ queryKey: ["allChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["myPointsChallenge"] });
      queryClient.invalidateQueries({ queryKey: ["myPoints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardPoints"] });
    },
  });

  const handleAnswer = (opt) => {
    if (revealed) return;
    setAnswers(prev => ({ ...prev, [currentQ]: opt }));
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentQ < sortedQ.length - 1) {
      setCurrentQ(q => q + 1);
      setRevealed(false);
    } else {
      submitMutation.mutate();
    }
  };

  const totalPerfect = allChallenges.filter(c => c.perfect_score).length;
  const totalDone = allChallenges.length;
  const avgScore = totalDone > 0
    ? (allChallenges.reduce((a, c) => a + (c.score || 0), 0) / totalDone).toFixed(1)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-fuchsia-500" /> Weekly Challenge
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {settings?.week_label ? `This week: ${settings.week_label}` : "Answer this week's questions — score perfectly to earn the Quiz Master badge & 250 XP"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Challenges Done", value: totalDone, icon: Trophy, color: "text-amber-500" },
          { label: "Perfect Scores", value: totalPerfect, icon: Star, color: "text-fuchsia-500" },
          { label: "Avg Score", value: `${avgScore}/${allChallenges[0]?.total_questions || "—"}`, icon: Flame, color: "text-orange-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 min-h-[280px] shadow-sm">
        <AnimatePresence mode="wait">

          {/* Disabled */}
          {!isEnabled && (
            <motion.div key="disabled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-3">
              <Lock className="w-10 h-10 text-gray-300 mx-auto" />
              <h2 className="text-lg font-semibold text-gray-700">Challenge Paused</h2>
              <p className="text-sm text-gray-400">The weekly challenge is temporarily disabled. Check back soon!</p>
            </motion.div>
          )}

          {/* No questions yet */}
          {isEnabled && sortedQ.length === 0 && !loadingQ && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-3">
              <Brain className="w-10 h-10 text-gray-300 mx-auto" />
              <h2 className="text-lg font-semibold text-gray-700">No Questions Yet</h2>
              <p className="text-sm text-gray-400">The admin hasn't added questions for this week yet. Check back soon!</p>
            </motion.div>
          )}

          {/* Already done */}
          {isEnabled && sortedQ.length > 0 && alreadyDoneThisWeek && phase !== "result" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">This Week's Challenge Complete!</h2>
                {(() => {
                  const thisWeekRecord = allChallenges.find(c => c.challenge_date === THIS_WEEK);
                  return thisWeekRecord ? (
                    <p className="text-sm text-gray-500 mt-1">
                      You scored <span className="text-gray-900 font-semibold">{thisWeekRecord.score}/{thisWeekRecord.total_questions}</span>
                      {thisWeekRecord.perfect_score && " — Perfect score! 🏆"}
                    </p>
                  ) : null;
                })()}
              </div>
              <p className="text-sm text-gray-400">Come back next week for a new challenge 🌅</p>
            </motion.div>
          )}

          {/* Intro */}
          {isEnabled && sortedQ.length > 0 && !alreadyDoneThisWeek && phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-200">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Ready for this week's challenge?</h2>
                {settings?.description && (
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">{settings.description}</p>
                )}
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Answer <span className="text-fuchsia-600 font-semibold">{sortedQ.length} questions</span>. Score perfectly to earn the{" "}
                  <span className="text-fuchsia-600 font-semibold">Quiz Master</span> badge +{" "}
                  <span className="text-emerald-600 font-semibold">250 XP</span>!
                </p>
              </div>
              <Button
                onClick={() => setPhase("quiz")}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700 text-white font-semibold py-3"
              >
                <Zap className="w-4 h-4 mr-2" /> Start Challenge
              </Button>
            </motion.div>
          )}

          {/* Quiz */}
          {phase === "quiz" && sortedQ.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Question {currentQ + 1} of {sortedQ.length}</span>
                  <span className="text-violet-600 font-medium">{Object.keys(answers).length} answered</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${(currentQ / sortedQ.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-900 font-semibold text-base leading-snug">
                  <span className="text-fuchsia-500 mr-2">Q{currentQ + 1}.</span>
                  {sortedQ[currentQ]?.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(sortedQ[currentQ]?.options || []).filter(o => o).map((opt, i) => {
                    const isCorrect = opt === sortedQ[currentQ]?.correct_answer;
                    const isSelected = answers[currentQ] === opt;
                    let cls = "bg-gray-50 border-gray-200 text-gray-800 hover:border-violet-400 hover:bg-violet-50";
                    if (revealed) {
                      if (isCorrect) cls = "bg-emerald-50 border-emerald-400 text-emerald-800";
                      else if (isSelected) cls = "bg-red-50 border-red-400 text-red-800";
                      else cls = "bg-gray-50 border-gray-200 text-gray-400";
                    } else if (isSelected) {
                      cls = "bg-violet-50 border-violet-400 text-violet-800";
                    }
                    return (
                      <button
                        key={i}
                        disabled={revealed}
                        onClick={() => handleAnswer(opt)}
                        className={`px-4 py-3 rounded-xl border text-sm text-left transition-all font-medium ${cls} ${!revealed ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span className="text-xs opacity-50 mr-2 font-mono">{String.fromCharCode(65 + i)})</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {revealed && sortedQ[currentQ]?.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-800"
                    >
                      <span className="text-blue-600 font-semibold">💡 </span>
                      {sortedQ[currentQ].explanation}
                    </motion.div>
                  )}
                </AnimatePresence>

                {revealed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      onClick={handleNext}
                      disabled={submitMutation.isPending}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                    >
                      {submitMutation.isPending ? "Saving..." : currentQ < sortedQ.length - 1 ? (
                        <span className="flex items-center gap-2">Next Question <ChevronRight className="w-4 h-4" /></span>
                      ) : (
                        <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Finish Challenge</span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Result */}
          {phase === "result" && quizResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultScreen {...quizResult} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* History */}
      {allChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Past Challenges</h3>
          <div className="space-y-2">
            {[...allChallenges].sort((a, b) => b.challenge_date?.localeCompare(a.challenge_date)).slice(0, 7).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  {c.perfect_score
                    ? <Star className="w-4 h-4 text-fuchsia-400" />
                    : c.passed
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                  }
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.course_title || "Weekly Challenge"}</p>
                    <p className="text-xs text-gray-400">{c.challenge_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">{c.score}/{c.total_questions}</span>
                  <span className="text-xs text-emerald-500 font-medium">+{c.xp_earned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}