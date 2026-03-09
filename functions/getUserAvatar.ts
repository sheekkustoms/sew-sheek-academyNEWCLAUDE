import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Use service role to safely fetch user avatar
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (!users || users.length === 0) {
      return Response.json({ avatar_url: null });
    }

    return Response.json({ avatar_url: users[0].avatar_url || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});