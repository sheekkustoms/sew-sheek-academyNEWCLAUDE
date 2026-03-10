import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Gamepad2, Zap, Trophy, Play, Hash, Scissors, Cpu, BookOpen, Wrench, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORY_CONFIG = {
  beginner_sewing: { label: "Beginner Sewing", icon: Scissors, color: "from-pink-400 to-rose-500" },
  fabric_knowledge: { label: "Fabric Knowledge", icon: BookOpen, color: "from-violet-400 to-purple-500" },
  machine_troubleshooting: { label: "Machine Troubleshooting", icon: Wrench, color: "from-blue-400 to-cyan-500" },
  sewing_business: { label: "Sewing Business", icon: DollarSign, color: "from-amber-400 to-orange-500" },
  pattern_knowledge: { label: "Pattern Knowledge", icon: Cpu, color: "from-emerald-400 to-green-500" },
};

export default function QuizHome() {
  const [gameCode, setGameCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["publishedQuizzes"],
    queryFn: () => base44.entities.Quiz.filter({ is_published: true }),
  });

  const practiceQuizzes = quizzes.filter(q => q.quiz_type === "practice");
  const liveQuizzes = quizzes.filter(q => q.quiz_type === "live" && q.status === "waiting");

  const handleJoinGame = async () => {
    if (!gameCode.trim()) return;
    const found = quizzes.find(q => q.game_code === gameCode.toUpperCase().trim());
    if (!found) {
      setJoinError("Game not found. Check your code and try again.");
      return;
    }
    if (found.status !== "waiting" && found.status !== "active") {
      setJoinError("This game is not currently active.");
      return;
    }
    navigate(createPageUrl("QuizGame") + `?id=${found.id}&mode=live`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 p-8 text-center shadow-xl shadow-pink-200"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gamepad2 className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-extrabold text-white">Quiz Games</h1>
          </div>
          <p className="text-pink-100 text-sm mb-6">Compete, learn, and earn XP — Kahoot-style!</p>

          {/* Join with code */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 max-w-sm mx-auto">
            <p className="text-white font-semibold text-sm mb-3 flex items-center justify-center gap-1">
              <Hash className="w-4 h-4" /> Join a Live Game
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter game code..."
                value={gameCode}
                onChange={(e) => { setGameCode(e.target.value.toUpperCase()); setJoinError(""); }}
                className="bg-white/90 border-0 text-gray-900 font-bold tracking-widest text-center placeholder:font-normal placeholder:tracking-normal uppercase"
                maxLength={6}
              />
              <Button onClick={handleJoinGame} className="bg-white text-fuchsia-600 hover:bg-pink-50 font-bold shrink-0">
                Join!
              </Button>
            </div>
            {joinError && <p className="text-red-200 text-xs mt-2">{joinError}</p>}
          </div>
        </div>
      </motion.div>

      {/* Live games waiting */}
      {liveQuizzes.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Live Games — Join Now!
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {liveQuizzes.map((quiz, i) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border-2 border-yellow-300 rounded-2xl p-4 shadow-sm shadow-yellow-100 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-green-600 uppercase">LIVE</span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{quiz.game_code}</span>
                  </div>
                  <p className="font-bold text-gray-900">{quiz.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{quiz.category?.replace(/_/g, " ")}</p>
                </div>
                <Link to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=live`}>
                  <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold border-0">
                    <Play className="w-3.5 h-3.5 mr-1" /> Join
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Practice quizzes */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-violet-500" /> Practice Quizzes
        </h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : practiceQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No quizzes available yet</p>
            {user?.role === "admin" && (
              <Link to={createPageUrl("AdminDashboard")}>
                <Button variant="outline" className="mt-3 text-violet-600">Create your first quiz →</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {practiceQuizzes.map((quiz, i) => {
              const cfg = CATEGORY_CONFIG[quiz.category] || CATEGORY_CONFIG.beginner_sewing;
              const Icon = cfg.icon;
              return (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={createPageUrl("QuizGame") + `?id=${quiz.id}&mode=practice`}>
                    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-pink-200 transition-all shadow-sm">
                      <div className={`h-24 bg-gradient-to-br ${cfg.color} flex items-center justify-center relative`}>
                        <Icon className="w-10 h-10 text-white/60" />
                        <div className="absolute top-3 right-3 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {quiz.quiz_type}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{quiz.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{quiz.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400 capitalize">{cfg.label}</span>
                          <div className="flex items-center gap-1 text-fuchsia-600 text-xs font-bold">
                            <Zap className="w-3 h-3" /> +XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}