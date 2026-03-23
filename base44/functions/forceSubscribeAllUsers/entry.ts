import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Get all current subscriptions
    const allSubs = await base44.asServiceRole.entities.NotificationSubscription.list();
    const subscribedEmails = new Set(allSubs.map(s => s.user_email));
    
    // Find unsubscribed users
    const unsubscribedUsers = allUsers.filter(u => !subscribedEmails.has(u.email));
    
    console.log(`[forceSubscribeAllUsers] Total users: ${allUsers.length}, Subscribed: ${subscribedEmails.size}, Unsubscribed: ${unsubscribedUsers.length}`);
    
    // Send notification to unsubscribed users asking them to enable notifications
    const notifPromises = unsubscribedUsers.map(u => 
      base44.asServiceRole.entities.Notification.create({
        recipient_email: u.email,
        type: 'announcement',
        message: '📬 Please enable notifications! Go to Home → look for the notification permission prompt to stay updated.',
        from_name: 'System',
        is_read: false,
      }).catch(err => console.log(`Failed to notify ${u.email}:`, err.message))
    );
    
    await Promise.all(notifPromises);
    
    return Response.json({
      status: 'success',
      totalUsers: allUsers.length,
      subscribed: subscribedEmails.size,
      unsubscribed: unsubscribedUsers.length,
      notificationsQueued: unsubscribedUsers.length,
    });
  } catch (error) {
    console.error('[forceSubscribeAllUsers] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});