import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COURSE_DATA = [
  {
    title: "Path 1: Absolute Beginner (Zero to Hero)",
    description: "Master the fundamentals and sew your first projects with confidence",
    category: "beginner_sewing",
    difficulty: "beginner",
    level: 1,
    tier: "tier_1",
    xp_reward: 300,
    modules: [
      {
        title: "Meet Your Machine",
        order: 1,
        lessons: [
          { title: "The Anatomy of Your Machine", order: 1 },
          { title: "Threading & Winding a Bobbin", order: 2 },
          { title: "Needle & Thread 101", order: 3 },
          { title: "The 'Paper Practice' (Stitching without thread)", order: 4 }
        ]
      },
      {
        title: "The First Stitches",
        order: 2,
        lessons: [
          { title: "Your First Real Seam (Start, Backstitch, Stop)", order: 1 },
          { title: "Controlling Your Speed & Foot Pedal", order: 2 },
          { title: "Understanding Seam Allowance (5/8\" vs 1/4\")", order: 3 },
          { title: "The Seam Ripper: Fixing mistakes", order: 4 }
        ]
      },
      {
        title: "Fabric & Prep",
        order: 3,
        lessons: [
          { title: "Fabric Basics: Grainlines & Selvage", order: 1 },
          { title: "Essential Tool Kit (The Must-Haves)", order: 2 },
          { title: "Safe Cutting: Shears vs. Rotary", order: 3 },
          { title: "Pressing vs. Ironing Techniques", order: 4 }
        ]
      },
      {
        title: "Your First Small Win",
        order: 4,
        lessons: [
          { title: "Project: Envelope Pillowcase", order: 1 },
          { title: "Project: Basic Drawstring Bag", order: 2 },
          { title: "Finishing Raw Edges (ZigZag Method)", order: 3 },
          { title: "Quality Check & Troubleshooting", order: 4 }
        ]
      }
    ]
  },
  {
    title: "Path 2: Rusty Creator",
    description: "Refresh your skills and tackle intermediate projects with confidence",
    category: "intermediate_sewing",
    difficulty: "intermediate",
    level: 2,
    tier: "tier_2",
    xp_reward: 400,
    modules: [
      {
        title: "Refresh & Level Up",
        order: 1,
        lessons: [
          { title: "Machine Refresher: Troubleshooting Tension", order: 1 },
          { title: "Fabric Types: Choosing the right weight", order: 2 },
          { title: "Accurate Cutting & Measuring", order: 3 },
          { title: "Seam Finishes: Serging, Zigzag & French Seams", order: 4 },
          { title: "Pressing for a Professional Look", order: 5 }
        ]
      },
      {
        title: "Pattern Reading",
        order: 2,
        lessons: [
          { title: "Understanding Symbols & Markings", order: 1 },
          { title: "Taking Accurate Body Measurements", order: 2 },
          { title: "Sizing, Ease & Adjustments", order: 3 },
          { title: "Cutting & Transferring Pattern Pieces", order: 4 },
          { title: "Following Multi-Step Instructions", order: 5 }
        ]
      },
      {
        title: "Intermediate Projects",
        order: 3,
        lessons: [
          { title: "Tote Bag Construction", order: 1 },
          { title: "Zippered Pouch or Clutch", order: 2 },
          { title: "Lined Project with Interfacing", order: 3 },
          { title: "Adding Pockets & Straps", order: 4 },
          { title: "Finishing & Hardware Installation", order: 5 }
        ]
      },
      {
        title: "Finishing Techniques",
        order: 4,
        lessons: [
          { title: "Topstitching & Edge Stitching", order: 1 },
          { title: "Bias Tape Application", order: 2 },
          { title: "Invisible Hems & Clean Finishes", order: 3 },
          { title: "Lining a Garment or Bag", order: 4 },
          { title: "Final Presentation & Pressing", order: 5 }
        ]
      }
    ]
  },
  {
    title: "Path 3: Skilled Builder",
    description: "Master advanced techniques and build your sewing business",
    category: "advanced_sewing",
    difficulty: "advanced",
    level: 3,
    tier: "tier_3",
    xp_reward: 500,
    modules: [
      {
        title: "Advanced Techniques",
        order: 1,
        lessons: [
          { title: "Tailoring & Couture Techniques", order: 1 },
          { title: "Working with Specialty Fabrics (Leather, Silk, Knits)", order: 2 },
          { title: "Advanced Pattern Alterations", order: 3 },
          { title: "Underlining, Interfacing & Boning", order: 4 },
          { title: "Complex Zipper & Closure Types", order: 5 }
        ]
      },
      {
        title: "Your Specialty",
        order: 2,
        lessons: [
          { title: "Choosing Your Niche (Garments vs. Decor)", order: 1 },
          { title: "Advanced Project Construction", order: 2 },
          { title: "Fitting & Adjusting for Your Specialty", order: 3 },
          { title: "Materials Sourcing for Your Niche", order: 4 },
          { title: "Signature Techniques & Finishing", order: 5 }
        ]
      },
      {
        title: "Business & Scaling",
        order: 3,
        lessons: [
          { title: "Pricing Your Work & Calculating Costs", order: 1 },
          { title: "Setting up Your Shop (Etsy/Web)", order: 2 },
          { title: "Photography & Product Presentation", order: 3 },
          { title: "Customer Experience & Brand Building", order: 4 },
          { title: "Time Management & Scaling Production", order: 5 }
        ]
      }
    ]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    let courseCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;

    for (const courseData of COURSE_DATA) {
      const { modules, ...courseInfo } = courseData;
      
      const course = await base44.asServiceRole.entities.Course.create({
        title: courseInfo.title,
        description: courseInfo.description,
        category: courseInfo.category,
        difficulty: courseInfo.difficulty,
        level: courseInfo.level,
        xp_reward: courseInfo.xp_reward,
        is_published: true,
        lesson_count: modules.reduce((sum, m) => sum + m.lessons.length, 0)
      });
      courseCount++;

      for (const moduleData of modules) {
        const { lessons, ...moduleInfo } = moduleData;
        
        const module = await base44.asServiceRole.entities.Module.create({
          title: moduleInfo.title,
          course_id: course.id,
          order: moduleInfo.order,
          description: `Module ${moduleInfo.order}: ${moduleInfo.title}`
        });
        moduleCount++;

        for (const lessonData of lessons) {
          await base44.asServiceRole.entities.Lesson.create({
            title: lessonData.title,
            course_id: course.id,
            module_id: module.id,
            order: lessonData.order,
            description: lessonData.title,
            xp_reward: 20,
            duration_minutes: 15
          });
          lessonCount++;
        }
      }
    }

    return Response.json({
      success: true,
      summary: {
        courses: courseCount,
        modules: moduleCount,
        lessons: lessonCount,
        message: `Initialized 3-path course structure: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons`
      }
    });
  } catch (error) {
    console.error("[initializeCourseStructure] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});