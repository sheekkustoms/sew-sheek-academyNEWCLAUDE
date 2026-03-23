import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Configure web-push with VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:test@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get user's subscription
    const subscriptions = await base44.asServiceRole.entities.NotificationSubscription.filter({
      user_email: user.email,
    });

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'No subscription found. Install the app first.' }, { status: 404 });
    }

    const subscription = subscriptions[0];
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.auth,
        p256dh: subscription.p256dh,
      },
    };

    // Send test notification
    const payload = JSON.stringify({
      title: '🎉 Test Notification',
      body: 'Your push notifications are working! Enjoy Oh Sew Sheek.',
      icon: '/logo.png',
      tag: 'test-notification',
    });

    await webpush.sendNotification(pushSubscription, payload);

    console.log('[sendTestNotification] Test notification sent to:', user.email);

    return Response.json({
      success: true,
      message: 'Test notification sent successfully',
      userEmail: user.email,
    });
  } catch (error) {
    console.error('[sendTestNotification] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});