// Triggered when a new Comment is created
// Notifies the original post author that someone commented
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ status: "skipped", reason: "not_create" });
    }

    const comment = data;
    if (!comment?.post_id || !comment?.author_email) {
      return Response.json({ status: "skipped", reason: "missing_fields" });
    }

    // Get the original post
    const posts = await base44.asServiceRole.entities.CommunityPost.filter({ id: comment.post_id });
    const post = posts?.[0];
    if (!post) return Response.json({ status: "skipped", reason: "post_not_found" });

    // Don't notify if commenter is the post author
    if (post.author_email === comment.author_email) {
      return Response.json({ status: "skipped", reason: "self_comment" });
    }

    const commenterName = comment.author_name || "Someone";

    // Create in-app notification for post author
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: post.author_email,
      type: "comment",
      message: `💬 ${commenterName} commented on your post "${post.title}"`,
      from_name: commenterName,
      post_id: comment.post_id,
      is_read: false,
    });

    // Send email if user has replies notifications enabled
    const postAuthorUsers = await base44.asServiceRole.entities.User.filter({ email: post.author_email });
    const postAuthor = postAuthorUsers?.[0];
    if (postAuthor?.notif_community_replies !== false) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: post.author_email,
        subject: `${commenterName} commented on your post`,
        body: `Hi ${postAuthor?.display_name || postAuthor?.full_name || 'there'},\n\n${commenterName} commented on your post "${post.title}":\n\n"${comment.content}"\n\nVisit the community to reply.\n\n— SEW SHEEK ACADEMY`,
      });
    }

    return Response.json({ status: "success" });
  } catch (error) {
    console.error("[notifyOnComment] Error:", error.message);
    return Response.json({ status: "error", error: error.message }, { status: 500 });
  }
});