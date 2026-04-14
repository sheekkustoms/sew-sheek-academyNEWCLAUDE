import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const ADMIN_EMAILS = ["sheek24kustoms@gmail.com"];
    const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email);

    if (!user || !isAdmin) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const email = body.email;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const appId = Deno.env.get("BASE44_APP_ID");
    const token = req.headers.get("X-User-Token") || (req.headers.get("authorization") || "").replace("Bearer ", "");

    const inviteRes = await fetch("https://api.base44.com/api/apps/" + appId + "/users/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Token": token,
      },
      body: JSON.stringify({ email: email, role: "user" }),
    });

    if (!inviteRes.ok) {
      const errBody = await inviteRes.text();
      return Response.json({ error: "Invite failed: " + errBody }, { status: inviteRes.status });
    }

    await base44.asServiceRole.entities.InvitedEmail.create({
      email: email,
      invited_by: user.email,
    });

    const paidThrough = new Date();
    paidThrough.setDate(paidThrough.getDate() + 30);

    await base44.asServiceRole.entities.MembershipStatus.create({
      user_email: email,
      is_active: true,
      paid_through: paidThrough.toISOString().split('T')[0],
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});