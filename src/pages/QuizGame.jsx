import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Clock, CheckCircle2, XCircle, Crown, Medal, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import confetti from "canvas-confetti";

const ANSWER_COLORS = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-yellow-400 to-amber-500",
  "from-emerald-500 to-green-600",
];
const ANSWER_SHAPES = ["▲", "◆", "●", "■"];

export default function QuizGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");
  const mode = urlParams.get("mode") || "practice";
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState("lobby"); // lobby | question | feedback | leaderboard | finished
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const timerRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: quiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const r = await base44.entities.Quiz.filter({ id: quizId });
      return r[0];
    },
    enabled: !!quizId,
    staleTime: 0,
    gcTime: 0,
  });
  const { data: questions = [] } = useQuery({
    queryKey: ["quizQuestions", quizId],
    queryFn: async () => {
      if (!quizId) return [];
      const r = await base44.entities.QuizQuestion.filter({ quiz_id: quizId });
      return r.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    enabled: !!quizId,
    staleTime: 0,
    gcTime: 0,
  });
  const { data: myPoints } = useQuery({
    queryKey: ["myPointsQuiz", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const { data: existingSession } = useQuery({
    queryKey: ["quizSession", quizId, user?.email],
    queryFn: () => base44.entities.QuizSession.filter({ quiz_id: quizId, player_email: user.email }),
    enabled: !!user?.email && !!quizId,
  });

  const alreadyCompleted = existingSession?.some(s => s.is_finished);

  const currentQ = questions[currentQIndex];
  const totalQ = questions.length;

  // Calculate time per question based on quiz's total_duration_seconds
  const timePerQuestion = quiz?.total_duration_seconds && quiz.total_duration_seconds > 0 
    ? Math.ceil(quiz.total_duration_seconds / totalQ) 
    : (quiz?.time_per_question || 20);

  // Timer
  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(timePerQuestion);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null); // time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentQIndex]);

  // Live mode: poll quiz status
  useEffect(() => {
    if (mode !== "live") return;
    const interval = setInterval(async () => {
      const r = await base44.entities.Quiz.filter({ id: quizId });
      const q = r[0];
      if (!q) return;
      if (q.status === "active" && phase === "lobby") setPhase("question");
      if (q.current_question_index !== currentQIndex && phase === "feedback") {
        setCurrentQIndex(q.current_question_index);
        setSelectedAnswer(null);
        setPhase("question");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [mode, phase, currentQIndex]);

  // Load leaderboard
  const loadLeaderboard = async () => {
    const sessions = await base44.entities.QuizSession.filter({ quiz_id: quizId });
    const sorted = sessions.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    setAllSessions(sorted);
  };

  const startGame = async () => {
    if (!quizId || !user) return;
    
    // Create or find session
    const existing = await base44.entities.QuizSession.filter({ quiz_id: quizId, player_email: user.email });
    let sid;
    if (existing.length > 0) {
      sid = existing[0].id;
    } else {
      const sess = await base44.entities.QuizSession.create({
        quiz_id: quizId,
        player_email: user.email,
        player_name: user.full_name || user.email,
        total_score: 0,
        answers: [],
        is_finished: false,
      });
      sid = sess.id;
    }
    setSessionId(sid);
    setPhase("question");
  };

  const handleAnswer = async (answerIndex) => {
    clearInterval(timerRef.current);
    if (selectedAnswer !== null) return; // already answered
    setSelectedAnswer(answerIndex === null ? -1 : answerIndex);

    const isCorrect = answerIndex === currentQ?.correct_answer_index;
    const basePoints = isCorrect ? (currentQ?.points || 100) : 0;
    const timeBonus = isCorrect ? Math.round((timeLeft / timePerQuestion) * 15) : 0;
    const earned = basePoints + timeBonus;

    const newScore = score + earned;
    setScore(newScore);

    const newAnswers = [...answers, { qIndex: currentQIndex, answer: answerIndex, correct: isCorrect, points: earned }];
    setAnswers(newAnswers);

    // Update session
    if (sessionId) {
      await base44.entities.QuizSession.update(sessionId, { total_score: newScore, answers: newAnswers });
    }

    setPhase("feedback");

    // Auto-advance after 2.5s (practice mode)
    if (mode === "practice") {
      setTimeout(async () => {
        if (currentQIndex + 1 >= totalQ) {
          await finishGame(newScore, newAnswers);
        } else {
          await loadLeaderboard();
          setPhase("leaderboard");
          setTimeout(() => {
            setCurrentQIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setPhase("question");
          }, 3000);
        }
      }, 2500);
    }
  };

  const finishGame = async (finalScore, finalAnswers) => {
    if (sessionId) {
      await base44.entities.QuizSession.update(sessionId, { total_score: finalScore, answers: finalAnswers, is_finished: true });
    }
    // Award XP
    if (myPoints) {
      const correct = finalAnswers.filter(a => a.correct).length;
      const xp = finalScore + 50; // completion bonus
      await awardXP(myPoints.id, myPoints, xp);
    }
    await loadLeaderboard();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    setPhase("finished");
  };

  const progressPct = totalQ > 0 ? Math.round(((currentQIndex) / totalQ) * 100) : 0;

  // ── ALREADY COMPLETED ──
  if (phase === "lobby" && alreadyCompleted && mode === "practice") return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <Link to={createPageUrl("QuizHome")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500">
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl border border-gray-200 shadow-md p-8 space-y-4"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Already Completed!</h2>
        <p className="text-gray-500 text-sm">You've already taken this quiz. Each quiz can only be completed once to keep scoring fair.</p>
        <Link to={createPageUrl("QuizHome")}>
          <Button className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold">
            Browse Other Quizzes
          </Button>
        </Link>
      </motion.div>
    </div>
  );

  // ── LOBBY ──
  if (phase === "lobby") return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <Link to={createPageUrl("QuizHome")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500">
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-3xl p-8 text-white shadow-xl shadow-fuchsia-200"
      >
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold mb-1">{quiz?.title}</h2>
        <p className="text-fuchsia-100 text-sm mb-2">{quiz?.description}</p>
        <p className="text-white/70 text-xs mb-6">{totalQ} questions · Earn XP for every correct answer</p>
        {mode === "live" && quiz?.status === "waiting" ? (
          <div className="bg-white/20 rounded-xl p-4 mb-4">
            <Users className="w-5 h-5 mx-auto mb-1 text-white" />
            <p className="text-sm text-white">Waiting for host to start...</p>
          </div>
        ) : null}
        <Button onClick={startGame} size="lg"
          className="w-full bg-white text-fuchsia-700 hover:bg-fuchsia-50 font-extrabold text-lg shadow-md"
        >
          {mode === "live" ? "I'm Ready!" : "Start Quiz!"}
        </Button>
      </motion.div>
    </div>
  );

  // ── QUESTION ──
  if (phase === "question" && currentQ) {
    const opts = currentQ.question_type === "true_false" ? ["True", "False"] : (currentQ.options || []);
    const timerPct = (timeLeft / (currentQ.time_limit || 20)) * 100;
    const timerColor = timerPct > 50 ? "bg-emerald-500" : timerPct > 25 ? "bg-amber-500" : "bg-red-500";

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Question {currentQIndex + 1}/{totalQ}</span>
          <div className="flex items-center gap-1 text-fuchsia-600 font-bold"><Zap className="w-4 h-4" />{score}</div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Timer */}
            <div className="flex items-center justify-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#a855f7" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-gray-900">{timeLeft}</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Time per question</p>
                <p className="text-lg font-bold text-gray-900">{timePerQuestion}s</p>
              </div>
            </div>

        {/* Question card */}
        <motion.div key={currentQIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 text-center"
        >
          {currentQ.image_url && <img src={currentQ.image_url} className="w-full max-h-48 object-cover rounded-xl mb-4" />}
          <h2 className="text-xl font-extrabold text-gray-900">{currentQ.question_text}</h2>
          <div className="text-xs text-gray-400 mt-1">{currentQ.points} pts + up to 15 speed bonus</div>
        </motion.div>

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3">
          {opts.map((opt, i) => (
            <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              onClick={() => handleAnswer(i)}
              disabled={selectedAnswer !== null}
              className={`bg-gradient-to-br ${ANSWER_COLORS[i % 4]} text-black rounded-2xl p-4 min-h-[80px] flex flex-col items-center justify-center gap-1 font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-70`}
            >
              <span className="text-2xl opacity-70">{ANSWER_SHAPES[i % 4]}</span>
              <span>{opt}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── FEEDBACK ──
  if (phase === "feedback" && currentQ) {
    const lastAnswer = answers[answers.length - 1];
    const opts = currentQ.question_type === "true_false" ? ["True", "False"] : (currentQ.options || []);
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Question {currentQIndex + 1}/{totalQ}</span>
          <div className="flex items-center gap-1 text-fuchsia-600 font-bold"><Zap className="w-4 h-4" />{score}</div>
        </div>
        <AnimatePresence>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`rounded-3xl p-6 text-center ${lastAnswer?.correct ? "bg-emerald-50 border-2 border-emerald-300" : "bg-red-50 border-2 border-red-300"}`}
          >
            {lastAnswer?.correct
              ? <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              : <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />}
            <p className="text-xl font-extrabold text-gray-900">{lastAnswer?.correct ? "Correct! 🎉" : "Oops! 😬"}</p>
            {lastAnswer?.correct && <p className="text-emerald-600 font-bold mt-1">+{lastAnswer.points} points</p>}
            <p className="text-sm text-gray-500 mt-2">
              Correct answer: <span className="font-bold text-gray-800">{opts[currentQ.correct_answer_index]}</span>
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="grid grid-cols-2 gap-3">
          {opts.map((opt, i) => (
            <div key={i}
              className={`rounded-2xl p-4 min-h-[80px] flex flex-col items-center justify-center gap-1 font-bold text-sm border-2 transition-all ${
                i === currentQ.correct_answer_index ? "bg-emerald-500 border-emerald-600 text-black" :
                i === selectedAnswer && selectedAnswer !== currentQ.correct_answer_index ? "bg-red-500 border-red-600 text-black" :
                "bg-gray-100 border-gray-200 text-black"
              }`}
            >
              <span className="text-2xl opacity-70">{ANSWER_SHAPES[i % 4]}</span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
        {mode === "live" && <p className="text-center text-sm text-gray-400 animate-pulse">Waiting for next question...</p>}
      </div>
    );
  }

  // ── LEADERBOARD (between questions) ──
  if (phase === "leaderboard") return (
    <div className="max-w-md mx-auto space-y-4 py-4">
      <h2 className="text-xl font-extrabold text-center text-gray-900">🏆 Live Rankings</h2>
      <div className="space-y-2">
        {allSessions.slice(0, 5).map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${s.player_email === user?.email ? "bg-violet-50 border-violet-200" : "bg-white border-gray-100"}`}
          >
            <span className="w-7 font-bold text-center text-gray-500">#{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {(s.player_name || "?")[0].toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800">{s.player_name}</span>
            <span className="text-fuchsia-600 font-bold">{s.total_score}</span>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-400 animate-pulse">Next question coming up...</p>
    </div>
  );

  // ── FINISHED ──
  if (phase === "finished") {
    const myRank = allSessions.findIndex(s => s.player_email === user?.email) + 1;
    const top3 = allSessions.slice(0, 3);
    const correct = answers.filter(a => a.correct).length;
    return (
      <div className="max-w-md mx-auto space-y-6 py-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-3xl p-8 text-white shadow-xl"
        >
          <p className="text-5xl mb-2">🎉</p>
          <h2 className="text-2xl font-extrabold mb-1">Quiz Complete!</h2>
          <p className="text-fuchsia-100 text-sm mb-4">You answered {correct}/{totalQ} correctly</p>
          <div className="bg-white/20 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-extrabold">{score}</p><p className="text-xs text-fuchsia-200">Score</p></div>
            <div><p className="text-2xl font-extrabold">#{myRank || "—"}</p><p className="text-xs text-fuchsia-200">Rank</p></div>
            <div><p className="text-2xl font-extrabold">{score + 50}</p><p className="text-xs text-fuchsia-200">XP Earned</p></div>
          </div>
        </motion.div>

        {/* Podium */}
        {top3.length >= 1 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">🏆 Final Podium</h3>
            <div className="grid grid-cols-3 gap-2 items-end">
              {[top3[1], top3[0], top3[2]].map((s, i) => {
                if (!s) return <div key={i} />;
                const rank = [2, 1, 3][i];
                const heights = ["h-20", "h-28", "h-16"];
                const emojis = ["🥈", "🥇", "🥉"];
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                    className="flex flex-col items-center"
                  >
                    <p className="text-2xl mb-1">{emojis[i]}</p>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm mb-1">
                      {(s.player_name || "?")[0].toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-gray-800 truncate w-full text-center">{s.player_name?.split(" ")[0]}</p>
                    <p className="text-xs text-fuchsia-600 font-bold">{s.total_score}</p>
                    <div className={`w-full ${heights[i]} mt-2 rounded-t-xl ${["bg-gray-300", "bg-amber-400", "bg-orange-400"][i]}`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <Link to={createPageUrl("QuizHome")}>
          <Button className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-lg py-6">
            Play Another Quiz
          </Button>
        </Link>
      </div>
    );
  }

  return <div className="text-center py-20 text-gray-400">Loading quiz...</div>;
}