import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const TIER_LABELS = {
  tier_1: { label: "Fresh Start", color: "bg-green-100 text-green-700" },
  tier_2: { label: "Rusty Creator", color: "bg-amber-100 text-amber-700" },
  tier_3: { label: "Skilled Builder", color: "bg-violet-100 text-violet-700" },
};

const PHASE_INFO = {
  "Phase 1": { label: "Phase 1 — Foundations", desc: "Beginner basics & machine confidence", color: "bg-blue-50 text-blue-700" },
  "Phase 2": { label: "Phase 2 — Intermediate", desc: "Pattern reading & skill building", color: "bg-orange-50 text-orange-700" },
};

const MODULE_LABELS = {
  tier_1: {
    1: "Your First Stitch — Master the basics, thread your first seam",
    2: "Hand Sewing Essentials — Foundational hand-sewing skills",
    3: "Machine Confidence — Get comfortable with the sewing machine",
    4: "Your First Project — Complete a simple pillow cover",
  },
  tier_2: {
    1: "Refresh & Level Up — Shake off the rust, build confidence",
    2: "Pattern Reading — Learn to read and follow patterns",
    3: "Intermediate Projects — Build skills with more complex projects",
    4: "Finishing Techniques — Master professional finishes",
  },
  tier_3: {
    1: "Advanced Techniques — Master complex sewing methods",
    2: "Your Specialty — Deep dive into garments, sublimation, etc.",
    3: "Business & Scaling — Turn your passion into a business",
    4: "Portfolio Building — Create showcase pieces",
  },
};

const GOAL_LABELS = {
  learn_skill: "Learn a new skill",
  personal: "For myself & family",
  business: "Sell what I make",
  mixed: "All of the above",
};

const QUESTIONS = [
  "Have you ever used a sewing machine?",
  "Can you thread a sewing machine without help right now?",
  "Have you ever finished a complete sewing project?",
  "Do you know what seam allowance is and how to use it?",
  "Have you ever worked with a sewing pattern?",
  "Why are you joining Oh Sew Sheek Academy?",
  "What do you most want to create?",
  "How much time can you commit each week?",
  "Have you tried to learn sewing before and stopped?",
  "How do you feel right now about sitting at a sewing machine?",
];

const ANSWERS = [
  ["Never", "Once or twice", "Yes regularly", "Yes and I teach others"],
  ["No", "I think so but not sure", "Yes confidently", "N/A"],
  ["Never", "I started one but didn't finish", "Yes one or two", "Yes multiple"],
  ["No idea", "I've heard of it", "Yes I understand it", "I use it automatically"],
  ["Never", "Tried once, got confused", "Yes a few times", "Yes comfortably"],
  ["I want to learn a new skill", "I want to make things for myself and family", "I want to sell what I make", "All of the above"],
  ["Clothes and garments", "Bags and accessories", "Sublimation products", "Home decor", "A mix of everything"],
  ["1 to 2 hours", "3 to 5 hours", "6 or more hours"],
  ["No this is my first time", "Yes I tried YouTube and got lost", "Yes I tried another course and quit", "Yes multiple times"],
  ["Terrified", "A little nervous", "Neutral", "Ready let's go"],
];

function AssessmentRow({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: () => base44.entities.PlacementAssessment.update(assessment.id, { path_activated: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminAssessments"] }),
  });

  const tier = TIER_LABELS[assessment.tier];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{assessment.user_email}</p>
            {tier && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.color}`}>
                {tier.label}
              </span>
            )}
            {assessment.path_activated ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Path Activated
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {moment(assessment.created_date).fromNow()} · Score: {assessment.experience_score ?? "—"}
          </p>
          {/* Phase + Module breakdown */}
          {assessment.starting_phase && (
            <div className="mt-2 space-y-1">
              {(() => {
                const phaseInfo = PHASE_INFO[assessment.starting_phase];
                const moduleLabel = MODULE_LABELS[assessment.tier]?.[assessment.starting_module];
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      {phaseInfo && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${phaseInfo.color}`}>
                          📍 {phaseInfo.label} — {phaseInfo.desc}
                        </span>
                      )}
                    </div>
                    {moduleLabel && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                          📚 Module {assessment.starting_module}: {moduleLabel}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!assessment.path_activated && (
            <Button
              size="sm"
              className="bg-[#D4AF37] hover:bg-[#F0D060] text-black font-bold text-xs h-8 gap-1"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              <Zap className="w-3.5 h-3.5" />
              {activateMutation.isPending ? "Activating..." : "Activate Path"}
            </Button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded answers */}
      {expanded && assessment.answers && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50">
          {QUESTIONS.map((question, qIndex) => {
            const qNum = qIndex + 1;
            // answers is an array of {question_id, answer_index} objects
            const answerObj = Array.isArray(assessment.answers)
              ? assessment.answers.find(a => a.question_id === qNum)
              : null;
            const ansIdx = Array.isArray(assessment.answers)
              ? answerObj?.answer_index
              : assessment.answers[qNum];
            if (ansIdx === undefined || ansIdx === null) return null;
            const answerText = ANSWERS[qIndex]?.[ansIdx];
            return (
              <div key={qNum}>
                <p className="text-xs font-semibold text-gray-600">Q{qNum}: {question}</p>
                <p className="text-sm text-gray-900 mt-0.5 font-medium">→ {answerText ?? `(index ${ansIdx})`}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AssessmentsPanel() {
  const [filter, setFilter] = useState("all");

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["adminAssessments"],
    queryFn: () => base44.entities.PlacementAssessment.list("-created_date", 200),
  });

  const completed = assessments.filter(a => a.completed);
  const pending = completed.filter(a => !a.path_activated);
  const activated = completed.filter(a => a.path_activated);

  const displayed = filter === "pending" ? pending : filter === "activated" ? activated : completed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Placement Assessments</h3>
          <p className="text-sm text-gray-500">{completed.length} submissions — {pending.length} pending review</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: `All (${completed.length})` },
            { value: "pending", label: `Pending (${pending.length})` },
            { value: "activated", label: `Activated (${activated.length})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-sm">No assessments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(a => <AssessmentRow key={a.id} assessment={a} />)}
        </div>
      )}
    </div>
  );
}