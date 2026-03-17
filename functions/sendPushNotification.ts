import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import webpush from 'npm:web-push@3.6.7';

// Configure web-push with your VAPID keys
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:support@ohsewsheek.com', vapidPublicKey, vapidPrivateKey);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { recipientEmail, title, body, type, postId, url, sendToAll } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get subscriptions — all users or just one recipient
    let subscriptions;
    if (sendToAll) {
      subscriptions = await base44.asServiceRole.entities.NotificationSubscription.list();
    } else {
      if (!recipientEmail) {
        return Response.json({ error: 'recipientEmail is required when sendToAll is false' }, { status: 400 });
      }
      subscriptions = await base44.asServiceRole.entities.NotificationSubscription.filter({
        user_email: recipientEmail,
      });
    }

    if (subscriptions.length === 0) {
      return Response.json({ sent: 0, message: 'No active subscriptions' });
    }

    const payload = JSON.stringify({
      title,
      body,
      type,
      post_id: postId,
      url: url || '/',
      id: `notif-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`[sendPushNotification] Sent ${sent} push notifications to ${recipientEmail}, ${failed} failed`);

    return Response.json({ sent, failed });
  } catch (error) {
    console.error('[sendPushNotification]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});