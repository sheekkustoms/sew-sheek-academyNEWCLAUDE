import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Invite user - this sends the invite email automatically
    await base44.users.inviteUser(email, 'user');

    // Queue a welcome message — will be delivered when they first log in
    // We store it now so it's waiting in their inbox
    await base44.asServiceRole.entities.Message.create({
      sender_email: 'sheek24kustoms@gmail.com',
      sender_name: 'Coach Sheek',
      recipient_email: email,
      recipient_name: '',
      content: `🎉 Welcome to Oh Sew Sheek Academy!\n\nWe're so excited to have you here. This academy was made for beginners who want to learn sewing step by step in a fun and supportive space. 🧵✨`,
      is_read: false,
    });

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