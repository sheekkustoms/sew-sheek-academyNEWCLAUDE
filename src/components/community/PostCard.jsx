import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Pin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import moment from "moment";

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

export default function PostCard({ post, currentUserEmail, onLike, onClick, index = 0 }) {
   const isLiked = post.likes?.includes(currentUserEmail);
   const likeCount = post.likes?.length || 0;

   // Fetch comments to get commenters
   const { data: comments = [] } = useQuery({
     queryKey: ["postComments", post.id],
     queryFn: () => base44.entities.Comment.filter({ post_id: post.id }),
   });

   // Get unique commenters (by email) - limit to 5
   const commentersMap = new Map();
   comments.forEach(c => {
     if (!commentersMap.has(c.author_email)) {
       commentersMap.set(c.author_email, { email: c.author_email, name: c.author_name });
     }
   });
   const commenters = Array.from(commentersMap.values()).slice(0, 5);

   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.04 }}
       onClick={onClick}
       className={`group bg-white border-2 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer ${
         post.is_pinned ? "border-yellow-400 bg-yellow-50" : "border-yellow-300"
       }`}
     >
       {post.image_url && (
         <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
       )}
       <div className="p-6 space-y-4">
         {/* Header with author and pinned badge */}
         <div className="flex items-start justify-between">
           <div className="flex items-start gap-3">
             {post.author_avatar ? (
               <img src={post.author_avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                 {(post.author_name || post.author_email || "?")[0].toUpperCase()}
               </div>
             )}
             <div>
               <h3 className="font-bold text-gray-900 text-base">{post.author_name || post.author_email}</h3>
               <div className="flex items-center gap-1.5 text-xs text-gray-500">
                 <span>{moment.utc(post.created_date).local().fromNow()}</span>
                 <span>•</span>
                 <span className="capitalize">{post.category?.replace(/_/g, " ")}</span>
               </div>
             </div>
           </div>
           {post.is_pinned && (
             <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
               <Pin className="w-4 h-4" /> Pinned
             </div>
           )}
         </div>

         {/* Title and content */}
         <div>
           <h2 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h2>
           <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
         </div>

         {/* Bottom engagement section */}
         <div className="flex items-center gap-3 pt-3 border-t border-yellow-200">
           <Button
             variant="ghost"
             size="sm"
             className={`h-7 px-2 gap-1 text-xs rounded font-medium ${isLiked ? "text-pink-600" : "text-gray-600 hover:text-pink-600"}`}
             onClick={(e) => { e.stopPropagation(); onLike(post); }}
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
                     <div 
                       key={`c-${i}`} 
                       title={c.name || c.email}
                       className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white"
                     >
                       {(c.name || c.email)[0].toUpperCase()}
                     </div>
                   ))}
                 </div>
                 <span className="text-xs text-blue-600 font-medium">
                   {comments.length > 0 ? `Last comment ${moment(comments[comments.length - 1].created_date).fromNow()}` : ""}
                 </span>
               </>
             )}
           </div>
         </div>
       </div>
     </motion.div>
   );
}