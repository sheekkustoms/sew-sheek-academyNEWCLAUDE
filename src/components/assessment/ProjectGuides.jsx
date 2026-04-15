import React, { useState } from "react";
import { ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

const TIER_PROJECTS = {
  tier_1: [
    {
      title: "Project 1: Straight Line Bookmark",
      subtitle: "Your very first project — small, fast, and packed with the skills you need forever",
      difficulty: "Beginner",
      time: "30–45 minutes",
      quote: "This project saved more beginners than I can count. It sounds too simple — that is the point. You are not making a quilt on Day 1. You are building the one skill that every single project you ever make will depend on. Master the straight line. Everything else is built on top of it.",
      skills: [
        "Sewing a straight line with control",
        "Backstitching to lock your seams",
        "Cutting fabric accurately to size",
        "Pressing fabric before sewing",
        "Trimming threads cleanly",
      ],
      overview: "Two small rectangles of fabric, sewn together, turned right-side out, and pressed flat. Inside that simple project you will practice cutting accurately, sewing a straight seam, backstitching, trimming corners, turning a tube, and pressing. Every skill shows up in every project you will ever make.",
      steps: [
        {
          number: 1,
          title: "Cut Your Fabric",
          instructions: "Mark two rectangles: each 3 inches wide by 9 inches tall. Cut carefully. Both pieces should be exactly the same size — trim the larger one if needed.",
          proTip: "Cut on a flat surface. Use long smooth scissor strokes, not short choppy snips.",
          watchOut: "Do not skip the ruler. Cutting by eye gives you wobbly edges that are hard to sew straight.",
        },
        {
          number: 2,
          title: "Press Your Fabric",
          instructions: "Before sewing a single stitch — press both pieces flat with your iron. Remove all wrinkles. This takes 60 seconds and makes a real difference.",
          proTip: "Press means lift and place the iron. Do not drag it back and forth — that can stretch your fabric.",
        },
        {
          number: 3,
          title: "Pin Pieces Together",
          instructions: "Place pieces RIGHT sides facing each other. Add optional ribbon loop now (fold in half, tuck between layers at one end). Pin all four corners and once in the middle of each long side.",
          proTip: "Pins should go perpendicular (across) the seam line, not parallel to it.",
          watchOut: "If your right sides are on the outside while you sew, your bookmark will be inside-out when you turn it.",
        },
        {
          number: 4,
          title: "Sew Around the Edges",
          instructions: "Straight stitch, length 2.5. Start 1 inch from the top corner. Backstitch 3–4 stitches to lock, then sew forward with 1/4 inch seam allowance. Sew down the long side, pivot at corners. STOP about 2 inches before where you started — leave an opening for turning. Backstitch at the end.",
          proTip: "Keep your eyes on the needle plate guide line, not on the needle itself.",
          watchOut: "Do not sew all the way around or you will not be able to turn it right-side out.",
        },
        {
          number: 5,
          title: "Trim Corners and Turn",
          instructions: "Trim the corners diagonally — close to the stitch but not through it. Turn right-side out through the opening. Use a point turner to push out corners fully.",
          proTip: "Take your time with the corners. Push them out fully before pressing.",
          watchOut: "Do not clip so close that you cut your stitches.",
        },
        {
          number: 6,
          title: "Press and Close",
          instructions: "Press completely flat. Tuck in raw edges at the opening, folding inward. Pin the opening closed. Topstitch all the way around 1/8 inch from the edge. Backstitch at start and end.",
          proTip: "Press the opening flat before topstitching — it will close much more cleanly.",
        },
      ],
      troubleshooting: [
        { problem: "Corners are lumpy and won't lay flat", fix: "Trim more fabric from the corners before turning. Make sure you pressed well after turning." },
        { problem: "Seam is wavy, not straight", fix: "Slow down. Keep your eyes on the guide line on the needle plate, not on the needle." },
        { problem: "Bookmark is inside-out", fix: "You forgot right sides together before sewing. Rip the seams and start again — it happens to everyone." },
        { problem: "Opening won't close neatly", fix: "Press it flat with your iron before topstitching. The iron does half the work." },
        { problem: "Thread is breaking while sewing", fix: "Re-thread your machine completely. Check that your presser foot is down before you start." },
      ],
    },
    {
      title: "Project 2: Simple Flat Tote Bag",
      subtitle: "Your first functional project — something you will actually use every single day",
      difficulty: "Beginner",
      time: "2–3 hours",
      quote: "Every time someone asks where you got your bag and you say 'I made it' — that is a feeling you cannot buy. Make this bag in your absolute favorite fabric. Use it everywhere. Let it be the thing that shows people what you are capable of.",
      skills: [
        "Cutting fabric to size from measurements",
        "Sewing longer seams with consistency",
        "Attaching fabric handles",
        "Finishing raw edges with zigzag stitch",
        "Pressing seams open and flat",
        "Backstitching for strength at stress points",
      ],
      overview: "Made from one main fabric piece folded in half, sewn up the sides, with two fabric handles attached. No lining, no zipper — just clean construction practice. Finished size: approximately 14 inches wide x 15 inches tall with 20-inch handles.",
      steps: [
        {
          number: 1,
          title: "Cut All Pieces",
          instructions: "Main body: cut one piece 30 inches wide x 16 inches tall. Handles: cut two pieces each 5 inches wide x 22 inches long. Press all pieces flat. Mark the center of the top edge of the main body.",
          proTip: "Wash and press your fabric before cutting. Cotton shrinks — sew first, wash later and your bag will shrink.",
          watchOut: "Measure twice, cut once. Imprecise cutting makes everything harder to sew.",
        },
        {
          number: 2,
          title: "Make the Handles",
          instructions: "Fold each handle piece in half lengthwise and press. Open, fold both long edges to the center crease and press. Fold in half again — all raw edges hidden inside. Press firmly (handle should be about 1.25 inches wide). Topstitch down both long edges, 1/8 inch from the edge. Backstitch at both ends.",
          proTip: "If handles are floppy, add a strip of fusible interfacing inside before folding.",
          watchOut: "Do not skip the topstitching on the handles. Without it they will unfold and look sloppy.",
        },
        {
          number: 3,
          title: "Attach Handles to Bag Body",
          instructions: "On the right side of your fabric, measure 4 inches in from each side edge on both short ends. Position each handle end at these marks — loop pointing DOWN toward the fabric. Sew across each handle end 1/4 inch from the raw edge to baste in place.",
          proTip: "The handles will look like they are pointing the wrong way. That is correct — they flip up when you turn the bag.",
          watchOut: "Make sure both handles are facing the same direction and positioned symmetrically.",
        },
        {
          number: 4,
          title: "Fold and Sew the Bag",
          instructions: "Fold main fabric in half with RIGHT SIDES together. Pin down both side edges. Sew both side seams with 1/2 inch seam allowance. Backstitch at the top of each side seam. Sew a box stitch or X pattern over the handle attachment for extra strength.",
          proTip: "Double-stitch the top 2 inches of each side seam for extra strength.",
        },
        {
          number: 5,
          title: "Finish the Raw Edges",
          instructions: "Zigzag stitch (width 3, length 2.5) along the top raw edge, and both side seam allowances. Press both side seams open flat.",
          proTip: "Finishing the edges means your bag will not fray or fall apart after washing.",
        },
        {
          number: 6,
          title: "Hem the Top Opening",
          instructions: "Fold the top raw edge down 1/2 inch toward the inside and press. Fold down again 1/2 inch and press. Pin in place. Topstitch around the entire top opening close to the lower folded edge. Turn right-side out. Press completely.",
          proTip: "Press every fold before topstitching. Pressed fabric topstitches cleanly. Unpressed fabric bunches.",
        },
      ],
      troubleshooting: [
        { problem: "Handles are twisted", fix: "Lay them flat on the table and check that neither one is twisted before you sew." },
        { problem: "Bag sides are uneven", fix: "Your cutting was off. Measure both side seams from the fold before sewing." },
        { problem: "Top hem won't lay flat", fix: "Press after each fold. Do not try to topstitch without pressing first." },
        { problem: "Stitching at handle attachment looks messy", fix: "Slow way down at that junction. There are multiple layers. Use a heavier needle if needed." },
      ],
    },
    {
      title: "Project 3: Elastic Waist Skirt",
      subtitle: "Your first wearable garment — measure yourself, cut to fit, and wear what you made",
      difficulty: "Beginner",
      time: "3–4 hours",
      quote: "The first time you put on something you made yourself — I cannot explain what that does to you. It is not just a skirt. It is proof. Proof that you can do this, that you are more capable than you thought, and that a skill you learned in a few weeks can produce something real and beautiful. Pick a fabric you love for this one.",
      skills: [
        "Taking body measurements and cutting to fit",
        "Sewing a side seam on a garment",
        "Creating and attaching a waistband casing",
        "Threading and inserting elastic",
        "Sewing a double-fold hem",
        "Understanding how garments are constructed",
      ],
      overview: "You will take your own measurements, calculate cutting dimensions, sew a side seam, build a waistband casing, insert elastic, and hem the bottom. No pattern needed. Measure: waist (narrowest part), hips (fullest part), and desired skirt length before starting.",
      steps: [
        {
          number: 1,
          title: "Calculate Your Cutting Dimensions",
          instructions: "WIDTH: Hip measurement + 4 inches ease + 1 inch seam allowance. Example: 42-inch hips + 5 = 47 inches wide. HEIGHT: Desired skirt length + 4.5 inches. Example: 22-inch length + 4.5 = 26.5 inches tall. Cut ONE rectangle to these dimensions.",
          proTip: "Add more ease (width) if you want a flowy gathered look. Less ease for a closer fit.",
          watchOut: "Do not skip calculating. Guessing your dimensions is how you end up with a skirt that does not fit.",
        },
        {
          number: 2,
          title: "Finish the Side Edges",
          instructions: "On both short sides of your rectangle — zigzag stitch along the raw edge to prevent fraying. Do this now before the fabric is sewn into a tube. Press the fabric after finishing.",
        },
        {
          number: 3,
          title: "Sew the Side Seam",
          instructions: "Fold rectangle in half with RIGHT SIDES together — the two short ends meet. Pin and sew the side seam with 1/2 inch seam allowance. Backstitch at both ends. Press this seam open flat.",
          proTip: "Hold it up after pressing — you should be able to slip it over your hips. If not, your width needs adjustment.",
        },
        {
          number: 4,
          title: "Create the Waistband Casing",
          instructions: "Turn tube wrong-side out. Fold top raw edge down 1/4 inch and press. Fold down again 1.25 inches and press. Pin all the way around. Topstitch close to the lower folded edge, leaving a 2-inch opening to insert elastic. Backstitch on both sides of the opening.",
          proTip: "Make your casing slightly wider than your elastic. Using 1-inch elastic? Make the casing at least 1.25 inches.",
          watchOut: "If you sew the casing completely closed you will have to rip stitches to insert the elastic.",
        },
        {
          number: 5,
          title: "Insert the Elastic",
          instructions: "Cut elastic to waist measurement minus 2 inches. Attach a safety pin to one end and thread it through the casing. Hold onto both ends before letting go. Overlap the ends by 1 inch and zigzag together several times. Ease the joined elastic back into the casing. Close the opening with topstitching.",
          proTip: "Before closing the casing, put the skirt on and check the waist fit. You can still adjust at this point.",
          watchOut: "Do not twist the elastic inside the casing. Work the safety pin through slowly and check for twists before joining the ends.",
        },
        {
          number: 6,
          title: "Hem the Bottom",
          instructions: "Try it on and mark the hem length. Fold the bottom raw edge up 1/2 inch and press. Fold up again 1 inch and press. Pin all the way around and topstitch close to the upper folded edge. Backstitch at start and end. Press the finished hem.",
          proTip: "Hang your skirt up overnight before hemming if possible — fabric can drop. Then hem at the final length.",
        },
      ],
      troubleshooting: [
        { problem: "Skirt is too tight at the hips", fix: "Your width calculation didn't include enough ease. Rip the side seam and resew with a smaller seam allowance." },
        { problem: "Elastic twisted inside the casing", fix: "Open the casing and re-thread the elastic carefully. Next time check for twists as you go." },
        { problem: "Waistband is too loose or too tight", fix: "Adjust the elastic length. Too loose — open the casing and shorten the elastic. Too tight — add more length." },
        { problem: "Hem is uneven", fix: "Press it completely flat and re-pin before topstitching. An iron fixes most hem problems." },
        { problem: "Side seam is curved instead of straight", fix: "Keep your eyes on the seam guide line, not the needle. Slow down on longer seams." },
      ],
    },
  ],
  tier_2: [
    {
      title: "Project 1: Lined Zipper Pouch",
      subtitle: "Conquer the zipper once and for all — then make three more",
      difficulty: "Intermediate",
      time: "2–3 hours",
      quote: "Zippers are the thing intermediate sewists avoid the longest. I know because I did it too. But here is the truth — once you do one zipper cleanly, you are going to want to put zippers on everything. This pouch is your zipper breakthrough moment.",
      skills: [
        "Installing a zipper cleanly",
        "Lining a bag so the inside looks as good as the outside",
        "Topstitching near a zipper for a flat professional finish",
        "Working with multiple fabric layers",
        "Box corners for a structured bottom (optional)",
      ],
      overview: "Two fabric pouches — an outer and an inner lining — joined at the top by a zipper. No raw edges visible inside or outside. Finished size: approximately 9 inches wide x 6 inches tall. You need: two outer fabric pieces (10x7 in), two lining pieces (10x7 in), a 9-inch+ zipper, and a zipper foot.",
      steps: [
        {
          number: 1,
          title: "Prepare Your Fabric",
          instructions: "Cut all four pieces: two outer fabric and two lining pieces, each 10 x 7 inches. If using interfacing, fuse it to the wrong side of both outer pieces. Press all four pieces flat. Mark the top (10-inch edge) on each piece.",
          proTip: "Iron your interfacing before cutting so the fabric lays flat for accurate cutting.",
        },
        {
          number: 2,
          title: "Attach Zipper to Outer Fabric (First Side)",
          instructions: "Outer fabric face UP. Zipper face DOWN on top, aligning tape with fabric's top edge. Lining face DOWN on top of the zipper — a sandwich. Sew with zipper foot, 1/4 inch seam allowance. Open the sandwich — press fabric away from the zipper on both sides. Topstitch 1/8 inch from the folded edge.",
          proTip: "Press the fabric away from the zipper teeth firmly before topstitching. This is what makes it lay flat.",
          watchOut: "Sew slowly near the zipper pull — stop with needle down, raise presser foot, move the pull past the foot, lower foot, continue.",
        },
        {
          number: 3,
          title: "Attach Zipper to Second Side",
          instructions: "Repeat step 2 with the remaining outer and lining pieces on the other side of the zipper. Open the zipper halfway before the next step — this is critical.",
          proTip: "Check that both fabric sides are facing the right direction before sewing the second side.",
          watchOut: "Do not forget to open the zipper partway. If you close it all the way you cannot turn the pouch right-side out.",
        },
        {
          number: 4,
          title: "Sew the Side and Bottom Seams",
          instructions: "Rearrange so outer pieces are right sides together and lining pieces are right sides together. Match and pin all raw edges. Sew around the outer fabric — down one side, across the bottom, up the other side (3/8 inch seam allowance). Repeat for the lining but leave a 3-inch opening in the BOTTOM for turning. Clip corners on both.",
          proTip: "Reinforce the zipper ends by backstitching over them a few times — this is a stress point.",
          watchOut: "Do not skip the opening in the lining. You cannot turn the pouch without it.",
        },
        {
          number: 5,
          title: "Turn Right-Side Out and Close",
          instructions: "Reach through the lining opening and pull the outer pouch through. Use a point turner to push out all four corners. Tuck the lining inside. Press everything flat — especially the zipper area. Fold in raw edges of the lining opening, pin closed, and edgestitch or hand-sew to close. Final press.",
          proTip: "Press the zipper area from both sides. A well-pressed zipper looks professional even if the sewing was imperfect.",
        },
      ],
      troubleshooting: [
        { problem: "Zipper is wavy and puckered", fix: "You didn't press the fabric away from the zipper before topstitching. Press it flat, then topstitch." },
        { problem: "Can't get close enough to the zipper", fix: "You need a zipper foot. A regular foot physically cannot get close enough. It is a $10 fix." },
        { problem: "Lining is bunching up inside", fix: "Pull the lining out and push it back in smoothly, then press the opening edge flat." },
        { problem: "Zipper pull is caught in the seam", fix: "Open the zipper before sewing the side seams. Every time. No exceptions." },
        { problem: "Corners are lumpy", fix: "Clip the corners closer to the stitching and use a point turner to push them all the way out before pressing." },
      ],
    },
    {
      title: "Project 2: Basic Joggers / Lounge Pants",
      subtitle: "Knit fabric, inseams, and waistbands — the holy trinity of garment construction",
      difficulty: "Intermediate",
      time: "4–6 hours",
      quote: "Knit fabric unlocks an entirely new category of what you can make. Joggers, leggings, hoodies, swimwear — all of it starts with knowing how to handle stretch. Once you can sew knits, your project possibilities triple overnight.",
      skills: [
        "Working with knit and stretch fabric",
        "Using the right stitch for stretch seams",
        "Sewing an inseam and crotch curve",
        "Building a ribbed or fold-over waistband",
        "Hemming knit fabric without a serger",
        "Understanding garment ease and fit",
      ],
      overview: "Use a beginner-rated jogger pattern (Simplicity 8392, McCall's M7556, or search Etsy for a digital PDF jogger pattern). Buy or download before starting. You'll need French terry or sweatshirt fleece (2–2.5 yards), ribbing fabric for the waistband, 1-inch elastic, a ballpoint needle, and polyester thread.",
      steps: [
        {
          number: 1,
          title: "Set Up Your Machine for Knits",
          instructions: "Install a ballpoint or stretch needle. Set stitch to a narrow zigzag (width 1.5, length 2.5) or use your machine's built-in stretch stitch. Do NOT use a straight stitch on knit seams — it will pop when the fabric stretches. Test on a scrap first — pull the seam gently, it should stretch without breaking.",
          proTip: "Test every stitch setting on your actual fabric before cutting your pattern pieces.",
          watchOut: "Using a universal needle on knit fabric causes skipped stitches. If stitches look inconsistent, change the needle first.",
        },
        {
          number: 2,
          title: "Cut Your Pattern Pieces",
          instructions: "Lay pattern pieces on fabric per the layout diagram — the STRETCH goes around your body (horizontal), not up and down. Cut with a rotary cutter for cleanest edges. Transfer all markings.",
          proTip: "Pin pattern pieces to knit fabric sparingly — too many pins can stretch the fabric. Use weights when possible.",
        },
        {
          number: 3,
          title: "Sew the Leg Seams",
          instructions: "Sew the SIDE SEAM of each leg first with 5/8 inch seam allowance using stretch stitch. Press seams to one side (not open). Then sew the INSEAM of each leg from ankle up to the crotch point. You now have two finished leg tubes.",
          proTip: "Press knit seams with a pressing cloth and steam. Let them cool before moving — heat-set knit seams hold better.",
        },
        {
          number: 4,
          title: "Sew the Crotch Seam",
          instructions: "Turn one leg right-side out and insert it inside the other leg (wrong-side out) — right sides together. Match inseams. Sew the curved crotch seam in one continuous line. Reinforce by sewing a second line 1/4 inch inside the first, then trim between the two lines. Clip into curves every 1/2 inch.",
          proTip: "Sew the crotch seam twice. This is the highest stress point in any pant.",
          watchOut: "Do not skip clipping the curves. An unclipped crotch curve will pull and be uncomfortable to wear.",
        },
        {
          number: 5,
          title: "Build and Attach the Waistband",
          instructions: "Cut waistband: width = waist measurement minus 2–4 inches, height = desired height x 2 plus 1 inch. Sew short ends together to form a loop. Fold in half lengthwise (wrong sides together). Quarter-mark both the waistband and pants opening. Match marks, sew with stretch stitch, stretching the waistband to match. Press seam toward pants body. Topstitch to hold flat.",
          proTip: "The quarter-marking method distributes the ease evenly all the way around.",
          watchOut: "If your waistband is wavy after sewing, it was stretched too much. Re-sew with less tension.",
        },
        {
          number: 6,
          title: "Hem the Ankles",
          instructions: "Try on and mark hem length. Add 1.5 inches for hem allowance. Fold up 3/4 inch and press. Fold up again 3/4 inch and press. Use a twin needle for a professional knit hem. If no twin needle, use a medium zigzag. Sew the hem, stretching slightly as you go.",
          proTip: "A twin needle is the single best tool for hemming knit fabric. It is $4–$6 and makes your hems look store-bought.",
        },
      ],
      troubleshooting: [
        { problem: "Stitches are skipping on knit fabric", fix: "Change to a ballpoint or stretch needle immediately. This is almost always the cause." },
        { problem: "Seams are popping when pulled", fix: "You used a straight stitch. Re-sew with a narrow zigzag or stretch stitch." },
        { problem: "Crotch seam is pulling and uncomfortable", fix: "You didn't clip the curves. Carefully clip into the seam allowance every 1/2 inch without cutting through the stitches." },
        { problem: "Waistband is rippling or wavy", fix: "The waistband was cut too short or stretched too much while sewing. Re-cut with more length." },
        { problem: "Knit fabric stretched while cutting", fix: "Use pattern weights instead of pins and cut with a sharp rotary cutter in one smooth pass." },
      ],
    },
    {
      title: "Project 3: Sublimation Tumbler",
      subtitle: "Your first heat press project — 90 seconds and a $25–$35 product",
      difficulty: "Intermediate",
      time: "1–2 hours (first time)",
      quote: "One tumbler takes about 90 seconds to press. They sell for $25 to $35 depending on size and design. You do that math. This is not just a project — this is the beginning of a product line. Pay attention to every detail in this lesson because the details are what the money is in.",
      skills: [
        "Understanding how sublimation works",
        "Setting up your heat press correctly",
        "Designing for a cylindrical sublimation blank",
        "Pressing time, temperature, and pressure",
        "Avoiding ghosting and color shift",
        "Packaging a sublimation product for sale",
      ],
      overview: "Sublimation is a heat transfer process where ink turns into gas and permanently bonds with polyester-coated surfaces. The result is a full-color, scratch-resistant, washable design that will not peel or fade. You need: a sublimation tumbler blank (20 oz or 30 oz, 'sublimation ready'), sublimation printer + paper, a tumbler press or silicone wrap + convection oven, and heat resistant tape.",
      steps: [
        {
          number: 1,
          title: "Create Your Design",
          instructions: "In Canva, set canvas size to the wrap dimensions of your tumbler. For 20 oz skinny: 9.3 x 8.2 inches. For 30 oz: 9.3 x 8.9 inches. Use vibrant colors. Keep important elements away from the edges. Download as PNG at 300 DPI minimum.",
          proTip: "Design your file slightly larger than the tumbler wrap dimensions so you have trim room. Overlap is better than a gap.",
          watchOut: "White does not sublimate. The white areas of your design will show as the white coating on the tumbler — use this intentionally.",
        },
        {
          number: 2,
          title: "Print Your Design",
          instructions: "Load sublimation paper with the coated/bright side facing the print direction. Use highest quality setting and correct paper type (usually 'matte photo'). Do not touch the printed surface with bare hands. Let dry 2–3 minutes. Trim leaving about 1/4 inch of white border around edges.",
          proTip: "Print a test on regular paper first to check sizing before using sublimation paper.",
          watchOut: "Never let two freshly printed sheets touch face-to-face — the ink will transfer between them.",
        },
        {
          number: 3,
          title: "Prep Your Tumbler",
          instructions: "Wipe the tumbler completely clean with rubbing alcohol and a lint-free cloth. Let dry fully. Wrap your design around the tumbler, checking it is straight and centered vertically. Secure with heat resistant tape across the top, middle, and bottom.",
          proTip: "Use a lint roller on the tumbler before wiping with alcohol to remove any loose fibers first.",
          watchOut: "Do not use regular tape. It will leave residue and potentially damage the coating at pressing temperatures.",
        },
        {
          number: 4,
          title: "Press Your Tumbler",
          instructions: "TUMBLER PRESS: Preheat to 360–385°F. Place wrapped tumbler in press. Press for 60–90 seconds. SILICONE WRAP + OVEN: Slide into silicone wrap, place in convection oven at 400°F for 7–9 minutes. Always test on one tumbler before pressing a full batch. Use heat gloves to remove.",
          proTip: "Write down your successful time/temp combination for each blank type. Build your own reference chart.",
          watchOut: "Never open the press or oven early. An incomplete press results in faded, washed-out colors.",
        },
        {
          number: 5,
          title: "Remove and Reveal",
          instructions: "Immediately remove tape and peel paper away while still hot. Peel quickly and steadily — do not stop mid-peel. Set on a heat-safe surface. Do not touch the design area until cool (1–2 minutes). Examine: colors should be vibrant, edges sharp, no ghosting.",
          proTip: "Peel the paper while hot. If you let it cool with the paper on, the paper can stick and the design can ghost.",
          watchOut: "If you see ghosting (blurry double image), your paper shifted during pressing. Use more tape next time.",
        },
        {
          number: 6,
          title: "Price and Package Your Tumbler",
          instructions: "Price: minimum $25 for 20 oz, $30–$35 for 30 oz. Your cost: blank ($5–$8) + ink and paper (~$1–$2) + your time. Wrap in tissue paper, place in a box or gift bag. Photograph on a clean background. Create a Canva mockup before pressing for custom order confirmations.",
          proTip: "Presentation matters as much as the product. A beautifully packaged tumbler commands a higher price and better reviews.",
        },
      ],
      troubleshooting: [
        { problem: "Colors are faded or washed out", fix: "Press temperature was too low or time too short. Increase temp by 5 degrees or add 10 seconds." },
        { problem: "Ghost image (blurry double)", fix: "Paper shifted during pressing. Use more tape. Peel paper immediately while hot." },
        { problem: "White spots or patches in the design", fix: "Tumbler was not clean before pressing. Always wipe with alcohol and let dry completely." },
        { problem: "Design did not fully transfer on one side", fix: "Coverage was uneven. The tumbler may need to be rotated during pressing." },
        { problem: "Colors look different from screen design", fix: "Expected. Sublimation prints shift slightly. Design with slightly more saturation than you want in the final product." },
      ],
    },
  ],
  tier_3: [
    {
      title: "Project 1: Full Wrap Sublimation Hoodie",
      subtitle: "Cut and sew sublimation — the premium product that commands premium pricing",
      difficulty: "Advanced",
      time: "4–6 hours including design",
      quote: "A full wrap sublimation hoodie is not a $25 product. Priced and presented correctly — premium fabric, clean construction, thoughtful design — you are looking at $85 to $150 retail. This is the product that moves your brand from craft seller to fashion brand. Build it right.",
      skills: [
        "Cut and sew sublimation process on apparel",
        "Design registration across seam lines",
        "Pressing panels before assembly",
        "Constructing a hoodie from sublimated fabric panels",
        "Seam placement strategy for design continuity",
        "Pricing and positioning a premium sublimation garment",
      ],
      overview: "Cut and sew sublimation means you print your design onto fabric panels BEFORE cutting and sewing — unlike pressing a finished blank. This allows full design coverage with no unprinted seam allowances. You need: 100% polyester fabric (white, ~2.5 yards), ribbing fabric for cuffs/waistband, sublimation printer or print service, large format heat press (16x20 or larger), a hoodie pattern, and heat resistant tape.",
      steps: [
        {
          number: 1,
          title: "Create Your Panel Designs",
          instructions: "In your design software, lay out hoodie pattern pieces as templates. Create a design that flows across the panels — chest, back, sleeves, and hood should feel like one continuous design. Export each panel at 300 DPI minimum. Size design files to match actual fabric panel dimensions plus 1 inch bleed on all edges.",
          proTip: "Number each panel file clearly (Front Panel, Back Panel, Left Sleeve, Right Sleeve, Hood Left, Hood Right). You will print and press each one separately.",
          watchOut: "Mirroring matters on the sleeves. Your left sleeve design must be mirrored from your right. Check this before printing.",
        },
        {
          number: 2,
          title: "Print and Press Fabric Panels",
          instructions: "Cut polyester fabric into large rectangles — one per panel, each about 2 inches larger than the pattern piece on all sides. Print each panel on sublimation paper. Lay paper face-down on fabric, aligning the design. Secure with heat resistant tape on all four edges. Press at 385–400°F for 45–60 seconds with firm pressure. Peel paper immediately while hot. Allow to cool completely before handling.",
          proTip: "Press a test on a scrap of your exact polyester fabric first. Color and saturation will vary by fabric.",
          watchOut: "Press the fabric BEFORE cutting pattern pieces. Pressing after cutting causes distortion at the edges.",
        },
        {
          number: 3,
          title: "Cut Pattern Pieces from Pressed Panels",
          instructions: "Once all panels are pressed and fully cooled, lay your pattern pieces on the corresponding pressed panels. Align grain lines carefully. Cut precisely. Transfer all pattern markings. Keep all cut pieces organized and labeled.",
          proTip: "After cutting, hold each piece up and check the design direction before sewing. Rearranging panels after construction is impossible.",
        },
        {
          number: 4,
          title: "Construct the Hoodie",
          instructions: "Follow your pattern's construction sequence exactly — most hoodies: hood panels, front/back shoulder seams, set in sleeves, side seams, hood attachment, cuffs and waistband. Use a ballpoint needle and polyester thread throughout. Sew with narrow zigzag or stretch stitch. Check design alignment at every seam before sewing. Press each seam toward the darker fabric.",
          proTip: "When attaching the hood to the neckline, quarter-mark both pieces and match the marks for even distribution.",
          watchOut: "Sublimated polyester is slippery. Use wonder clips instead of pins which can leave marks on the fabric.",
        },
        {
          number: 5,
          title: "Attach Cuffs and Waistband",
          instructions: "Cut ribbing pieces to pattern dimensions (typically 2/3 of the opening measurement). Fold ribbing in half lengthwise, wrong sides together. Quarter-mark the ribbing loop and the sleeve opening. Match marks, stretch ribbing to fit, sew with stretch stitch. Repeat for waistband. Press all attached ribbing seams toward the body.",
          proTip: "Sewing ribbing slowly and evenly distributed is what makes the finished cuff and waistband look professional.",
        },
        {
          number: 6,
          title: "Finish, Price, and Photograph",
          instructions: "Trim all threads. Final press on the inside using a pressing cloth. Check design alignment across all seams. Photograph on a model or dress form. Pricing: your cost is fabric ($20–$30) + printing ($8–$15) + time (2+ hours at $25/hr = $50+). Retail: $120–$180. Position it as a premium custom piece.",
          proTip: "Never show your cost to your customers. Price based on value and market position, not on your cost plus a little.",
        },
      ],
      troubleshooting: [
        { problem: "Design is misaligned across seams", fix: "Usually a cutting error. Always verify design alignment before cutting and again before sewing each seam." },
        { problem: "Colors look faded after pressing", fix: "Pressing temperature too low or time too short. Test on scraps first and adjust. Polyester fabric varies in sublimation requirements." },
        { problem: "Fabric is distorted or stretched", fix: "You pressed or sewed with too much tension. Polyester sublimation fabric is slippery — handle it gently and cut with care." },
        { problem: "Seams are visible through the design", fix: "Press seam allowances toward the back or darker side of the seam. Use a seam roll for consistent pressing." },
        { problem: "Ribbing is rippling at cuffs", fix: "Ribbing was not stretched evenly during attachment. Quarter-mark and ease evenly next time." },
      ],
    },
    {
      title: "Project 2: Custom Bonnet Product Line",
      subtitle: "Three variations, three price points, one niche dominated",
      difficulty: "Advanced",
      time: "2–3 hours per bonnet",
      quote: "Nothing But Bonnets is a whole brand for a reason. The bonnet market is real, the demand is consistent, and the customization possibilities are endless. Three variations — standard satin, sublimation print, and glow-in-the-dark — gives you three separate products, three different customer conversations, and three price points on one skill set.",
      skills: [
        "Satin bonnet construction with professional finish",
        "Sublimation on bonnet fabric",
        "Glow-in-the-dark and specialty fabric techniques",
        "Building a product line with tiered pricing",
        "Custom name and photo bonnet fulfillment workflow",
        "Packaging and presenting bonnets for retail",
      ],
      overview: "This project builds three bonnet variations as a complete product line. You will construct the base bonnet structure, then apply three different surface treatments. Make in 3 sizes: Child (18–20 in diameter), Standard Adult (22–24 in), and Jumbo/XL (26–28 in) for locs and twists.",
      steps: [
        {
          number: 1,
          title: "Cut the Bonnet Base",
          instructions: "The bonnet shape is a large circle with the front edge cut straight. Fold fabric in half, then in half again (quarters). Cut a quarter-circle arc to create a full circle when unfolded. Cut two circles per bonnet (outer + lining). Mark the center point — this is the crown.",
          proTip: "Use a fabric marker tied to a string at the center point as a compass to cut a perfect circle. Pin the string at center, hold marker at your radius distance, and draw the arc.",
        },
        {
          number: 2,
          title: "Variation A — Standard Satin Bonnet",
          instructions: "Sew outer and lining circles wrong sides together around the edge, leaving the straight front edge open. Fold front edge over 1/4 inch and press. Fold over again 3/4 inch and press to create elastic casing. Topstitch casing closed leaving a 1-inch opening for elastic. Thread 1/4 inch soft elastic (elastic length = head circumference minus 2 inches). Join elastic ends and close the opening.",
          proTip: "Satin is slippery. Use wonder clips instead of pins and a new sharp needle to prevent snags.",
          watchOut: "Satin can fray aggressively. Finish raw edges with a serger or narrow zigzag before assembling.",
        },
        {
          number: 3,
          title: "Variation B — Sublimation Photo/Name Bonnet",
          instructions: "Start with a white polyester bonnet blank or white polyester fabric circles. Create your sublimation design — name, photo, or full-coverage pattern in Canva as a circle matching your bonnet diameter. Press design onto outer fabric (380–400°F for 45–60 seconds). Allow to cool completely. Then construct using the same method as the standard bonnet. For custom orders: always send a Canva mockup for customer approval BEFORE pressing.",
          proTip: "Create a digital proofing process for custom orders — never press and construct without customer approval first.",
          watchOut: "Always test your press settings on a scrap of the exact fabric first.",
        },
        {
          number: 4,
          title: "Variation C — Glow-in-the-Dark Bonnet",
          instructions: "Use specialty glow-in-the-dark fabric for the outer layer and standard satin for the lining. Check manufacturer's care and pressing instructions before starting. Construct exactly like the standard satin bonnet. Price this variation $10–$15 higher than your standard bonnet.",
          proTip: "Film a short video of your glow bonnet activating in a dark room. This content alone will sell the product for you.",
        },
        {
          number: 5,
          title: "Build Your Bonnet Pricing Structure",
          instructions: "Standard Satin: materials $4–$6, time 30–45 min → sell at $20–$28. Sublimation Custom: materials $6–$10 + design time → sell at $30–$45. Glow-in-the-Dark: materials $8–$12 → sell at $30–$40. Bundle: All Three Bonnet Set → $75–$95. Add-ons: matching scrunchie (+$8–$12), gift packaging (+$5), custom name (+$10–$15).",
          proTip: "The bundle offer is where the real profit is. Most customers who buy one bonnet will buy the bundle if you present it correctly.",
        },
        {
          number: 6,
          title: "Package for Retail",
          instructions: "Present each bonnet in a clear organza bag or small gift box with tissue paper. Add a branded care card: 'Hand wash in cold water, lay flat to dry.' Add your brand tag — woven label sewn in or hang tag on the elastic. Photograph each variation on a model, flat lay, and in packaging.",
          proTip: "A bonnet that sells for $25 in a plain plastic bag sells for $30–$35 in quality packaging. Presentation is part of the product.",
        },
      ],
      troubleshooting: [
        { problem: "Satin keeps slipping while cutting", fix: "Use weights instead of pins. Cut on a non-slip surface. Sharp rotary cutter in one smooth pass." },
        { problem: "Sublimation design is blurry or smeared", fix: "Fabric was not properly secured during pressing. Use more tape, press firmly, do not move fabric during press." },
        { problem: "Elastic is too tight or too loose", fix: "Adjust before closing. Try the bonnet on before joining elastic ends." },
        { problem: "Glow fabric is not glowing", fix: "It needs sufficient light exposure before glowing. Hold under a bright light for 60 seconds before testing in the dark." },
        { problem: "Seams are visible through the satin outer fabric", fix: "Press seam allowances toward the lining side so they don't shadow through the outer fabric." },
      ],
    },
    {
      title: "Project 3: Patterned Garment with Full Lining",
      subtitle: "Your portfolio piece — the project that proves your level and commands top dollar",
      difficulty: "Advanced",
      time: "8–12 hours",
      quote: "This is your portfolio piece. The thing you photograph, put on your website, show at markets, and post when you want people to understand your level. When someone asks how much — and they will ask — you say the number confidently because you built something that is worth it. Make it in a fabric that shows off the construction. Make it in something that makes people stop.",
      skills: [
        "Advanced pattern work and fitting adjustments",
        "Full lining construction and attachment",
        "Professional seam finishing techniques",
        "Applying a zipper in a lined garment",
        "Creating a portfolio-worthy finished piece",
        "Pricing and marketing high-ticket custom garments",
      ],
      overview: "A fully lined garment — the inside looks as good as the outside. No raw edges, no visible seam allowances, no shortcuts. Choose your garment type: dress, skirt with structured waistband, or jacket. Use a structured outer fabric (ponte, brocade, medium-weight woven) with a smooth lining (charmeuse, bemberg, or cotton voile) and a centered or invisible zipper.",
      steps: [
        {
          number: 1,
          title: "Read, Prepare, and Fit the Pattern",
          instructions: "Read the ENTIRE pattern instruction sheet before cutting a single piece. Make a muslin (test garment) from cheap fabric before cutting your fashion fabric. Put on the muslin, check fit at bust, waist, hips, and length. Transfer all fitting adjustments to your pattern pieces before cutting fashion fabric. Cut outer fabric and lining pieces separately.",
          proTip: "The muslin step is what separates a project that fits from a project you never wear. Do not skip it on any garment you are making to sell.",
          watchOut: "Cut your lining pieces 1/4 inch smaller than the outer fabric pieces on the side seams — lining should be slightly smaller so it doesn't pull the outer fabric.",
        },
        {
          number: 2,
          title: "Apply Interfacing and Construct Outer Garment",
          instructions: "Fuse interfacing to all pieces that require it (waistband, zipper area, collar). Construct the outer garment following the pattern sequence, but leave the zipper seam unsewn. Press every seam. Finish all seam allowances on the outer garment. Stay-stitch the neckline or any curved edges before assembling.",
          proTip: "Stay-stitching is a single line of regular stitching just inside the seam allowance on curves. It costs 2 minutes and prevents 2 hours of fitting problems later.",
        },
        {
          number: 3,
          title: "Install the Zipper",
          instructions: "For INVISIBLE ZIPPER: Press the zipper coil open using a cool iron before sewing. Attach invisible zipper foot. Position zipper face-down on right side of fabric, coil aligned with seam line. Sew as close to the coil as possible. Sew the remainder of the seam below the zipper with a regular zipper foot. Test before proceeding.",
          proTip: "Press your invisible zipper open before sewing. Unpressed coils cannot be sewn invisibly — the foot cannot get close enough.",
          watchOut: "Never sew over the zipper pull or stop. Sew to within 1/2 inch of the stop, backstitch, and leave the rest.",
        },
        {
          number: 4,
          title: "Construct and Attach the Lining",
          instructions: "Construct the lining exactly like the outer garment, leaving the zipper seam open. Do NOT finish lining seam allowances. Press all lining seams open. With outer garment wrong-side out, slip the lining inside (right sides together). Match all seams and zipper openings. Sew lining to outer garment at the neckline or waist seam. Clip curves, trim corners, turn right-side out.",
          proTip: "Match seams between lining and outer fabric before pinning. Mismatched seams cause the garment to pull to one side.",
        },
        {
          number: 5,
          title: "Attach Lining at Zipper and Hem",
          instructions: "Fold lining seam allowances under at the zipper opening and hand-stitch or edgestitch the lining to the zipper tape. Try on and check that lining sits smoothly without pulling. Mark the hem on the outer garment while wearing it. Hem outer garment first. The lining hem should be 1 inch shorter than the outer hem. Press the entire finished garment using a pressing cloth.",
          proTip: "Hand stitching the lining to the zipper tape takes 10 minutes and looks completely professional.",
        },
        {
          number: 6,
          title: "Final Fitting, Pricing, and Photography",
          instructions: "Try on and check fit, zipper, lining drape, and hem. Make final adjustments. Pricing: materials ($50–$80) + labor at $35–$50/hour for advanced work ($280–$600). Suggested retail for a custom version: $300–$500. Photograph on a model or dress form. Show the inside — photograph the lining. The inside quality is part of your selling point.",
          proTip: "Showing the inside of your garment is a power move. Most people have never seen a clean lined garment interior. It sells your skill instantly.",
        },
      ],
      troubleshooting: [
        { problem: "Lining is pulling the outer fabric out of shape", fix: "Your lining is cut too small. The lining should be slightly smaller at side seams but with ease built in at curves." },
        { problem: "Invisible zipper shows from the outside", fix: "The zipper coil was not pressed open before sewing, so the foot could not get close enough. Press, re-sew, closer to the coil." },
        { problem: "Garment doesn't fit after construction", fix: "This is why we make muslins. For your next garment, always fit the muslin and transfer adjustments before cutting fashion fabric." },
        { problem: "Lining hem is too long and visible at the hem", fix: "The lining hem must be 1 inch shorter than the outer hem. Adjust the lining hem and re-press." },
        { problem: "Seams on the outer fabric are showing through the lining", fix: "Press seam allowances toward the lining side, or use a seam roll to press without creating ridges that show through." },
      ],
    },
  ],
};

function ProjectCard({ project, index }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#6B3FA0] text-white flex items-center justify-center font-bold text-sm shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#111] text-sm leading-snug">{project.title}</h3>
          <p className="text-xs text-[#666] mt-0.5">{project.subtitle}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] uppercase">{project.difficulty}</span>
            <span className="text-[10px] text-[#999] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {project.time}
            </span>
          </div>
        </div>
        {expanded
          ? <ChevronDown className="w-5 h-5 text-[#6B3FA0] shrink-0 mt-0.5" />
          : <ChevronRight className="w-5 h-5 text-[#999] shrink-0 mt-0.5" />
        }
      </button>

      {expanded && (
        <div className="border-t border-[#EEEEEE] px-5 pb-5 space-y-5">
          {/* Coach quote */}
          <blockquote className="mt-4 bg-[#D4AF37]/8 border-l-4 border-[#D4AF37] rounded-r-xl px-4 py-3">
            <p className="text-xs text-[#333] italic leading-relaxed">"{project.quote}"</p>
            <p className="text-[10px] font-bold text-[#D4AF37] mt-1.5">— Coach Sheek ✂</p>
          </blockquote>

          {/* Overview */}
          <div>
            <h4 className="text-xs font-bold text-[#111] uppercase tracking-wide mb-1.5">Project Overview</h4>
            <p className="text-xs text-[#555] leading-relaxed">{project.overview}</p>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-bold text-[#111] uppercase tracking-wide mb-2">Skills You Will Learn</h4>
            <div className="space-y-1">
              {project.skills.map((skill, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#D4AF37] text-xs mt-0.5">✦</span>
                  <span className="text-xs text-[#444]">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <h4 className="text-xs font-bold text-[#111] uppercase tracking-wide mb-2">Key Steps</h4>
            <div className="space-y-2">
              {project.steps.map((step) => (
                <div key={step.number} className="border border-[#EEEEEE] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#6B3FA0] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {step.number}
                    </span>
                    <span className="text-xs font-semibold text-[#111] flex-1">{step.title}</span>
                    {expandedStep === step.number
                      ? <ChevronDown className="w-3.5 h-3.5 text-[#999]" />
                      : <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
                    }
                  </button>
                  {expandedStep === step.number && (
                    <div className="px-4 pb-4 space-y-2 border-t border-[#F5F5F5]">
                      <p className="text-xs text-[#444] leading-relaxed mt-3">{step.instructions}</p>
                      {step.proTip && (
                        <div className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2">
                          <Lightbulb className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-green-700 italic leading-relaxed">{step.proTip}</p>
                        </div>
                      )}
                      {step.watchOut && (
                        <div className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-600 italic leading-relaxed">{step.watchOut}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div>
            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="flex items-center gap-2 text-xs font-bold text-[#6B3FA0] hover:text-[#5A3490] transition-colors"
            >
              {showTroubleshooting ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Troubleshooting ({project.troubleshooting.length} common issues)
            </button>
            {showTroubleshooting && (
              <div className="mt-3 space-y-2">
                {project.troubleshooting.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#F9F9F9] rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-red-600 leading-snug">{item.problem}</p>
                      <div className="flex items-start gap-1.5 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-green-700">{item.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectGuides({ tier }) {
  const projects = TIER_PROJECTS[tier];
  if (!projects) return null;

  return (
    <div>
      <h3 className="text-lg font-extrabold text-[#111] mb-4">Your First 3 Projects</h3>
      <div className="space-y-3">
        {projects.map((project, idx) => (
          <ProjectCard key={idx} project={project} index={idx} />
        ))}
      </div>
    </div>
  );
}