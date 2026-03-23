import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import webpush from 'npm:web-push@3.6.7';

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

    // Configure web-push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        'mailto:test@example.com',
        vapidPublicKey,
        vapidPrivateKey
      );
    }

    // Get all users except the post author
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipientEmails = allUsers
      .filter(u => u.email !== payload.authorEmail)
      .map(u => u.email);

    console.log("[notifyOnNewPost] Notifying users:", {
      totalRecipients: recipientEmails.length,
      recipients: recipientEmails.slice(0, 5),
    });

    // Create notification records and send push notifications
    const notificationPromises = recipientEmails.map(async (email) => {
      try {
        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: email,
          type: "announcement",
          message: `New post: "${payload.postTitle}" by ${payload.authorName}`,
          post_id: payload.postId,
          from_name: payload.authorName,
          is_read: false,
        });

        // Send push notification if user is subscribed
        if (vapidPublicKey && vapidPrivateKey) {
          const subscriptions = await base44.asServiceRole.entities.NotificationSubscription.filter({
            user_email: email,
          });
          
          console.log(`[notifyOnNewPost] Found ${subscriptions.length} subscriptions for ${email}`);

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { auth: sub.auth, p256dh: sub.p256dh },
                },
                JSON.stringify({
                  title: 'New message from OSS ACADEMY',
                  body: payload.postTitle,
                  icon: '/logo.png',
                  tag: `post-${payload.postId}`,
                })
              );
              console.log(`[notifyOnNewPost] Push sent to ${email}`);
            } catch (pushErr) {
              console.log(`[notifyOnNewPost] Push failed for ${email}:`, pushErr.message);
            }
          }
        } else {
          console.log(`[notifyOnNewPost] VAPID keys missing, skipping push for ${email}`);
        }
      } catch (err) {
        console.error(`[notifyOnNewPost] Failed to notify ${email}:`, err.message);
      }
    });

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