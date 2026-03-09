import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log("[notifyOnNewPost] Received payload:", {
      postId: payload.postId,
      postTitle: payload.postTitle,
      authorEmail: payload.authorEmail,
      authorName: payload.authorName,
      isAnnouncement: payload.isAnnouncement,
    });

    // Only send notifications for admin posts or announcements
    if (!payload.isAnnouncement) {
      console.log("[notifyOnNewPost] Not an announcement, skipping notifications");
      return Response.json({ status: "skipped" });
    }

    // Get all users except the post author
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipientEmails = allUsers
      .filter(u => u.email !== payload.authorEmail)
      .map(u => u.email);

    console.log("[notifyOnNewPost] Notifying users:", {
      totalRecipients: recipientEmails.length,
      recipients: recipientEmails.slice(0, 5), // Log first 5 for debugging
    });

    // Create notification records for all users
    const notificationPromises = recipientEmails.map(email =>
      base44.asServiceRole.entities.Notification.create({
        recipient_email: email,
        type: "announcement",
        message: `New post: "${payload.postTitle}" by ${payload.authorName}`,
        post_id: payload.postId,
        from_name: payload.authorName,
        is_read: false,
      }).catch(err => {
        console.error(`[notifyOnNewPost] Failed to notify ${email}:`, err.message);
      })
    );

    await Promise.all(notificationPromises);

    console.log("[notifyOnNewPost] Notifications sent successfully");
    return Response.json({
      status: "success",
      notificationsSent: recipientEmails.length,
    });

  } catch (error) {
    console.error("[notifyOnNewPost] Error:", {
      error: error.message,
      stack: error.stack,
    });
    return Response.json({
      status: "error",
      error: error.message,
    }, { status: 500 });
  }
});