import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Play, Square, Copy, Check, Users, ChevronRight, X, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LiveGameHost({ quiz, onClose }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ["liveSessions", quiz.id],
    queryFn: () => base44.entities.QuizSession.filter({ quiz_id: quiz.id }),
    refetchInterval: 3000,
  });

  const activePlayers = sessions.filter(s => !s.is_finished);

  const copyCode = () => {
    navigator.clipboard.writeText(quiz.game_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = useMutation({
    mutationFn: () => base44.entities.Quiz.update(quiz.id, { status: "active", current_question_index: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }),
  });

  const endGame = useMutation({
    mutationFn: () => base44.entities.Quiz.update(quiz.id, { status: "finished", is_published: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }); onClose(); },
  });

  const nextQuestion = useMutation({
    mutationFn: () => base44.entities.Quiz.update(quiz.id, { current_question_index: (quiz.current_question_index || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }),
  });

  const statusColor = {
    waiting: "bg-yellow-100 text-yellow-700 border-yellow-300",
    active: "bg-green-100 text-green-700 border-green-300",
    finished: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-fuchsia-200 rounded-3xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 px-6 py-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            <span className="font-bold text-lg">Live Game Host Panel</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-pink-100 text-sm truncate">{quiz.title}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Game Code */}
        <div className="bg-gray-950 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Game Code</p>
          <p className="text-white font-black text-5xl tracking-[0.3em] font-mono mb-4">{quiz.game_code}</p>
          <Button onClick={copyCode} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white gap-2">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
          <p className="text-gray-500 text-xs mt-3">Share this code with students at <span className="text-fuchsia-400 font-semibold">Quiz Games → Join Live</span></p>
        </div>

        {/* Status + Players */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <Badge className={`mb-2 border ${statusColor[quiz.status] || statusColor.waiting} capitalize`}>
              {quiz.status === "active" ? "🔴 LIVE" : quiz.status === "waiting" ? "⏳ Waiting" : quiz.status}
            </Badge>
            <p className="text-xs text-gray-500">Game Status</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-fuchsia-500" />
              <span className="text-2xl font-black text-gray-900">{activePlayers.length}</span>
            </div>
            <p className="text-xs text-gray-500">Players Joined</p>
          </div>
        </div>

        {/* Players list */}
        {activePlayers.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-3 max-h-36 overflow-y-auto">
            <p className="text-xs text-gray-500 font-semibold mb-2">Players in lobby:</p>
            <div className="flex flex-wrap gap-2">
              {activePlayers.map(s => (
                <span key={s.id} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                  {s.player_name || s.player_email}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {quiz.status === "waiting" && (
            <Button
              onClick={() => startGame.mutate()}
              disabled={startGame.isPending || activePlayers.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold gap-2 h-11"
            >
              <Play className="w-4 h-4" />
              {startGame.isPending ? "Starting..." : `Start Game${activePlayers.length === 0 ? " (waiting for players)" : ""}`}
            </Button>
          )}
          {quiz.status === "active" && (
            <Button
              onClick={() => nextQuestion.mutate()}
              disabled={nextQuestion.isPending}
              className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-bold gap-2 h-11"
            >
              <ChevronRight className="w-4 h-4" />
              Next Question (#{(quiz.current_question_index || 0) + 1})
            </Button>
          )}
          <Button
            onClick={() => endGame.mutate()}
            disabled={endGame.isPending}
            variant="outline"
            className="border-red-200 text-red-500 hover:bg-red-50 gap-2 h-11"
          >
            <Square className="w-4 h-4" />
            End Game
          </Button>
        </div>
      </div>
    </motion.div>
  );
}