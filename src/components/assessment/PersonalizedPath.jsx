import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronRight, ChevronDown, Zap, BookMarked, Lock, CheckCircle, Download, ListChecks } from "lucide-react";
import ProjectGuides from "./ProjectGuides";

const TIER_PDF = {
  tier_1: "https://media.base44.com/files/public/69ad18c269d65fade54e850d/c77754d83_OSS_Checklist_Tier1_FreshStart.pdf",
  tier_2: "https://media.base44.com/files/public/69ad18c269d65fade54e850d/a722bf7b8_OSS_Checklist_Tier2_RustyCreator.pdf",
  tier_3: "https://media.base44.com/files/public/69ad18c269d65fade54e850d/d49331d5a_OSS_Checklist_Tier3_SkilledBuilder.pdf",
};

const TIER_CONFIG = {
  tier_1: {
    label: "Fresh Start",
    description: "Perfect for beginners with little or no sewing experience",
    color: "from-green-500 to-emerald-600",
    courses: [
      {
        order: 1, title: "Your First Stitch", description: "Master the basics and thread your first seam",
        modules: [
          "Introduction to sewing tools & supplies",
          "How to set up your workspace",
          "Threading your needle & tying knots",
          "Your first straight seam",
          "Practice stitching on fabric",
        ]
      },
      {
        order: 2, title: "Hand Sewing Essentials", description: "Build foundational hand-sewing skills",
        modules: [
          "Running stitch & backstitch",
          "Whip stitch & slip stitch",
          "Hemming by hand",
          "Sewing on a button",
          "Basic repairs & mending",
        ]
      },
      {
        order: 3, title: "Machine Confidence", description: "Get comfortable with the sewing machine",
        modules: [
          "Parts of the sewing machine",
          "Threading the machine & bobbin",
          "Tension, stitch length & width",
          "Sewing straight & curved lines",
          "Backstitching & finishing seams",
        ]
      },
      {
        order: 4, title: "Your First Project", description: "Complete a simple pillow cover",
        modules: [
          "Reading a simple pattern",
          "Cutting fabric accurately",
          "Pinning & sewing panels together",
          "Installing a zipper or envelope back",
          "Final finishing & pressing",
        ]
      },
    ]
  },
  tier_2: {
    label: "Rusty Creator",
    description: "You've sewn before but need a refresher and want to build new skills",
    color: "from-amber-500 to-orange-600",
    courses: [
      {
        order: 1, title: "Refresh & Level Up", description: "Shake off the rust and build confidence",
        modules: [
          "Machine refresher — threading, tension & troubleshooting",
          "Fabric types & how to choose the right one",
          "Accurate cutting & measuring",
          "Seam finishes — serging, zigzag & French seams",
          "Pressing techniques for a professional look",
        ]
      },
      {
        order: 2, title: "Pattern Reading", description: "Learn to read and follow patterns",
        modules: [
          "Understanding pattern symbols & markings",
          "Taking body measurements",
          "Sizing, ease & adjustments",
          "Cutting & transferring pattern pieces",
          "Following multi-step pattern instructions",
        ]
      },
      {
        order: 3, title: "Intermediate Projects", description: "Build skills with more complex projects",
        modules: [
          "Tote bag construction",
          "Zippered pouch or clutch",
          "Lined project with interfacing",
          "Adding pockets & straps",
          "Finishing & hardware installation",
        ]
      },
      {
        order: 4, title: "Finishing Techniques", description: "Master professional finishes",
        modules: [
          "Topstitching & edge stitching",
          "Bias tape application",
          "Invisible hems & clean finishes",
          "Lining a garment or bag",
          "Pressing & final presentation",
        ]
      },
    ]
  },
  tier_3: {
    label: "Skilled Builder",
    description: "You're ready to tackle advanced projects and expand your repertoire",
    color: "from-purple-500 to-indigo-600",
    courses: [
      {
        order: 1, title: "Advanced Techniques", description: "Master complex sewing methods",
        modules: [
          "Tailoring & couture techniques",
          "Working with specialty fabrics (knits, leather, chiffon)",
          "Advanced pattern alterations",
          "Underlining, interfacing & boning",
          "Complex zipper & closure types",
        ]
      },
      {
        order: 2, title: "Your Specialty", description: "Deep dive into your chosen focus",
        modules: [
          "Choosing your niche (garments, home decor, sublimation, etc.)",
          "Advanced project construction",
          "Fitting & adjusting for your specialty",
          "Materials & sourcing for your niche",
          "Signature techniques & finishing details",
        ]
      },
      {
        order: 3, title: "Business & Scaling", description: "Turn your passion into a business",
        modules: [
          "Pricing your work & calculating costs",
          "Setting up your shop (Etsy, Instagram, website)",
          "Photography & product presentation",
          "Customer experience & brand building",
          "Time management & scaling production",
        ]
      },
      {
        order: 4, title: "Portfolio Building", description: "Create showcase pieces",
        modules: [
          "Planning your portfolio project lineup",
          "Construction of a signature piece",
          "Documentation & process photography",
          "Presenting your work professionally",
          "Building your creative identity online",
        ]
      },
    ]
  }
};

function CoursePathCard({ item, idx, isLocked }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${
      isLocked ? "border-[#EEEEEE] opacity-60" : "border-[#EEEEEE] hover:shadow-md hover:border-[#6B3FA0]/30"
    }`}>
      {/* Main row */}
      <div className="p-4 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shrink-0 text-xs ${
          item.isCompleted ? "bg-[#D4AF37]" : isLocked ? "bg-[#CFCFCF]" : "bg-[#6B3FA0]"
        }`}>
          {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <span>{idx + 1}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${isLocked ? "text-[#AAAAAA]" : "text-[#111]"}`}>{item.title}</h4>
          <p className={`text-xs mt-0.5 ${isLocked ? "text-[#BBBBBB]" : "text-[#666]"}`}>{item.description}</p>
          {/* Module count */}
          {item.modules?.length > 0 && (
            <button
              onClick={() => !isLocked && setOpen(v => !v)}
              className={`mt-2 flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                isLocked ? "text-[#BBBBBB] cursor-default" : "text-[#6B3FA0] hover:text-[#5A3490]"
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {item.modules.length} lessons
              {!isLocked && (open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.isCompleted && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/15 text-[#B8960C] uppercase">
              ✓ Complete
            </span>
          )}
          {idx === 0 && !item.isCompleted && !isLocked && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] uppercase">
              Start Here
            </span>
          )}
          {isLocked && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 uppercase flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
          {item.isUnlocked && !isLocked && item.course && (
            <Link to={`${createPageUrl("CourseDetail")}?id=${item.course.id}`}>
              <ChevronRight className="w-4 h-4 text-[#6B3FA0]" />
            </Link>
          )}
        </div>
      </div>

      {/* Expanded module list */}
      {open && item.modules?.length > 0 && (
        <div className="border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3 space-y-2">
          {item.modules.map((mod, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs text-[#444] leading-snug">{mod}</span>
            </div>
          ))}
          {item.course && (
            <Link to={`${createPageUrl("CourseDetail")}?id=${item.course.id}`}>
              <button className="mt-2 w-full bg-[#6B3FA0] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#5A3490] transition-colors">
                Go to Course →
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function PersonalizedPath({ tier, assessment }) {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["tierEnrollments", user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.list("-created_date", 100),
  });

  const config = TIER_CONFIG[tier];
  if (!config) return null;

  // Get courses matching this tier's titles
  const tierCourses = config.courses.map(courseConfig => {
    const course = courses.find(c => c.title?.toLowerCase().includes(courseConfig.title.toLowerCase()));
    const enrollment = course ? enrollments.find(e => e.course_id === course.id) : null;
    return { ...courseConfig, course, enrollment, isCompleted: enrollment?.is_completed };
  });

  // Determine which courses are unlocked
  const unlockedCourses = tierCourses.map((item, idx) => ({
    ...item,
    isUnlocked: idx === 0 || (tierCourses[idx - 1] && tierCourses[idx - 1].isCompleted),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Tier header */}
      <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-8 text-white`}>
        <h1 className="text-3xl font-extrabold mb-2">{config.label}</h1>
        <p className="text-white/90">{config.description}</p>
      </div>

      {/* Your recommended starting point */}
      {assessment && (() => {
        // Find the specific starting course based on module number
        const startIdx = (assessment.starting_module || 1) - 1;
        const startItem = unlockedCourses[startIdx];
        const startUrl = startItem?.course
          ? `${createPageUrl("CourseDetail")}?id=${startItem.course.id}`
          : null;
        return (
          <div className="bg-white border-2 border-[#D4AF37] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Your Starting Point</p>
                <h2 className="text-xl font-extrabold text-[#111]">
                  {assessment.starting_phase} — Module {assessment.starting_module}
                </h2>
                {startItem && (
                  <p className="text-sm font-semibold text-[#6B3FA0] mt-0.5">{startItem.title}</p>
                )}
                <p className="text-sm text-[#666] mt-1">This is where your personalized journey begins</p>
              </div>
              {startUrl ? (
                <Link to={startUrl} className="shrink-0">
                  <button className="bg-[#D4AF37] text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0D060] transition-colors shadow-md shadow-[#D4AF37]/20 flex items-center gap-2">
                    Start Here <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <Link to={createPageUrl("Library")} className="shrink-0">
                  <button className="bg-[#D4AF37] text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0D060] transition-colors shadow-md shadow-[#D4AF37]/20 flex items-center gap-2">
                    Start Learning <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        );
      })()}

      {/* Learning path roadmap */}
      <div>
        <h3 className="text-lg font-extrabold text-[#111] mb-4">Your Learning Path</h3>
        <div className="space-y-3">
          {unlockedCourses.map((item, idx) => {
            const isLocked = !item.isUnlocked;
            return (
              <CoursePathCard key={idx} item={item} idx={idx} isLocked={isLocked} />
            );
          })}
        </div>
      </div>

      {/* Projects section */}
      <ProjectGuides tier={tier} />

      {/* Starter checklist PDF download */}
      {TIER_PDF[tier] && (
        <a
          href={TIER_PDF[tier]}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-4 bg-white border-2 border-[#6B3FA0]/20 hover:border-[#6B3FA0] rounded-2xl p-5 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#6B3FA0]/10 flex items-center justify-center shrink-0 group-hover:bg-[#6B3FA0]/20 transition-colors">
            <Download className="w-6 h-6 text-[#6B3FA0]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#111] text-sm">Your {config.label} Starter Checklist</p>
            <p className="text-xs text-[#666] mt-0.5">Download your personalized supply list, projects & 30-day action plan</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6B3FA0] shrink-0" />
        </a>
      )}

      {/* Recommended resources */}
      <div className="bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50 rounded-2xl p-6 border border-[#6B3FA0]/10">
        <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-[#6B3FA0]" />
          Resources Available in Your Library
        </h3>
        <ul className="space-y-2 text-sm text-[#666]">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Class replays from all instructional sessions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Step-by-step tutorials matching your level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1">✓</span>
            <span>Downloadable supply lists and project guides</span>
          </li>
        </ul>
      </div>

      {/* Action button */}
      {(() => {
        const startIdx = assessment ? (assessment.starting_module || 1) - 1 : 0;
        const startItem = unlockedCourses[startIdx];
        const startUrl = startItem?.course
          ? `${createPageUrl("CourseDetail")}?id=${startItem.course.id}`
          : createPageUrl("Library");
        return (
          <Link to={startUrl}>
            <button className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl hover:bg-[#F0D060] transition-colors shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              {startItem?.course ? `Go to ${startItem.title}` : "Explore Your Learning Path"}
            </button>
          </Link>
        );
      })()}
    </div>
  );
}