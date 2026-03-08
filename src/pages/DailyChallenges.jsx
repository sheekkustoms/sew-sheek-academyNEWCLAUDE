import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain, Zap, CheckCircle2, XCircle, Trophy, RotateCcw,
  Flame, ChevronRight, Lock, Star, Sparkles
} from "lucide-react";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import BadgeIcon from "../components/shared/BadgeIcon";

const TODAY = new Date().toISOString().split("T")[0];
const PERFECT_XP = 250;
const PARTIAL_XP_PER_CORRECT = 30;

function QuizQuestion({ question, index, selected, onSelect, revealed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="space-y-3"
    >
      <p className="text-white font-semibold text-base leading-snug">
        <span className="text-indigo-400 mr-2">Q{index + 1}.</span>{question.question}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          let style = "bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-indigo-500/40 hover:text-white";
          if (revealed) {
            if (opt === question.correct_answer) style = "bg-emerald-500/15 border-emerald-500/50 text-emerald-300";
            else if (opt === selected && opt !== question.correct_answer) style = "bg-red-500/15 border-red-500/50 text-red-300";
            else style = "bg-slate-800/30 border-slate-700/30 text-slate-500";
          } else if (selected === opt) {
            style = "bg-indigo-500/20 border-indigo-500/60 text-indigo-200";
          }
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => onSelect(opt)}
              className={`px-4 py-3 rounded-xl border text-sm text-left transition-all font-medium ${style} ${!revealed ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-xs opacity-60 mr-2 font-mono">{String.fromCharCode(65 + i)})</span>
              {opt}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ResultScreen({ score, total, isPerfect, xpEarned, earnedBadge, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-4"
    >
      <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl ${
        isPerfect ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/30" : "bg-gradient-to-br from-indigo-500 to-purple-600"
      }`}>
        {isPerfect ? "🏆" : score >= 3 ? "🎉" : "📚"}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white">
          {isPerfect ? "Perfect Score!" : score >= 3 ? "Great Job!" : "Keep Practicing!"}
        </h2>
        <p className="text-slate-400 mt-1">
          You answered <span className="text-white font-semibold">{score}/{total}</span> questions correctly
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-400">
        <Zap className="w-6 h-6" />
        +{xpEarned} XP earned
      </div>

      {earnedBadge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl p-5 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-fuchsia-300 font-semibold">
            <Sparkles className="w-5 h-5" /> New Badge Unlocked!
          </div>
          <BadgeIcon name="Quiz Master" size="lg" />
          <p className="text-sm text-slate-400">You scored 5/5 on a Daily Challenge</p>
        </motion.div>
      )}

      {isPerfect && !earnedBadge && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300">
          🏅 You already have the Quiz Master badge — impressive!
        </div>
      )}

      <div className="text-sm text-slate-500 bg-slate-800/40 rounded-xl px-4 py-3">
        Come back tomorrow for a new challenge!
      </div>
    </motion.div>
  );
}

export default function DailyChallenges() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState("intro"); // intro | loading | quiz | result
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: myPoints } = useQuery({
    queryKey: ["myPointsChallenge", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["myEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.filter({ is_published: true }),
  });

  const { data: todayChallenge } = useQuery({
    queryKey: ["todayChallenge", user?.email],
    queryFn: () => base44.entities.DailyChallenge.filter({ user_email: user.email, challenge_date: TODAY }),
    enabled: !!user?.email,
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ["allChallenges", user?.email],
    queryFn: () => base44.entities.DailyChallenge.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const enrolledCourses = courses.filter((c) => enrollments.some((e) => e.course_id === c.id));
  const availableCourses = enrolledCourses.length > 0 ? enrolledCourses : courses;
  const alreadyDoneToday = todayChallenge && todayChallenge.length > 0;

  const generateMutation = useMutation({
    mutationFn: async (course) => {
      const prompt = `Generate exactly 5 multiple-choice quiz questions about the topic: "${course.title}". 
Category: ${course.category}. 
Each question must have exactly 4 answer options and one correct answer.
Make the questions educational, clear, and varied in difficulty.
Return ONLY valid JSON, no extra text.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });
      return { questions: result.questions, course };
    },
    onSuccess: ({ questions, course }) => {
      setQuestions(questions);
      setSelectedCourse(course);
      setAnswers({});
      setCurrentQ(0);
      setRevealed(false);
      setPhase("quiz");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
      const isPerfect = score === 5;
      const xpEarned = isPerfect ? PERFECT_XP : score * PARTIAL_XP_PER_CORRECT;
      const earnedBadge = isPerfect && !myPoints?.badges?.includes("Quiz Master");

      await base44.entities.DailyChallenge.create({
        user_email: user.email,
        challenge_date: TODAY,
        course_id: selectedCourse?.id,
        course_title: selectedCourse?.title,
        score,
        total_questions: 5,
        passed: score >= 3,
        xp_earned: xpEarned,
        perfect_score: isPerfect,
      });

      if (myPoints && xpEarned > 0) {
        await awardXP(myPoints.id, myPoints, xpEarned, {
          quiz_master_badge: earnedBadge,
        });
      }

      return { score, isPerfect, xpEarned, earnedBadge };
    },
    onSuccess: (result) => {
      setQuizResult(result);
      setPhase("result");
      queryClient.invalidateQueries({ queryKey: ["todayChallenge"] });
      queryClient.invalidateQueries({ queryKey: ["allChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["myPointsChallenge"] });
      queryClient.invalidateQueries({ queryKey: ["myPoints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardPoints"] });
    },
  });

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setRevealed(false);
    } else {
      submitMutation.mutate();
    }
  };

  const handleAnswer = (opt) => {
    if (revealed) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: opt }));
    setRevealed(true);
  };

  const totalPerfect = allChallenges.filter((c) => c.perfect_score).length;
  const totalDone = allChallenges.length;
  const avgScore = totalDone > 0 ? (allChallenges.reduce((a, c) => a + (c.score || 0), 0) / totalDone).toFixed(1) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-fuchsia-400" /> Daily Challenges
        </h1>
        <p className="text-sm text-slate-400 mt-1">5-question quizzes — score 5/5 to earn the Quiz Master badge & 250 XP</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Challenges Done", value: totalDone, icon: Trophy, color: "text-amber-400" },
          { label: "Perfect Scores", value: totalPerfect, icon: Star, color: "text-fuchsia-400" },
          { label: "Avg Score", value: `${avgScore}/5`, icon: Flame, color: "text-orange-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 min-h-[300px]">
        <AnimatePresence mode="wait">

          {/* Already done today */}
          {alreadyDoneToday && phase !== "result" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Challenge Complete!</h2>
                <p className="text-sm text-slate-400 mt-1">You scored <span className="text-white font-semibold">{todayChallenge[0].score}/5</span> today on <span className="text-indigo-300">{todayChallenge[0].course_title}</span></p>
              </div>
              {todayChallenge[0].perfect_score && (
                <div className="flex justify-center">
                  <BadgeIcon name="Quiz Master" size="lg" />
                </div>
              )}
              <p className="text-sm text-slate-500">Come back tomorrow for a new challenge 🌅</p>
            </motion.div>
          )}

          {/* Intro */}
          {!alreadyDoneToday && phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-500/20">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Ready for today's challenge?</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">Pick a course and answer 5 AI-generated questions. Score perfectly to earn the <span className="text-fuchsia-300 font-medium">Quiz Master</span> badge + <span className="text-emerald-400 font-medium">250 XP</span>!</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300 mb-2">Choose a topic:</p>
                {availableCourses.slice(0, 6).map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                      selectedCourse?.id === course.id
                        ? "bg-indigo-500/15 border-indigo-500/50 text-white"
                        : "bg-slate-700/20 border-slate-700/40 text-slate-300 hover:border-indigo-500/30 hover:text-white"
                    }`}
                  >
                    <span>{course.title}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{course.category?.replace(/_/g, " ")}</span>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => { setPhase("loading"); generateMutation.mutate(selectedCourse); }}
                disabled={!selectedCourse || generateMutation.isPending}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700 text-white font-semibold py-3"
              >
                {generateMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Generating questions...</span>
                ) : (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Start Challenge</span>
                )}
              </Button>
            </motion.div>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-4">
              <div className="w-14 h-14 rounded-full bg-fuchsia-500/15 flex items-center justify-center mx-auto animate-pulse">
                <Brain className="w-7 h-7 text-fuchsia-400" />
              </div>
              <p className="text-white font-medium">Crafting your questions...</p>
              <p className="text-sm text-slate-500">AI is generating 5 questions about <span className="text-indigo-300">{selectedCourse?.title}</span></p>
            </motion.div>
          )}

          {/* Quiz */}
          {phase === "quiz" && questions.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span className="text-indigo-400">{Object.keys(answers).length} answered</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <QuizQuestion
                question={questions[currentQ]}
                index={currentQ}
                selected={answers[currentQ]}
                onSelect={handleAnswer}
                revealed={revealed}
              />

              {/* Explanation */}
              <AnimatePresence>
                {revealed && questions[currentQ]?.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-sm text-slate-300"
                  >
                    <span className="text-indigo-400 font-medium">💡 Explanation: </span>
                    {questions[currentQ].explanation}
                  </motion.div>
                )}
              </AnimatePresence>

              {revealed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    onClick={handleNext}
                    disabled={submitMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
                  >
                    {submitMutation.isPending ? "Saving..." : currentQ < questions.length - 1 ? (
                      <span className="flex items-center gap-2">Next Question <ChevronRight className="w-4 h-4" /></span>
                    ) : (
                      <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Finish Challenge</span>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Result */}
          {phase === "result" && quizResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultScreen {...quizResult} total={5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      {allChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Past Challenges</h3>
          <div className="space-y-2">
            {[...allChallenges].sort((a, b) => new Date(b.challenge_date) - new Date(a.challenge_date)).slice(0, 7).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {c.perfect_score
                    ? <Star className="w-4 h-4 text-fuchsia-400" />
                    : c.passed
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                  }
                  <div>
                    <p className="text-sm text-white">{c.course_title || "Challenge"}</p>
                    <p className="text-xs text-slate-500">{c.challenge_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{c.score}/{c.total_questions}</span>
                  <span className="text-xs text-emerald-400 font-medium">+{c.xp_earned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}