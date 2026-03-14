import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, CornerDownRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import RelativeTime from "@/components/shared/RelativeTime";
import { awardXP } from "../shared/useUserPoints";
import { getDisplayName } from "../shared/useDisplayName";
import AvatarWithFallback from "../shared/AvatarWithFallback";
import RoleBadge, { getRoleBadgeProps } from "../shared/RoleBadge";

function useCommentAuthorAvatars(comments) {
  const emailsNeedingAvatars = comments
    .filter(c => !c.author_avatar && c.author_email)
    .map(c => c.author_email);

  return useQuery({
    queryKey: ["commentAvatars", emailsNeedingAvatars.sort().join(",")],
    queryFn: async () => {
      if (!emailsNeedingAvatars.length) return {};
      const map = {};
      await Promise.all(
        emailsNeedingAvatars.map(async (email) => {
          const result = await base44.functions.invoke('getUserAvatar', { email });
          map[email] = result.data.avatar_url;
        })
      );
      return map;
    },
    enabled: emailsNeedingAvatars.length > 0,
    staleTime: 60000,
  });
}

function CommentAvatar({ email, name, avatarUrl, fallbackAvatarMap }) {
   const displayUrl = avatarUrl || fallbackAvatarMap?.[email];
   return (
     <AvatarWithFallback
       imageUrl={displayUrl}
       name={name}
       email={email}
       size="sm"
     />
   );
 }

export default function CommentSection({ postId, user, myPoints, isAdmin = false, adminEmails = new Set() }) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();
  const textareaRef = useRef(null);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }),
    enabled: !!postId,
  });

  // Get avatars for comments missing them
  const { data: fallbackAvatarMap = {} } = useCommentAuthorAvatars(comments);

  // Get current user's display_name with fallback chain
    const userDisplayName = getDisplayName(user);



  // Group comments: separate top-level from replies
  const topLevelComments = comments.filter(c => !c.content.match(/^@[^@\n]+\s/));
  const replies = comments.filter(c => c.content.match(/^@[^@\n]+\s/));
  
  // Create a map of which comment each reply is responding to
  const replyMap = {};
  replies.forEach(reply => {
    const mentionMatch = reply.content.match(/^@([^@\n]+?)\s/);
    if (mentionMatch) {
      const mentionedName = mentionMatch[1];
      const parentComment = comments.find(c => (c.author_name || c.author_email) === mentionedName && !c.content.match(/^@[^@\n]+\s/));
      if (parentComment) {
        if (!replyMap[parentComment.id]) replyMap[parentComment.id] = [];
        replyMap[parentComment.id].push(reply);
      }
    }
  });

  const addCommentMutation = useMutation({
   mutationFn: async () => {
     // When replying, update the mention to use the current display_name
     let commentContent = newComment;
     if (replyingTo) {
       const repliedToComment = comments.find(c => (c.author_name || c.author_email) === replyingTo);
       if (repliedToComment) {
         const currentDisplayName = repliedToComment.author_email === user.email ? userDisplayName : repliedToComment.author_name;
         commentContent = newComment.replace(/^@[^\s]+/, `@${currentDisplayName}`);
       }
     }

     await base44.entities.Comment.create({
       post_id: postId,
       author_email: user.email,
       author_name: userDisplayName,
       author_avatar: user.avatar_url || null,
       content: commentContent,
       likes: [],
     });
     const posts = await base44.entities.CommunityPost.filter({ id: postId });
     if (posts[0]) {
       await base44.entities.CommunityPost.update(postId, { comment_count: (posts[0].comment_count || 0) + 1 });

       // Notify post author (if not replying to them)
       if (posts[0].author_email !== user.email && !replyingTo) {
         await base44.entities.Notification.create({
           recipient_email: posts[0].author_email,
           type: "comment",
           message: `${userDisplayName} commented on your post "${posts[0].title}"`,
           from_name: userDisplayName,
           post_id: postId,
           is_read: false,
         });
       }

       // Notify the person being replied to
       if (replyingTo) {
         const repliedToComment = comments.find(c => (c.author_name || c.author_email) === replyingTo);
         if (repliedToComment && repliedToComment.author_email !== user.email) {
           await base44.entities.Notification.create({
             recipient_email: repliedToComment.author_email,
             type: "reply",
             message: `${userDisplayName} replied to your comment on "${posts[0].title}"`,
             from_name: userDisplayName,
             post_id: postId,
             is_read: false,
           });
         }
       }

       // Detect @mentions and notify mentioned users
       const mentions = newComment.match(/@([\w.+-]+@[\w-]+\.[\w.]+)/g);
       if (mentions) {
         const uniqueMentions = [...new Set(mentions.map(m => m.slice(1)))];
         await Promise.all(uniqueMentions
           .filter(email => email !== user.email && email !== posts[0].author_email && (!replyingTo || email !== comments.find(c => (c.author_name || c.author_email) === replyingTo)?.author_email))
           .map(email => base44.entities.Notification.create({
             recipient_email: email,
             type: "reply",
             message: `${userDisplayName} mentioned you in a comment on "${posts[0].title}"`,
             from_name: userDisplayName,
             post_id: postId,
             is_read: false,
           }))
         );
       }
     }
     if (myPoints) {
       await awardXP(myPoints.id, myPoints, 5, { comments_made: (myPoints.comments_made || 0) + 1 });
     }
   },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myPointsCommunity", "myPoints"] });
      setNewComment("");
      setReplyingTo(null);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (comment) => {
      const likes = [...(comment.likes || [])];
      const idx = likes.indexOf(user.email);
      const isNewLike = idx === -1;
      if (idx > -1) likes.splice(idx, 1);
      else likes.push(user.email);
      await base44.entities.Comment.update(comment.id, { likes });

      // Award 2 XP to liker if liking
      if (isNewLike && myPoints) {
        await awardXP(myPoints.id, myPoints, 2);
      }

      // Award 2 XP to comment author if being liked
      if (isNewLike) {
        const authorPoints = await base44.entities.UserPoints.filter({ user_email: comment.author_email });
        if (authorPoints[0]) {
          await awardXP(authorPoints[0].id, authorPoints[0], 2);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["myPoints"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (comment) => {
      await base44.entities.Comment.delete(comment.id);
      const posts = await base44.entities.CommunityPost.filter({ id: postId });
      if (posts[0]) {
        await base44.entities.CommunityPost.update(postId, { comment_count: Math.max((posts[0].comment_count || 1) - 1, 0) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  return (
     <div className="space-y-4">
       <h4 className="text-sm font-semibold text-gray-700">Comments ({comments.length})</h4>
       <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
         {topLevelComments.map((comment, i) => (
           <div key={comment.id}>
             <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.03 }}
               className="flex gap-3"
             >
               <CommentAvatar email={comment.author_email} name={comment.author_name} avatarUrl={comment.author_avatar} fallbackAvatarMap={fallbackAvatarMap} />
               <div className="flex-1">
                 <div className="bg-gray-100 rounded-2xl p-4">
                   <div className="flex items-center gap-1.5 flex-nowrap mb-1">
                     <span className="font-bold text-gray-900 text-sm truncate min-w-0">{comment.author_name || comment.author_email}</span>
                     {adminEmails.has(comment.author_email) && <RoleBadge role={getRoleBadgeProps(true, comment.author_email, user?.email)} />}
                     <span className="text-gray-400 text-xs shrink-0">•</span>
                     <RelativeTime date={comment.created_date} />
                   </div>
                   <p className="text-gray-800 text-sm leading-relaxed">
                     {comment.content}
                   </p>
                 </div>
                 <div className="flex items-center gap-4 mt-2 ml-0 text-xs text-gray-600">
                   <button
                     onClick={() => likeCommentMutation.mutate(comment)}
                     className={`flex items-center gap-1 transition-colors ${
                       comment.likes?.includes(user?.email) ? "text-pink-500" : "text-gray-400 hover:text-pink-500"
                     }`}
                   >
                     <Heart className={`w-3.5 h-3.5 ${comment.likes?.includes(user?.email) ? "fill-current" : ""}`} />
                     {comment.likes?.length || 0}
                   </button>
                   <button
                     onClick={() => {
                       const name = comment.author_name || comment.author_email;
                       setReplyingTo(name);
                       setNewComment(`@${name} `);
                       setTimeout(() => textareaRef.current?.focus(), 50);
                     }}
                     className="text-gray-400 hover:text-gray-600 transition-colors font-medium"
                   >
                     Reply
                   </button>
                   {(comment.author_email === user?.email || isAdmin) && (
                     <button
                       onClick={() => {
                         if (window.confirm(`Delete this comment${isAdmin && comment.author_email !== user?.email ? " (admin action)" : ""}?`)) deleteCommentMutation.mutate(comment);
                       }}
                       disabled={deleteCommentMutation.isPending}
                       className="text-gray-400 hover:text-red-600 transition-colors font-medium ml-auto"
                       title={isAdmin && comment.author_email !== user?.email ? "Admin: delete any comment" : "Delete"}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   )}
                 </div>
               </div>
             </motion.div>

             {/* Replies to this comment */}
             {replyMap[comment.id] && (
               <div className="ml-10 space-y-2 mt-2">
                 {replyMap[comment.id].map((reply, j) => {
                   const mentionMatch = reply.content.match(/^@([^@\n]+?)\s/);
                   const mentionedName = mentionMatch ? mentionMatch[1] : '';
                   const replyContent = reply.content.replace(/^@[^@\n]+?\s/, "");

                   return (
                     <motion.div
                       key={reply.id}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.03 + j * 0.02 }}
                       className="flex gap-3"
                     >
                       <CommentAvatar email={reply.author_email} name={reply.author_name} avatarUrl={reply.author_avatar} fallbackAvatarMap={fallbackAvatarMap} />
                       <div className="flex-1">
                         <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                           <div className="flex items-center gap-1.5 flex-nowrap mb-2">
                             <span className="font-bold text-gray-900 text-sm truncate min-w-0">{reply.author_name || reply.author_email}</span>
                             {adminEmails.has(reply.author_email) && <RoleBadge role={getRoleBadgeProps(true, reply.author_email, user?.email)} />}
                             <span className="text-gray-400 text-xs shrink-0">•</span>
                             <RelativeTime date={reply.created_date} />
                           </div>
                           <div className="mb-2">
                             <span className="text-blue-600 font-semibold">@{mentionedName}</span>
                             <span className="text-gray-800"> {replyContent}</span>
                           </div>
                         </div>
                         <div className="flex items-center gap-4 mt-2 ml-0 text-xs text-gray-600">
                           <button
                             onClick={() => likeCommentMutation.mutate(reply)}
                             className={`flex items-center gap-1 transition-colors ${
                               reply.likes?.includes(user?.email) ? "text-pink-500" : "text-gray-400 hover:text-pink-500"
                             }`}
                           >
                             <Heart className={`w-3.5 h-3.5 ${reply.likes?.includes(user?.email) ? "fill-current" : ""}`} />
                             {reply.likes?.length || 0}
                           </button>
                           {(reply.author_email === user?.email || isAdmin) && (
                             <button
                               onClick={() => {
                                 if (window.confirm(`Delete this comment${isAdmin && reply.author_email !== user?.email ? " (admin action)" : ""}?`)) deleteCommentMutation.mutate(reply);
                               }}
                               disabled={deleteCommentMutation.isPending}
                               className="text-gray-400 hover:text-red-600 transition-colors font-medium ml-auto"
                               title={isAdmin && reply.author_email !== user?.email ? "Admin: delete any comment" : "Delete"}
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
               </div>
             )}
           </div>
         ))}
       </div>
      <div className="flex gap-3 items-end mt-4 pt-4 border-t border-gray-200">
        <AvatarWithFallback
          imageUrl={user?.avatar_url}
          name={user?.full_name}
          email={user?.email}
          size="sm"
        />
        <div className="flex-1 space-y-1">
          {replyingTo && (
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
              Replying to @{replyingTo}
              <button onClick={() => { setReplyingTo(null); setNewComment(""); }} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">Clear</button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border-gray-300 text-sm bg-white rounded-xl min-h-[44px] resize-none"
            />
            <Button
              onClick={() => addCommentMutation.mutate()}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}