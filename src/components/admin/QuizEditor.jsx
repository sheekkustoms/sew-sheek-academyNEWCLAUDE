import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { value: "beginner_sewing", label: "🪡 Beginner Sewing" },
  { value: "fabric_knowledge", label: "🧶 Fabric Knowledge" },
  { value: "machine_troubleshooting", label: "🔧 Machine Troubleshooting" },
  { value: "sewing_business", label: "💰 Sewing Business" },
  { value: "pattern_knowledge", label: "📐 Pattern Knowledge" },
];

export default function QuizEditor({ quiz, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(quiz);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const save = async () => {
    setSaving(true);
    await base44.entities.Quiz.update(quiz.id, {
      title: form.title,
      description: form.description,
      category: form.category,
      time_per_question: form.time_per_question,
      quiz_type: form.quiz_type,
    });
    queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
    setSaving(false);
    setExpanded(false);
    onClose();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-blue-50" onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-semibold text-blue-700">✏️ EDIT QUIZ</span>
        <span className="flex-1 text-sm font-medium text-gray-800">{quiz.title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Quiz Title</label>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="border-gray-200 bg-white text-gray-900"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
            <Textarea
              value={form.description || ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="border-gray-200 bg-white text-gray-900 min-h-[70px]"
              placeholder="Enter quiz description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Category</label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="border-gray-200 bg-white h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Quiz Type</label>
              <Select value={form.quiz_type} onValueChange={v => setForm({ ...form, quiz_type: v })}>
                <SelectTrigger className="border-gray-200 bg-white h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice Quiz</SelectItem>
                  <SelectItem value="live">Live Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Time Per Question (seconds)</label>
              <Input
                type="number"
                value={form.time_per_question}
                onChange={e => setForm({ ...form, time_per_question: +e.target.value })}
                className="border-gray-200 bg-white h-9 text-gray-900"
                min="5"
                max="300"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white gap-1 flex-1"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setExpanded(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}