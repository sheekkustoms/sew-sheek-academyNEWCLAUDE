import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only trigger on new user creation
    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const newUser = data;
    if (!newUser?.email) {
      return Response.json({ skipped: true });
    }

    // Send a welcome message from admin
    await base44.asServiceRole.entities.Message.create({
      sender_email: 'sheek24kustoms@gmail.com',
      sender_name: 'Sew Sheek Sewing',
      recipient_email: newUser.email,
      recipient_name: newUser.full_name || newUser.email,
      content: `🎉 Welcome to Sew Sheek Sewing Academy, ${newUser.full_name || 'friend'}!\n\nI'm so excited to have you here! 🪡✨\n\nHere's how to get started:\n📚 Head to the Courses tab to begin your first lesson\n🏆 Earn XP and level up as you learn\n💬 Join the Community to connect with other students\n🎯 Try the Weekly Challenge to test your skills\n\nHappy sewing! 🧵\n– Coach Sheek`,
      is_read: false,
      is_system_message: true,
    });

    // Also send a welcome notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: newUser.email,
      type: 'announcement',
      message: `🎉 Welcome to Sew Sheek Sewing Academy! Check your messages for a note from Coach Sheek.`,
      from_name: 'Sew Sheek Sewing',
      is_read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});