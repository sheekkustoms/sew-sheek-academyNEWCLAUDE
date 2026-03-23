// Sends email + in-app notification to all users about a new live class
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, scheduled_at, zoom_url, description } = await req.json();

    const allUsers = await base44.asServiceRole.entities.User.list();

    const dateStr = scheduled_at
      ? new Date(scheduled_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
      : '';

    const subject = `🎓 New Live Class: ${title}`;
    const body = `Hi there,\n\nA new live class has been scheduled!\n\n📅 ${title}\n🗓 ${dateStr}${description ? `\n\n${description}` : ''}${zoom_url ? `\n\n🔗 Join here: ${zoom_url}` : ''}\n\nSee you there!\n— SEW SHEEK ACADEMY`;

    await Promise.all(allUsers.map(async (u) => {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: u.email,
        type: "announcement",
        message: `📅 New Live Class: ${title} on ${dateStr}`,
        from_name: "SEW SHEEK",
        is_read: false,
      });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        subject,
        body,
      });
    }));

    return Response.json({ status: "success", count: allUsers.length });
  } catch (error) {
    console.error("[notifyNewLiveClass] Error:", error.message);
    return Response.json({ status: "error", error: error.message }, { status: 500 });
  }
});