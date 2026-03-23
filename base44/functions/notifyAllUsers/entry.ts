import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log("[notifyAllUsers] Received automation payload:", {
      event: payload.event?.type,
      entityName: payload.event?.entity_name,
      entityId: payload.event?.entity_id,
    });

    // This function is triggered by entity automations (CommunityPost, Quiz, LiveClass)
    const { event, data } = payload;

    // Only handle create events
    if (event?.type !== 'create') {
      console.log("[notifyAllUsers] Ignoring non-create event:", event?.type);
      return Response.json({ status: "skipped", reason: "not_create_event" });
    }

    // Determine notification based on entity type
    let notificationType = "announcement";
    let title = "";
    let message = "";
    let fromName = "";

    if (event.entity_name === 'CommunityPost') {
      // Only notify if it's an admin post
      if (data?.author_email && data.author_email.includes('admin') === false) {
        const authUser = await base44.auth.me();
        if (authUser?.role !== 'admin') {
          console.log("[notifyAllUsers] Skipping notification for non-admin post");
          return Response.json({ status: "skipped", reason: "not_admin_post" });
        }
      }

      title = data?.title || "New Post";
      fromName = data?.author_name || "Community Member";
      message = `New post: "${title}" by ${fromName}`;

    } else if (event.entity_name === 'Quiz') {
      title = data?.title || "New Quiz";
      fromName = "Admin";
      message = `New quiz game: "${title}"`;

    } else if (event.entity_name === 'LiveClass') {
      title = data?.title || "New Live Class";
      fromName = "Admin";
      message = `New live class: "${title}" starting at ${data?.scheduled_at ? new Date(data.scheduled_at).toLocaleTimeString() : 'soon'}`;

    } else {
      console.log("[notifyAllUsers] Unknown entity type:", event.entity_name);
      return Response.json({ status: "skipped", reason: "unknown_entity" });
    }

    // Get all users
    console.log("[notifyAllUsers] Fetching all users...");
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipientEmails = allUsers
      .filter(u => u.email !== data?.author_email)
      .map(u => u.email);

    console.log("[notifyAllUsers] Creating notifications for", recipientEmails.length, "users");

    // Create notifications in parallel
    const notificationPromises = recipientEmails.map(email =>
      base44.asServiceRole.entities.Notification.create({
        recipient_email: email,
        type: notificationType,
        message: message,
        from_name: fromName,
        post_id: event.entity_id,
        is_read: false,
      }).then(() => {
        console.log(`[notifyAllUsers] Notification created for ${email}`);
      }).catch(err => {
        console.error(`[notifyAllUsers] Failed to notify ${email}:`, err.message);
      })
    );

    await Promise.all(notificationPromises);

    console.log("[notifyAllUsers] All notifications sent successfully");
    return Response.json({
      status: "success",
      entityType: event.entity_name,
      entityId: event.entity_id,
      notificationsSent: recipientEmails.length,
      message: message,
    });

  } catch (error) {
    console.error("[notifyAllUsers] Error:", {
      message: error.message,
      stack: error.stack,
    });
    return Response.json({
      status: "error",
      error: error.message,
    }, { status: 500 });
  }
});