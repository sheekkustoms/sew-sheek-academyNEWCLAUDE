import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, CornerDownRight } from "lucide-react";
import { motion } from "framer-motion";
import RelativeTime from "@/components/shared/RelativeTime";
import { awardXP } from "../shared/useUserPoints";

function useUserAvatars(emails) {
  return useQuery({
    queryKey: ["userAvatars", emails.sort().join(",")],
    queryFn: async () => {
      if (!emails.length) return {};
      const users = await base44.entities.User.list();
      const map = {};
      users.forEach(u => { map[u.email] = u.avatar_url || null; });
      return map;
    },
    enabled: emails.length > 0,
    staleTime: 60000,
  });
}

function CommentAvatar({ email, name, avatarMap }) {
  const avatar = avatarMap?.[email];
  return avatar ? (
    <img src={avatar} className="w-7 h-7 rounded-full object-cover border border-pink-100 shrink-0" />
  ) : (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
      {(name || email || "?")[0].toUpperCase()}
    </div>
  );
}

export default function CommentSection({ postId, user, myPoints }) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();
  const textareaRef = useRef(null);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }),
    enabled: !!postId,
  });

  const commenterEmails = [...new Set(comments.map(c => c.author_email).filter(Boolean))];
  const { data: avatarMap = {} } = useUserAvatars(commenterEmails);

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Comment.create({
        post_id: postId,
        author_email: user.email,
        author_name: user.full_name || user.email,
        content: newComment,
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
            message: `${user.full_name || user.email} commented on your post "${posts[0].title}"`,
            from_name: user.full_name || user.email,
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
              message: `${user.full_name || user.email} replied to your comment on "${posts[0].title}"`,
              from_name: user.full_name || user.email,
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
              message: `${user.full_name || user.email} mentioned you in a comment on "${posts[0].title}"`,
              from_name: user.full_name || user.email,
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
      if (idx > -1) likes.splice(idx, 1);
      else likes.push(user.email);
      await base44.entities.Comment.update(comment.id, { likes });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
  });

  return (
     <div className="space-y-4">
       <h4 className="text-sm font-semibold text-gray-700">Comments ({comments.length})</h4>
       <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
         {comments.map((comment, i) => (
           <motion.div
             key={comment.id}
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.03 }}
             className="flex gap-3"
           >
             <CommentAvatar email={comment.author_email} name={comment.author_name} avatarMap={avatarMap} />
             <div className="flex-1">
               <div className="bg-gray-100 rounded-2xl p-4">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-gray-900 text-sm">{comment.author_name || comment.author_email}</span>
                   <span className="text-gray-500 text-xs">•</span>
                   <RelativeTime date={comment.created_date} />
                 </div>
                 {comment.content.match(/@[\w.+-]+@[\w-]+\.[\w.]+/) && (
                   <div className="mb-2">
                     <span className="text-xs text-blue-600 font-medium">
                       @{comment.content.match(/@([\w.+-]+)@/)?.[1] || comment.content.match(/@[\w.+-]+@[\w-]+\.[\w.]+/)?.[0]}
                     </span>
                   </div>
                 )}
                 <p className="text-gray-800 text-sm leading-relaxed">
                   {comment.content.replace(/@[\w.+-]+@[\w-]+\.[\w.]+\s?/g, "")}
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
               </div>
             </div>
           </motion.div>
         ))}
       </div>
      <div className="flex gap-3 items-end mt-4 pt-4 border-t border-gray-200">
        {user?.avatar_url ? (
          <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(user?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
        )}
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