import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Play, Eye, Gamepad2, ChevronDown, ChevronUp, X, Copy, Radio } from "lucide-react";
import LiveGameHost from "./LiveGameHost";
import QuizContentParser from "./QuizContentParser";
import QuizEditor from "./QuizEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "beginner_sewing", label: "🪡 Beginner Sewing" },
  { value: "fabric_knowledge", label: "🧶 Fabric Knowledge" },
  { value: "machine_troubleshooting", label: "🔧 Machine Troubleshooting" },
  { value: "sewing_business", label: "💰 Sewing Business" },
  { value: "pattern_knowledge", label: "📐 Pattern Knowledge" },
];

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function QuestionEditor({ question, quizId, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(question);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(question);
  }, [question.points, question.time_limit, question.question_text, question.options, question.correct_answer_index]);
  const queryClient = useQueryClient();

  const save = async () => {
    setSaving(true);
    await base44.entities.QuizQuestion.update(question.id, form);
    queryClient.invalidateQueries({ queryKey: ["adminQuizQuestions", quizId] });
    setSaving(false);
    setExpanded(false);
  };

  const opts = form.question_type === "true_false" ? ["True", "False"] : (form.options || ["", "", "", ""]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="w-7 h-7 bg-gradient-to-br from-pink-500 to-violet-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-800 truncate">{question.question_text || "Untitled question"}</p>
        <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 capitalize shrink-0">{question.question_type?.replace(/_/g, " ")}</Badge>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
          <Textarea placeholder="Question text..." value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Type</label>
              <Select value={form.question_type} onValueChange={v => setForm({ ...form, question_type: v })}>
                <SelectTrigger className="border-gray-200 bg-white h-9 text-sm text-gray-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="image_question">Image Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Time Limit (sec)</label>
              <Input type="number" value={form.time_limit} onChange={e => setForm({ ...form, time_limit: +e.target.value })} className="border-gray-200 bg-white h-9 text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Points</label>
              <Input type="number" value={form.points} onChange={e => setForm({ ...form, points: +e.target.value })} className="border-gray-200 bg-white h-9 text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Correct Answer</label>
              <Select value={String(form.correct_answer_index)} onValueChange={v => setForm({ ...form, correct_answer_index: +v })}>
                <SelectTrigger className="border-gray-200 bg-white h-9 text-sm text-gray-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(form.question_type === "true_false" ? ["True", "False"] : (form.options || ["", "", "", ""])).map((opt, i) => (
                    <SelectItem key={i} value={String(i)}>
                      <span className="font-bold text-gray-700">#{i + 1}</span> {opt || `Option ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.question_type === "image_question" && (
            <Input placeholder="Image URL..." value={form.image_url || ""} onChange={e => setForm({ ...form, image_url: e.target.value })} className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400" />
          )}

          {form.question_type !== "true_false" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Answer Options</label>
              {(form.options || ["", "", "", ""]).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold shrink-0 ${["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-emerald-500"][i]}`}>{i + 1}</span>
                  <Input value={opt} onChange={e => {
                    const opts = [...(form.options || ["", "", "", ""])];
                    opts[i] = e.target.value;
                    setForm({ ...form, options: opts });
                  }} placeholder={`Option ${i + 1}`} className="border-gray-200 bg-white h-8 text-sm text-gray-900 placeholder:text-gray-400" />
                </div>
              ))}
            </div>
          )}

          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white w-full">
            {saving ? "Saving..." : "Save Question"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function QuizBuilder() {
  const queryClient = useQueryClient();
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [hostingQuizId, setHostingQuizId] = useState(null);
  const [editingQuizSettingsId, setEditingQuizSettingsId] = useState(null);
  const [newQuizForm, setNewQuizForm] = useState({ title: "", description: "", category: "beginner_sewing", quiz_type: "practice", time_per_question: 20, total_duration_seconds: 0 });
  const [totalPoints, setTotalPoints] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: quizzes = [] } = useQuery({
    queryKey: ["adminQuizzes"],
    queryFn: () => base44.entities.Quiz.list("-created_date", 50),
  });
  const { data: questions = [] } = useQuery({
    queryKey: ["adminQuizQuestions", editingQuizId],
    queryFn: () => base44.entities.QuizQuestion.filter({ quiz_id: editingQuizId }),
    enabled: !!editingQuizId,
  });
  const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

  const createQuiz = useMutation({
    mutationFn: async () => {
      const code = generateCode();
      await base44.entities.Quiz.create({ ...newQuizForm, game_code: code, status: "draft", is_published: false, created_by_email: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }); setShowNewQuiz(false); setNewQuizForm({ title: "", description: "", category: "beginner_sewing", quiz_type: "practice", time_per_question: 20, total_duration_seconds: 0 }); },
  });

  const deleteQuiz = useMutation({
    mutationFn: (id) => base44.entities.Quiz.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }); if (editingQuizId === "deleted") setEditingQuizId(null); },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }) => base44.entities.Quiz.update(id, { is_published: !published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }),
  });

  const launchLive = useMutation({
    mutationFn: (id) => base44.entities.Quiz.update(id, { status: "waiting", is_published: true }),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] }); setHostingQuizId(id); },
  });

  const addQuestion = useMutation({
    mutationFn: () => base44.entities.QuizQuestion.create({
      quiz_id: editingQuizId,
      question_text: "New Question",
      question_type: "multiple_choice",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer_index: 0,
      time_limit: 20,
      points: 0,
      order: sortedQuestions.length,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminQuizQuestions", editingQuizId] }),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id) => base44.entities.QuizQuestion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminQuizQuestions", editingQuizId] }),
  });

  const distributePoints = async () => {
    const total = parseInt(totalPoints);
    if (!total || sortedQuestions.length === 0) return;
    const perQuestion = Math.floor(total / sortedQuestions.length);
    const remainder = total - perQuestion * sortedQuestions.length;
    // First reset all to 0 so useEffect detects change, then set final values
    await Promise.all(sortedQuestions.map(q =>
      base44.entities.QuizQuestion.update(q.id, { points: 0 })
    ));
    await Promise.all(sortedQuestions.map((q, i) =>
      base44.entities.QuizQuestion.update(q.id, { points: perQuestion + (i === 0 ? remainder : 0) })
    ));
    queryClient.invalidateQueries({ queryKey: ["adminQuizQuestions", editingQuizId] });
    setTotalPoints("");
  };

  const editingQuiz = quizzes.find(q => q.id === editingQuizId);

  const hostingQuiz = quizzes.find(q => q.id === hostingQuizId);

  return (
    <div className="space-y-5">
      {/* Live Host Panel */}
      <AnimatePresence>
        {hostingQuiz && (
          <LiveGameHost quiz={hostingQuiz} onClose={() => setHostingQuizId(null)} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-700 font-bold">
          <Gamepad2 className="w-5 h-5" /> Quiz Builder
        </div>
        <Button onClick={() => setShowNewQuiz(!showNewQuiz)} size="sm" className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-1">
          <Plus className="w-4 h-4" /> New Quiz
        </Button>
      </div>

      {/* New quiz form */}
      <AnimatePresence>
        {showNewQuiz && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-pink-50 to-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3"
          >
            <p className="font-bold text-violet-700">Create New Quiz</p>
            <Input placeholder="Quiz title..." value={newQuizForm.title} onChange={e => setNewQuizForm({ ...newQuizForm, title: e.target.value })} className="border-gray-200 bg-white" />
            <Textarea placeholder="Description (optional)..." value={newQuizForm.description} onChange={e => setNewQuizForm({ ...newQuizForm, description: e.target.value })} className="border-gray-200 bg-white min-h-[70px]" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newQuizForm.category} onValueChange={v => setNewQuizForm({ ...newQuizForm, category: v })}>
                <SelectTrigger className="border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={newQuizForm.quiz_type} onValueChange={v => setNewQuizForm({ ...newQuizForm, quiz_type: v })}>
                <SelectTrigger className="border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice Quiz</SelectItem>
                  <SelectItem value="live">Live Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block">Total Quiz Duration (seconds) - Leave 0 to use per-question timing</label>
              <Input type="number" placeholder="e.g. 300 for 5 minutes" value={newQuizForm.total_duration_seconds} onChange={e => setNewQuizForm({ ...newQuizForm, total_duration_seconds: +e.target.value })} className="border-gray-200 bg-white" min="0" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createQuiz.mutate()} disabled={!newQuizForm.title || createQuiz.isPending} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                {createQuiz.isPending ? "Creating..." : "Create Quiz"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewQuiz(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz list */}
      <div className="space-y-2">
        {quizzes.map(quiz => (
          <div key={quiz.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${editingQuizId === quiz.id ? "border-violet-300" : "border-gray-100"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">{quiz.title}</p>
                  <Badge className={`text-[10px] ${quiz.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {quiz.is_published ? "Published" : "Draft"}
                  </Badge>
                  {quiz.quiz_type === "live" && (
                    <Badge className={`text-[10px] ${quiz.status === "waiting" ? "bg-yellow-100 text-yellow-700" : quiz.status === "active" ? "bg-green-100 text-green-700 animate-pulse" : "bg-gray-100 text-gray-500"}`}>
                      {quiz.status === "waiting" ? "⏳ Waiting" : quiz.status === "active" ? "🔴 LIVE" : quiz.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="capitalize">{quiz.category?.replace(/_/g, " ")}</span>
                  {quiz.game_code && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">#{quiz.game_code}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8 text-blue-500" title="Edit settings" onClick={() => setEditingQuizSettingsId(editingQuizSettingsId === quiz.id ? null : quiz.id)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-violet-500" title="Edit questions" onClick={() => setEditingQuizId(editingQuizId === quiz.id ? null : quiz.id)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className={`w-8 h-8 ${quiz.is_published ? "text-amber-500" : "text-emerald-500"}`}
                  title={quiz.is_published ? "Unpublish" : "Publish"} onClick={() => togglePublish.mutate({ id: quiz.id, published: quiz.is_published })}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                {quiz.quiz_type === "live" && quiz.status === "draft" && (
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-orange-500" title="Launch live game" onClick={() => launchLive.mutate(quiz.id)}>
                    <Radio className="w-3.5 h-3.5" />
                  </Button>
                )}
                {quiz.quiz_type === "live" && (quiz.status === "waiting" || quiz.status === "active") && (
                  <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-fuchsia-600 hover:bg-fuchsia-50 gap-1" title="Open host panel" onClick={() => setHostingQuizId(quiz.id)}>
                    <Radio className="w-3.5 h-3.5" /> Host
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:bg-red-50" onClick={() => deleteQuiz.mutate(quiz.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Quiz settings editor */}
            <AnimatePresence>
              {editingQuizSettingsId === quiz.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 bg-blue-50/50 p-4"
                >
                  <QuizEditor quiz={quiz} onClose={() => setEditingQuizSettingsId(null)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question editor */}
             <AnimatePresence>
               {editingQuizId === quiz.id && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                   className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3"
                 >
                   <QuizContentParser quizId={quiz.id} onQuestionsGenerated={() => {
                     queryClient.invalidateQueries({ queryKey: ["adminQuizQuestions", quiz.id] });
                     queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
                     queryClient.invalidateQueries({ queryKey: ["quiz", quiz.id] });
                   }} />

                   <div className="flex items-center justify-between">
                     <p className="text-sm font-semibold text-gray-700">Questions ({sortedQuestions.length})</p>
                     <Button size="sm" onClick={() => addQuestion.mutate()} className="bg-violet-100 text-violet-700 hover:bg-violet-200 gap-1 h-8">
                       <Plus className="w-3.5 h-3.5" /> Add Question
                     </Button>
                   </div>

                   {/* Bulk points distributor */}
                   {sortedQuestions.length > 0 && (
                     <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                       <span className="text-xs font-semibold text-yellow-700 shrink-0">Quiz Total Points:</span>
                       <Input
                         type="number"
                         placeholder="e.g. 500"
                         value={totalPoints}
                         onChange={e => setTotalPoints(e.target.value)}
                         className="h-7 text-xs border-yellow-300 bg-white w-24"
                         min="1"
                       />
                       <Button
                         size="sm"
                         onClick={distributePoints}
                         disabled={!totalPoints || parseInt(totalPoints) < 1}
                         className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 shrink-0"
                       >
                         Distribute Evenly
                       </Button>
                       <span className="text-[10px] text-yellow-600 shrink-0">{sortedQuestions.length > 0 && totalPoints ? `= ${Math.floor(parseInt(totalPoints) / sortedQuestions.length)} pts/question` : ""}</span>
                     </div>
                   )}
                   {sortedQuestions.length === 0 ? (
                     <p className="text-center text-sm text-gray-400 py-6">No questions yet — add your first one!</p>
                   ) : sortedQuestions.map((q, i) => (
                     <QuestionEditor key={q.id} question={q} quizId={quiz.id} onDelete={(id) => deleteQuestion.mutate(id)} index={i} />
                   ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {quizzes.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No quizzes yet. Create your first one above!</p>
        )}
      </div>
    </div>
  );
}