import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap, CheckCircle, XCircle, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import moment from "moment";

const QUESTIONS = [
  "Your stitches have loops on the BOTTOM of the fabric. What does that mean?",
  "The standard seam allowance for most home sewing patterns is:",
  "Which needle type should you use when sewing knit (stretch) fabric?",
  "What happens when you cut fabric off-grain?",
  "What is the most important habit that separates a good sewist from a great one?",
  "Stitches are looping on the TOP of your fabric. This usually means:",
  "You're making a structured tote bag. Which fabric is the BEST choice?",
  "Which seam finish gives you a completely enclosed seam with no raw edges — no serger needed?",
  "When taking body measurements for a pattern, which tool do you use?",
  "Why do you backstitch at the beginning and end of a seam?",
  "You're sewing a lightweight chiffon blouse. Which thread should you choose?",
  "Why should you NEVER use fabric scissors to cut paper?",
  "You want to gather fabric for a ruffle. Which stitch length setting do you use?",
  "Which direction should you place pins relative to the seam line when machine sewing?",
  "What is the selvage of a fabric?",
  "What is interfacing used for in sewing?",
  "You sewed a curved seam and need to turn it right-side out. What should you do to the seam allowance?",
  "What does 'ease' mean in a sewing pattern?",
  "You're pressing polyester fabric. Which iron setting should you use?",
  "Before you cut into new fabric, what should you ALWAYS do first?",
];

const ANSWERS = [
  ["Your top tension is too loose", "Your top tension is too tight", "Your bobbin is out of thread", "Your needle is the wrong size"],
  ["1/4 inch", "5/8 inch", "1 inch", "1/2 inch"],
  ["Universal needle", "Ballpoint / stretch needle", "Leather needle", "Denim needle"],
  ["The seams press more easily", "The fabric stretches or twists after washing", "You get a stronger seam", "Nothing — grain doesn't matter for home projects"],
  ["Sewing as fast as possible", "Buying expensive tools", "Pressing every seam before sewing the next one", "Always using a serger"],
  ["The bobbin tension is too tight", "The top thread tension is too loose", "Your needle is dull", "The bobbin thread ran out"],
  ["Chiffon — lightweight and flowy", "Canvas or duck cloth — sturdy and heavy", "Silk charmeuse — elegant and smooth", "Jersey knit — stretchy and comfortable"],
  ["Zigzag stitch", "Pinked edges", "French seam", "Flat-felled seam"],
  ["A rigid ruler", "A flexible tape measure", "A yardstick", "A quilting square"],
  ["To make the seam look prettier", "To lock the stitches so they don't unravel", "To increase seam strength throughout", "It's optional — just a personal preference"],
  ["Heavy upholstery thread", "Fine (50wt) cotton or polyester thread", "Elastic thread", "Topstitching thread"],
  ["Paper doesn't cut cleanly with fabric scissors", "Paper dulls the blades quickly, ruining them for fabric", "It's just a sewing myth — scissors are scissors", "Paper is too thick for fabric scissors"],
  ["Shortest stitch length (1.0)", "Standard stitch length (2.5)", "Longest stitch length (4.0–5.0)", "Zigzag stitch"],
  ["Parallel to the seam line", "Perpendicular (at a right angle) to the seam line", "Diagonal at 45 degrees", "It doesn't matter"],
  ["The raw cut edge of the fabric", "The finished woven edge that runs lengthwise on the bolt", "The printed design on the fabric", "A type of seam finish"],
  ["To add stretch to a garment", "To add structure, stiffness, or stability to fabric", "To reduce bulk in seams", "To mark the grain line on pattern pieces"],
  ["Leave it as-is — it will relax on its own", "Clip (cut small notches into) the curved seam allowance", "Press the seam flat without clipping", "Trim the seam to 1/4 inch all the way around"],
  ["How simple the pattern is to sew", "Extra room built into the garment beyond your body measurements", "The stretch percentage of a knit fabric", "The distance between pattern markings"],
  ["High / linen setting", "Low / synthetic setting", "Steam only, no heat", "Cotton setting with lots of steam"],
  ["Wash and dry it (pre-wash)", "Iron it with high heat", "Cut along the selvage edge first", "Apply interfacing to the whole piece"],
];

const CORRECT = [1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,1,1,1,1,0];

function StudentRow({ assessment }) {
  const [open, setOpen] = useState(false);
  const xp = assessment.launch_game_xp || 0;
  const tierLabels = { tier_1: "Fresh Start", tier_2: "Rusty Creator", tier_3: "Skilled Builder" };
  const tierColors = { tier_1: "bg-green-100 text-green-700", tier_2: "bg-amber-100 text-amber-700", tier_3: "bg-violet-100 text-violet-700" };

  // We don't have individual question answers stored in assessment,
  // but we can show the XP earned and completion status.
  const completed = assessment.launch_game_completed;
  const maxXP = 500;
  const pct = Math.round((xp / maxXP) * 100);
  const correctCount = Math.round(xp / 25); // 25 XP per correct answer

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{assessment.user_email}</p>
            {assessment.tier && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[assessment.tier] || "bg-gray-100 text-gray-600"}`}>
                {tierLabels[assessment.tier] || assessment.tier}
              </span>
            )}
            {completed ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Completed</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Not played</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{moment(assessment.updated_date || assessment.created_date).fromNow()}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-extrabold text-amber-600">{xp} XP</span>
            </div>
            {completed && <p className="text-[10px] text-gray-400">{correctCount}/20 correct</p>}
          </div>
          {completed
            ? (open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)
            : null
          }
        </div>
      </button>

      {open && completed && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
          {/* XP bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-amber-600">{xp} / {maxXP} XP ({pct}%)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-extrabold text-green-700">{correctCount}</p>
              <p className="text-[10px] uppercase tracking-wide">Correct</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-extrabold text-red-600">{20 - correctCount}</p>
              <p className="text-[10px] uppercase tracking-wide">Missed</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic">Individual question answers are not stored — only total XP earned is recorded per student.</p>
        </div>
      )}
    </div>
  );
}

export default function LaunchGameResultsPanel() {
  const [search, setSearch] = useState("");

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["allAssessmentsForGame"],
    queryFn: () => base44.entities.PlacementAssessment.list("-updated_date", 200),
  });

  const played = assessments.filter(a => a.launch_game_completed);
  const notPlayed = assessments.filter(a => !a.launch_game_completed);
  const totalXP = played.reduce((sum, a) => sum + (a.launch_game_xp || 0), 0);
  const avgXP = played.length ? Math.round(totalXP / played.length) : 0;
  const avgCorrect = played.length ? Math.round(avgXP / 25) : 0;

  const filtered = assessments.filter(a =>
    !search || a.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Played Game", value: played.length, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Not Played", value: notPlayed.length, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
          { label: "Avg XP Earned", value: `${avgXP} XP`, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Avg Correct", value: `${avgCorrect}/20`, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 border-gray-200"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No results found.</div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(a => <StudentRow key={a.id} assessment={a} />)}
        </div>
      )}
    </div>
  );
}