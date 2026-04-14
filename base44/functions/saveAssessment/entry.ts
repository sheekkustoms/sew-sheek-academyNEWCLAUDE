import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers, experienceScore, tier, startPhase, startModule } = await req.json();

    await base44.asServiceRole.entities.PlacementAssessment.create({
      user_email: user.email,
      tier,
      experience_score: experienceScore,
      answers: Object.entries(answers).map(([qId, aIdx]) => ({ question_id: parseInt(qId), answer_index: aIdx })),
      starting_phase: startPhase,
      starting_module: startModule,
      completed: true,
    });

    return Response.json({ success: true, tier });
  } catch (error) {
    console.error("[saveAssessment] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});