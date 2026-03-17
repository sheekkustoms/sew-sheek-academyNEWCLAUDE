// Triggered when a new Lesson is created — notifies all users
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ status: "skipped", reason: "not_create" });
    }

    const lesson = data;
    const lessonTitle = lesson?.title || "New Lesson";

    const allUsers = await base44.asServiceRole.entities.User.list();

    let notifCount = 0;
    let emailCount = 0;

    await Promise.all(allUsers.map(async (u) => {
      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: u.email,
        type: "announcement",
        message: `🎓 New lesson available: "${lessonTitle}"`,
        from_name: "SEW SHEEK ACADEMY",
        is_read: false,
      });
      notifCount++;

      // Email if user wants lesson notifications
      if (u.notif_new_lessons !== false) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `New lesson: ${lessonTitle}`,
          body: `Hi ${u.display_name || u.full_name || 'there'},\n\nA new lesson has been published on SEW SHEEK ACADEMY!\n\n📚 "${lessonTitle}"\n\nLog in to start learning:\nhttps://sewsheek.academy\n\n— SEW SHEEK ACADEMY`,
        });
        emailCount++;
      }
    }));

    return Response.json({ status: "success", notifCount, emailCount });
  } catch (error) {
    console.error("[notifyOnNewLesson] Error:", error.message);
    return Response.json({ status: "error", error: error.message }, { status: 500 });
  }
});