import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    const ADMIN_EMAILS = ["sheek24kustoms@gmail.com"];
    const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email);
    
    if (!user || !isAdmin) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Invite user - this sends the invite email automatically
    await base44.users.inviteUser(email, 'user');

    // Log the invited email
    await base44.asServiceRole.entities.InvitedEmail.create({
      email,
      invited_by: user.email,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});