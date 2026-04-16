import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Zap, Edit2, Save, X, ChevronDown, ChevronRight, ListChecks, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

const TIER_LABELS = {
  tier_1: { label: "Fresh Start", color: "bg-green-100 text-green-700 border-green-200" },
  tier_2: { label: "Rusty Creator", color: "bg-amber-100 text-amber-700 border-amber-200" },
  tier_3: { label: "Skilled Builder", color: "bg-violet-100 text-violet-700 border-violet-200" },
};

const TIER_OPTIONS = [
  { value: "tier_1", label: "Fresh Start (Tier 1 — Beginner)" },
  { value: "tier_2", label: "Rusty Creator (Tier 2 — Intermediate)" },
  { value: "tier_3", label: "Skilled Builder (Tier 3 — Advanced)" },
];

const PHASE_OPTIONS = ["Phase 1", "Phase 2"];

const MODULE_LABELS = {
  tier_1: {
    1: "Your First Stitch",
    2: "Hand Sewing Essentials",
    3: "Machine Confidence",
    4: "Your First Project",
  },
  tier_2: {
    1: "Refresh & Level Up",
    2: "Pattern Reading",
    3: "Intermediate Projects",
    4: "Finishing Techniques",
  },
  tier_3: {
    1: "Advanced Techniques",
    2: "Your Specialty",
    3: "Business & Scaling",
    4: "Portfolio Building",
  },
};

const MODULE_OUTLINE = {
  tier_1: {
    1: ["Introduction to sewing tools & supplies", "How to set up your workspace", "Threading your needle & tying knots", "Your first straight seam", "Practice stitching on fabric"],
    2: ["Running stitch & backstitch", "Whip stitch & slip stitch", "Hemming by hand", "Sewing on a button", "Basic repairs & mending"],
    3: ["Parts of the sewing machine", "Threading the machine & bobbin", "Tension, stitch length & width", "Sewing straight & curved lines", "Backstitching & finishing seams"],
    4: ["Reading a simple pattern", "Cutting fabric accurately", "Pinning & sewing panels together", "Installing a zipper or envelope back", "Final finishing & pressing"],
  },
  tier_2: {
    1: ["Machine refresher — threading, tension & troubleshooting", "Fabric types & how to choose the right one", "Accurate cutting & measuring", "Seam finishes — serging, zigzag & French seams", "Pressing techniques for a professional look"],
    2: ["Understanding pattern symbols & markings", "Taking body measurements", "Sizing, ease & adjustments", "Cutting & transferring pattern pieces", "Following multi-step pattern instructions"],
    3: ["Tote bag construction", "Zippered pouch or clutch", "Lined project with interfacing", "Adding pockets & straps", "Finishing & hardware installation"],
    4: ["Topstitching & edge stitching", "Bias tape application", "Invisible hems & clean finishes", "Lining a garment or bag", "Pressing & final presentation"],
  },
  tier_3: {
    1: ["Tailoring & couture techniques", "Working with specialty fabrics (knits, leather, chiffon)", "Advanced pattern alterations", "Underlining, interfacing & boning", "Complex zipper & closure types"],
    2: ["Choosing your niche (garments, home decor, sublimation, etc.)", "Advanced project construction", "Fitting & adjusting for your specialty", "Materials & sourcing for your niche", "Signature techniques & finishing details"],
    3: ["Pricing your work & calculating costs", "Setting up your shop (Etsy, Instagram, website)", "Photography & product presentation", "Customer experience & brand building", "Time management & scaling production"],
    4: ["Planning your portfolio project lineup", "Construction of a signature piece", "Documentation & process photography", "Presenting your work professionally", "Building your creative identity online"],
  },
};

const PHASE_DESC = {
  "Phase 1": "Foundations — Beginner basics & machine confidence",
  "Phase 2": "Intermediate — Pattern reading & skill building",
};

const PATH_VIEW_OPTIONS = [
  { value: "3day_replay", label: "3 Day Replay — Beginners START HERE", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "path_1", label: "Path 1 — Fresh Start (Beginner)", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "path_2", label: "Path 2 — Rusty Creator (Intermediate)", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "path_3", label: "Path 3 — Skilled Builder (Advanced)", color: "bg-violet-100 text-violet-700 border-violet-200" },
];

function PathRow({ assessment }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [form, setForm] = useState({
    tier: assessment.tier || "tier_1",
    starting_phase: assessment.starting_phase || "Phase 1",
    starting_module: assessment.starting_module || 1,
    path_view: assessment.path_view || "",
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.PlacementAssessment.update(assessment.id, {
      tier: form.tier,
      starting_phase: form.starting_phase,
      starting_module: Number(form.starting_module),
      path_view: form.path_view,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPaths"] });
      setEditing(false);
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => base44.entities.PlacementAssessment.update(assessment.id, { path_activated: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPaths"] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => base44.entities.PlacementAssessment.update(assessment.id, { path_activated: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPaths"] }),
  });

  const toggleGameMutation = useMutation({
    mutationFn: () => base44.entities.PlacementAssessment.update(assessment.id, {
      launch_game_completed: !assessment.launch_game_completed,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPaths"] }),
  });

  const tier = TIER_LABELS[assessment.tier];
  const moduleLabel = MODULE_LABELS[assessment.tier]?.[assessment.starting_module];
  const pathViewOption = PATH_VIEW_OPTIONS.find(p => p.value === assessment.path_view);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{assessment.user_email}</p>
            {tier && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                {tier.label}
              </span>
            )}
            {assessment.path_activated ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Path Active
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Not Activated
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Submitted {moment(assessment.created_date).fromNow()} · Score: {assessment.experience_score ?? "—"}</p>

          {/* Current path info */}
          {!editing && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {pathViewOption ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${pathViewOption.color}`}>
                    🗺️ {pathViewOption.label}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 font-semibold border border-gray-200">
                    No path assigned
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                  📍 {assessment.starting_phase} — {PHASE_DESC[assessment.starting_phase] || ""}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                  📚 Module {assessment.starting_module}{moduleLabel ? `: ${moduleLabel}` : ""}
                </span>
              </div>
              {/* Full path outline — all 4 modules */}
              <button
                onClick={() => setOutlineOpen(v => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
              >
                <ListChecks className="w-3.5 h-3.5" />
                View full course outline
                {outlineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Launch Game toggle */}
          <button
            onClick={() => toggleGameMutation.mutate()}
            disabled={toggleGameMutation.isPending}
            title={assessment.launch_game_completed ? "Click to reset Launch Game (student will see it again)" : "Click to mark Launch Game as completed (skip it for this student)"}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${
              assessment.launch_game_completed
                ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
            }`}
          >
            <Gamepad2 className="w-3 h-3" />
            {assessment.launch_game_completed ? "Game ✓ Done" : "Game Pending"}
          </button>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Edit path"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {assessment.path_activated ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "..." : "Deactivate"}
            </Button>
          ) : (
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
        </div>
      </div>

      {/* Course outline */}
      {outlineOpen && !editing && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Full Course Outline — {TIER_LABELS[assessment.tier]?.label}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(m => {
              const modLabel = MODULE_LABELS[assessment.tier]?.[m];
              const lessons = MODULE_OUTLINE[assessment.tier]?.[m] || [];
              const isStarting = m === assessment.starting_module;
              return (
                <div key={m} className={`rounded-xl border p-3 ${isStarting ? "border-violet-300 bg-violet-50" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isStarting ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                      {m}
                    </span>
                    <span className={`text-xs font-bold ${isStarting ? "text-violet-700" : "text-gray-700"}`}>
                      {modLabel}
                      {isStarting && <span className="ml-1.5 text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full uppercase">Starting Point</span>}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {lessons.map((l, i) => (
                      <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5">›</span> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Edit Path Assignment</p>

          <div className="space-y-3">
          {/* Path View — what the student sees */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">What path does the student see?</label>
            <div className="grid grid-cols-2 gap-2">
              {PATH_VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, path_view: opt.value })}
                  className={`text-left px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.path_view === opt.value
                      ? `border-current ${opt.color}`
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tier */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Tier</label>
              <select
                value={form.tier}
                onChange={e => setForm({ ...form, tier: e.target.value, starting_module: 1 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                {TIER_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Phase */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Starting Phase</label>
              <select
                value={form.starting_phase}
                onChange={e => setForm({ ...form, starting_phase: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                {PHASE_OPTIONS.map(p => (
                  <option key={p} value={p}>{p} — {PHASE_DESC[p]}</option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Starting Module</label>
              <select
                value={form.starting_module}
                onChange={e => setForm({ ...form, starting_module: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4AF37]"
              >
                {[1, 2, 3, 4].map(m => (
                  <option key={m} value={m}>
                    Module {m}{MODULE_LABELS[form.tier]?.[m] ? ` — ${MODULE_LABELS[form.tier][m]}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="bg-black text-white text-xs h-8 gap-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1"
              onClick={() => {
                setForm({ tier: assessment.tier, starting_phase: assessment.starting_phase, starting_module: assessment.starting_module, path_view: assessment.path_view || "" });
                setEditing(false);
              }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PathsPanel() {
  const [filter, setFilter] = useState("all");

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["adminPaths"],
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
          <h3 className="text-lg font-bold text-gray-900">Student Learning Paths</h3>
          <p className="text-sm text-gray-500">{completed.length} assessments — {pending.length} awaiting path activation</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: `All (${completed.length})` },
            { value: "pending", label: `Pending (${pending.length})` },
            { value: "activated", label: `Active (${activated.length})` },
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

      {/* Legend */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <p className="font-semibold mb-1">📌 How paths work:</p>
        <p>Each student gets a Tier + Phase + Module based on their quiz. You can edit any of these and then click <strong>Activate Path</strong> to unlock the "View My Path" button for that student.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-sm">No assessments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(a => <PathRow key={a.id} assessment={a} />)}
        </div>
      )}
    </div>
  );
}