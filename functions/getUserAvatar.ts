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

    const u = users[0];
    // Derive display name using same priority chain as the frontend
    const displayName = u.display_name || u.nick_name || u.full_name || u.email?.split("@")[0] || null;
    return Response.json({ avatar_url: u.avatar_url || null, display_name: displayName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});