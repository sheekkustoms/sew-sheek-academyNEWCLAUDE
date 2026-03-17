import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Pin, Trash2, Edit2 } from "lucide-react";
import AvatarWithFallback from "@/components/shared/AvatarWithFallback";
import RelativeTime from "@/components/shared/RelativeTime";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RoleBadge, { getRoleBadgeProps } from "@/components/shared/RoleBadge";

const OWNER_EMAIL = "sheek24kustoms@gmail.com";

const categoryConfig = {
  announcement: { label: "Announcement", bg: "bg-[#E74C3C]/10 text-[#E74C3C]" },
  student_projects: { label: "Win 🏆", bg: "bg-[#2ECC71]/10 text-[#27ae60]" },
  question: { label: "Question", bg: "bg-[#D4AF37]/10 text-[#B8960C]" },
  discussion: { label: "Discussion", bg: "bg-[#111]/5 text-[#444]" },
  resource: { label: "Resource", bg: "bg-[#333]/10 text-[#333]" },
  ask_the_coach: { label: "Ask Coach", bg: "bg-[#D4AF37]/15 text-[#D4AF37]" },
  beginner_help: { label: "Beginner Help", bg: "bg-[#2ECC71]/10 text-[#27ae60]" },
  troubleshooting: { label: "Help", bg: "bg-[#E74C3C]/10 text-[#E74C3C]" },
  showcase: { label: "Showcase", bg: "bg-[#D4AF37]/10 text-[#B8960C]" },
};

export default function CommunityPostCard({ post, currentUser, adminEmails, onLike, onPin, onDelete, onOpen, isAdmin, index = 0, liveAvatarMap = {} }) {
  const isLiked = post.likes?.includes(currentUser?.email);
  const likeCount = post.likes?.length || 0;
  const isAdminPost = post.is_admin_post || adminEmails?.has(post.author_email);
  const isOwner = post.author_email === currentUser?.email;
  const cat = categoryConfig[post.category] || { label: post.category?.replace(/_/g, " "), bg: "bg-gray-100 text-gray-600" };

  // Use post.comment_count (kept in sync by CommentSection mutations)
  const commentCount = post.comment_count || 0;

  // Fetch live user data for admin/owner posts (for role badge)
  const { data: liveAdminUser } = useQuery({
    queryKey: ["adminUser", post.author_email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: post.author_email });
      return users[0] || null;
    },
    enabled: !!(isAdminPost || post.author_email === OWNER_EMAIL),
    staleTime: 300000, // 5 min — role rarely changes
  });

  // Always prefer live avatar from map (fetched fresh for all authors)
  const avatarUrl = liveAvatarMap[post.author_email] || post.author_avatar || null;

  const badgeRole = isAdminPost && liveAdminUser
    ? getRoleBadgeProps(true, liveAdminUser.is_coach === true || post.author_email === OWNER_EMAIL)
    : (isAdminPost && post.author_email === OWNER_EMAIL ? "coach" : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#CFCFCF] transition-all cursor-pointer"
      onClick={() => onOpen?.(post)}
    >
      {post.image_url && (
        <div className="w-full max-w-[420px] mx-auto rounded-xl overflow-hidden aspect-[3/4] mt-4">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarWithFallback imageUrl={avatarUrl} name={post.author_name} email={post.author_email} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                <span className="font-bold text-[#111] text-sm truncate min-w-0">{post.author_name || post.author_email}</span>
                <RoleBadge role={badgeRole} />
              </div>
              <p className="text-xs text-[#999] mt-0.5"><RelativeTime date={post.created_date} /></p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${cat.bg}`}>{cat.label}</span>
            {post.is_pinned && (
              <span className="text-[10px] px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-semibold flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div>
          <h3 className="font-bold text-[#111] text-base mb-1 leading-snug">{post.title}</h3>
          <p className="text-sm text-[#555] leading-relaxed line-clamp-3">{post.content}</p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-1 pt-2 border-t border-[#F5F5F5]" onClick={e => e.stopPropagation()}>
          <button
            className={`h-8 px-3 flex items-center gap-1.5 text-xs rounded-xl font-semibold transition-all ${isLiked ? "text-[#E74C3C] bg-[#E74C3C]/5" : "text-[#999] hover:text-[#E74C3C] hover:bg-[#E74C3C]/5"}`}
            onClick={(e) => { e.stopPropagation(); onLike?.(post); }}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
            {likeCount > 0 ? likeCount : "Like"}
          </button>

          <button
            className="h-8 px-3 flex items-center gap-1.5 text-xs rounded-xl font-semibold text-[#999] hover:text-[#111] hover:bg-[#F5F5F5] transition-all"
            onClick={(e) => { e.stopPropagation(); onOpen?.(post); }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {commentCount > 0 ? `${commentCount}` : "Comment"}
          </button>

          {/* Admin actions */}
          {isAdmin && (
            <div className="ml-auto flex items-center gap-1">
              <button
                className={`h-8 w-8 flex items-center justify-center rounded-xl transition-all ${post.is_pinned ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-[#CFCFCF] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                title={post.is_pinned ? "Unpin" : "Pin to top"}
                onClick={(e) => { e.stopPropagation(); onPin?.(post); }}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-xl text-[#CFCFCF] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all"
                title="Delete post"
                onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this post?")) onDelete?.(post); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!isAdmin && isOwner && (
            <div className="ml-auto">
              <button
                className="h-8 w-8 flex items-center justify-center rounded-xl text-[#CFCFCF] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all"
                onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this post?")) onDelete?.(post); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}