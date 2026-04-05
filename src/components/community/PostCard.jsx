import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Pin, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import RelativeTime from "@/components/shared/RelativeTime";
import AvatarWithFallback from "@/components/shared/AvatarWithFallback";
import { awardXP } from "@/components/shared/useUserPoints";

function useCommenterAvatars(comments) {
  const emailsNeedingAvatars = comments
    .filter(c => !c.author_avatar && c.author_email)
    .map(c => c.author_email);

  return useQuery({
    queryKey: ["commenterAvatars", emailsNeedingAvatars.sort().join(",")],
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

const categoryStyles = {
  discussion: "bg-blue-100 text-blue-600 border-blue-200",
  question: "bg-amber-100 text-amber-600 border-amber-200",
  showcase: "bg-purple-100 text-purple-600 border-purple-200",
  resource: "bg-emerald-100 text-emerald-600 border-emerald-200",
  announcement: "bg-red-100 text-red-600 border-red-200",
  beginner_help: "bg-green-100 text-green-600 border-green-200",
  troubleshooting: "bg-orange-100 text-orange-600 border-orange-200",
  student_projects: "bg-pink-100 text-pink-600 border-pink-200",
  ask_the_coach: "bg-cyan-100 text-cyan-600 border-cyan-200",
};

const categoryEmoji = {
  announcement: "📢", discussion: "💬", beginner_help: "🌱",
  troubleshooting: "🔧", student_projects: "🎨", ask_the_coach: "🙋",
  question: "❓", showcase: "✨", resource: "📚",
};

export default function PostCard({ post, currentUserEmail, onLike, onClick, index = 0, isAdminPost = false, adminAvatarUrl = null, isAdmin = false, currentUserPoints = null }) {
   const isAdminPostFinal = isAdminPost || post.is_admin_post === true;
   const isLiked = post.likes?.includes(currentUserEmail);
   const likeCount = post.likes?.length || 0;
   const queryClient = useQueryClient();

   // Always fetch the latest avatar for admin posts directly
   const { data: liveAdminUser } = useQuery({
     queryKey: ["adminUser", post.author_email],
     queryFn: async () => {
       const users = await base44.entities.User.filter({ email: post.author_email });
       return users[0] || null;
     },
     enabled: isAdminPostFinal,
     staleTime: 30000,
   });
   const resolvedAvatarUrl = isAdminPostFinal
     ? (liveAdminUser?.avatar_url || adminAvatarUrl || post.author_avatar || null)
     : post.author_avatar;

   // Fetch comments to get commenters
   const { data: comments = [] } = useQuery({
     queryKey: ["postComments", post.id],
     queryFn: () => base44.entities.Comment.filter({ post_id: post.id }),
     staleTime: 0,
   });

   // Fetch missing avatars for commenters
   const { data: fallbackAvatarMap = {} } = useCommenterAvatars(comments);

   // Sort comments by created_date descending to get the actual last comment
   const sortedComments = [...comments].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

   // Get unique commenters (by email) - limit to 5
   const commentersMap = new Map();
   comments.forEach(c => {
     if (!commentersMap.has(c.author_email)) {
       commentersMap.set(c.author_email, {
         email: c.author_email,
         name: c.author_name,
         avatarUrl: c.author_avatar || fallbackAvatarMap[c.author_email] || null,
       });
     }
   });
   const commenters = Array.from(commentersMap.values()).slice(0, 5);

   const deletePostMutation = useMutation({
     mutationFn: async () => {
       await base44.entities.CommunityPost.delete(post.id);
       await base44.entities.Comment.filter({ post_id: post.id }).then(comments => 
         Promise.all(comments.map(c => base44.entities.Comment.delete(c.id)))
       );
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
     },
   });

   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.04 }}
       onClick={onClick}
       style={isAdminPostFinal
         ? { backgroundColor: "#fae8eb", borderColor: "#c9a0b4", border: "2px solid #c9a0b4" }
         : { backgroundColor: "#ffffff", border: "2px solid #16a34a" }}
       className="group rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
     >
       {post.image_url && (
         <img src={post.image_url} alt="" className="w-full object-contain bg-black" />
       )}
       <div className="p-6 space-y-4">
         {/* Header with author and pinned badge */}
         <div className="flex items-start justify-between">
           <div className="flex items-start gap-3">
             <AvatarWithFallback
               imageUrl={resolvedAvatarUrl}
               name={post.author_name}
               email={post.author_email}
               size="md"
             />
             <div>
               <h3 className="font-bold text-gray-900 text-base">{isAdminPostFinal ? "👑 " : ""}{post.author_name || post.author_email}</h3>
               <div className="flex items-center gap-1.5 text-xs text-gray-500">
                 <span>{moment.utc(post.created_date).local().fromNow()}</span>
                 <span>•</span>
                 <span className="capitalize">{post.category?.replace(/_/g, " ")}</span>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-2">
             {post.is_pinned && (
               <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                 <Pin className="w-4 h-4" /> Pinned
               </div>
             )}
             {(post.author_email === currentUserEmail || isAdmin) && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-7 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-xs"
                 onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete this post${isAdmin && post.author_email !== currentUserEmail ? " (admin action)" : ""}?`)) deletePostMutation.mutate(); }}
                 disabled={deletePostMutation.isPending}
                 title={isAdmin && post.author_email !== currentUserEmail ? "Admin: delete any post" : "Delete"}
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </Button>
             )}
           </div>
         </div>

         {/* Title and content */}
         <div>
           <h2 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h2>
           <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
         </div>

         {/* Bottom engagement section */}
         <div className="flex items-center gap-3 pt-3 border-t border-pink-200">
           <Button
             variant="ghost"
             size="sm"
             className={`h-7 px-2 gap-1 text-xs rounded font-medium ${isLiked ? "text-pink-600" : "text-gray-600 hover:text-pink-600"}`}
             onClick={(e) => { 
               e.stopPropagation(); 
               onLike(post);
               // Award 2 XP to liker if not already liked
               if (!isLiked && currentUserPoints) {
                 awardXP(currentUserPoints.id, currentUserPoints, 2);
               }
               // Award 2 XP to post author
               base44.entities.UserPoints.filter({ user_email: post.author_email }).then(authorPoints => {
                 if (authorPoints[0]) {
                   awardXP(authorPoints[0].id, authorPoints[0], 2);
                 }
               });
             }}
           >
             <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
             {likeCount}
           </Button>

           <Button
             variant="ghost"
             size="sm"
             className="h-7 px-2 gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium rounded"
             onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
           >
             <MessageCircle className="w-3.5 h-3.5" />
             {post.comment_count || 0}
           </Button>

           {/* Commenter avatars and last comment time */}
           <div className="ml-auto flex items-center gap-2">
             {commenters.length > 0 && (
               <>
                 <div className="flex -space-x-2">
                   {commenters.map((c, i) => (
                     <div key={`c-${i}`} className="border-2 border-white rounded-full">
                       <AvatarWithFallback
                         imageUrl={c.avatarUrl}
                         name={c.name}
                         email={c.email}
                         size="xs"
                         className="border-0"
                       />
                     </div>
                   ))}
                 </div>
                 {sortedComments.length > 0 && (
                   <span className="text-xs text-blue-600 font-medium">
                     Last comment <RelativeTime date={sortedComments[0].created_date} />
                   </span>
                 )}
               </>
             )}
           </div>
         </div>
       </div>
     </motion.div>
   );
}