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

  // Get unique commenters (by email)
  const commentersMap = new Map();
  comments.forEach(c => {
    if (!commentersMap.has(c.author_email)) {
      commentersMap.set(c.author_email, { email: c.author_email, name: c.author_name });
    }
  });
  const commenters = Array.from(commentersMap.values());
  
  // Get unique likers
  const uniqueLikers = [...new Set(post.likes || [])].slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer ${
        post.is_pinned ? "border-amber-200 shadow-amber-50 shadow-sm" : "border-gray-100"
      }`}
    >
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
      )}
      {post.is_pinned && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <Pin className="w-4 h-4" /> Pinned
          <button className="ml-auto text-xs hover:text-blue-100">Unpin post</button>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Badge className={`${categoryStyles[post.category] || "bg-gray-100 text-gray-600"} border text-[10px] uppercase tracking-wider`}>
            {categoryEmoji[post.category]} {post.category?.replace(/_/g, " ")}
          </Badge>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {moment(post.created_date).fromNow()}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{post.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>

        <div className="flex items-center gap-1 mt-3">
          {post.author_avatar ? (
            <img src={post.author_avatar} className="w-6 h-6 rounded-full object-cover border border-pink-100" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-[10px] font-bold">
              {(post.author_name || post.author_email || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-500">{post.author_name || post.author_email}</span>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 gap-1.5 text-xs rounded-xl ${isLiked ? "text-pink-500 bg-pink-50 hover:bg-pink-100" : "text-gray-400 hover:text-pink-500 hover:bg-pink-50"}`}
            onClick={(e) => { e.stopPropagation(); onLike(post); }}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
            {likeCount}
          </Button>
          
          <div className="flex items-center gap-2 ml-auto">
             {commenters.length > 0 && (
               <div className="flex -space-x-1.5">
                 {commenters.map((c, i) => (
                   <div key={`c-${i}`} title={c.name} className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-[9px] font-bold border border-white">
                     {(c.name || c.email)[0].toUpperCase()}
                   </div>
                 ))}
               </div>
             )}
             <div className="flex items-center gap-1.5 text-xs text-gray-400">
               <MessageCircle className="w-3.5 h-3.5" />
               {post.comment_count || 0}
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}