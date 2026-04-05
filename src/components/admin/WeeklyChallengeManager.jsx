import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Brain, Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";

function QuestionEditor({ question, index, onDelete, onSave }) {
  const [open, setOpen] = useState(!question.id);
  const [form, setForm] = useState({
    question: question.question || "",
    options: question.options?.length ? question.options : ["", "", "", ""],
    correct_answer: question.correct_answer || "",
    explanation: question.explanation || "",
    order: question.order ?? index,
  });
  const [saving, setSaving] = useState(false);

  const handleOptionChange = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    setForm(f => ({ ...f, options: opts }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(question.id, form);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold text-gray-800">
          Q{index + 1}. {form.question || <span className="text-gray-400 italic">New question</span>}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}
            className="text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Question</label>
            <Textarea
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="Enter your question..."
              className="border-gray-200 text-gray-900"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Answer Options</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{String.fromCharCode(65 + i)})</span>
                  <Input
                    value={opt}
                    onChange={e => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="border-gray-200 text-gray-900"
                  />
                  <button
                    onClick={() => setForm(f => ({ ...f, correct_answer: opt }))}
                    className={`text-xs px-2 py-1 rounded-md border font-semibold shrink-0 ${
                      form.correct_answer === opt && opt
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-gray-50 text-gray-400 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                    title="Mark as correct"
                    type="button"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
            {form.correct_answer && (
              <p className="text-xs text-emerald-600 mt-1">✓ Correct answer: <strong>{form.correct_answer}</strong></p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Explanation (optional)</label>
            <Input
              value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
              placeholder="Brief explanation shown after answering..."
              className="border-gray-200 text-gray-900"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!form.question || !form.correct_answer || saving}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white"
            size="sm"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? "Saving..." : "Save Question"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function WeeklyChallengeManager() {
  const queryClient = useQueryClient();
  const [newQ, setNewQ] = useState(null);

  const { data: settingsList = [] } = useQuery({
    queryKey: ["weeklyChallengeSettings"],
    queryFn: () => base44.entities.WeeklyChallengeSettings.list(),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["weeklyChallengeQuestions"],
    queryFn: () => base44.entities.WeeklyChallengeQuestion.list("order", 50),
  });

  const settings = settingsList[0];

  const saveSetting = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.WeeklyChallengeSettings.update(settings.id, data);
      } else {
        return base44.entities.WeeklyChallengeSettings.create(data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weeklyChallengeSettings"] }),
  });

  const saveQuestion = async (id, data) => {
    if (id) {
      await base44.entities.WeeklyChallengeQuestion.update(id, data);
    } else {
      await base44.entities.WeeklyChallengeQuestion.create(data);
      setNewQ(null);
    }
    queryClient.invalidateQueries({ queryKey: ["weeklyChallengeQuestions"] });
  };

  const deleteQuestion = useMutation({
    mutationFn: (id) => base44.entities.WeeklyChallengeQuestion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weeklyChallengeQuestions"] }),
  });

  const handleToggle = (val) => {
    saveSetting.mutate({ ...settings, is_enabled: val });
  };

  return (
    <div className="space-y-5">
      {/* Settings card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-fuchsia-600 font-semibold">
          <Brain className="w-5 h-5" /> Weekly Challenge Settings
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Enable Weekly Challenge</p>
            <p className="text-xs text-gray-400">When off, students will see a "coming soon" message</p>
          </div>
          <Switch
            checked={settings?.is_enabled ?? true}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Week Label</label>
          <div className="flex gap-2">
            <Input
              defaultValue={settings?.week_label || ""}
              placeholder='e.g. "March Week 2"'
              className="border-gray-200 text-gray-900"
              id="weekLabel"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const val = document.getElementById("weekLabel").value;
                saveSetting.mutate({ ...(settings || {}), week_label: val });
              }}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Intro Description (optional)</label>
          <div className="flex gap-2 items-start">
            <Textarea
              defaultValue={settings?.description || ""}
              placeholder="Describe this week's challenge theme..."
              className="border-gray-200 text-gray-900"
              rows={2}
              id="weekDesc"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                const val = document.getElementById("weekDesc").value;
                saveSetting.mutate({ ...(settings || {}), description: val });
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800">Questions ({questions.length})</p>
          <Button
            size="sm"
            onClick={() => setNewQ({ id: null, question: "", options: ["", "", "", ""], correct_answer: "", explanation: "", order: questions.length })}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>

        {questions.length === 0 && !newQ && (
          <p className="text-sm text-gray-400 text-center py-6">No questions yet. Add your first question above!</p>
        )}

        <div className="space-y-2">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              onDelete={(id) => deleteQuestion.mutate(id)}
              onSave={saveQuestion}
            />
          ))}

          {newQ && (
            <QuestionEditor
              question={newQ}
              index={questions.length}
              onDelete={() => setNewQ(null)}
              onSave={saveQuestion}
            />
          )}
        </div>
      </div>
    </div>
  );
}