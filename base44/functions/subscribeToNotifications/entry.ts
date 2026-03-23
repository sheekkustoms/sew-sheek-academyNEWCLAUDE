import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Store subscription for this user
    const storedSubscriptions = await base44.asServiceRole.entities.NotificationSubscription.filter({
      user_email: user.email,
      endpoint: subscription.endpoint,
    });

    if (storedSubscriptions.length === 0) {
      await base44.asServiceRole.entities.NotificationSubscription.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        endpoint: subscription.endpoint,
        auth: subscription.keys?.auth || '',
        p256dh: subscription.keys?.p256dh || '',
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[subscribeToNotifications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});