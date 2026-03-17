// Admin tool: sends in-app + optional email broadcast to all users
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, message, sendEmail } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'title and message are required' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();

    let notifCount = 0;
    let emailCount = 0;

    await Promise.all(allUsers.map(async (u) => {
      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: u.email,
        type: "announcement",
        message: `📢 ${title}: ${message}`,
        from_name: "Admin",
        is_read: false,
      });
      notifCount++;

      // Email if requested and user has announcements enabled
      if (sendEmail && u.notif_announcements !== false) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: title,
          body: `Hi ${u.display_name || u.full_name || 'there'},\n\n${message}\n\n— SEW SHEEK ACADEMY`,
        });
        emailCount++;
      }
    }));

    return Response.json({ status: "success", notifCount, emailCount });
  } catch (error) {
    console.error("[sendBroadcastAnnouncement] Error:", error.message);
    return Response.json({ status: "error", error: error.message }, { status: 500 });
  }
});