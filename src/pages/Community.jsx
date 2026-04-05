import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CommunityFeed from "../components/community/CommunityFeed";
import CommunitySidebar from "../components/community/CommunitySidebar";
import PostComposer from "../components/community/PostComposer";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import { getDisplayName } from "../components/shared/useDisplayName";

export default function Community() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showComposer, setShowComposer] = useState(false);
  const [openPost, setOpenPost] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: categorySettings = [] } = useQuery({
    queryKey: ["categorySettings"],
    queryFn: () => base44.entities.CategorySettings.list(),
  });
  const dynamicFilters = [
    { value: "all", label: "All" },
    ...((categorySettings[0]?.categories || []).map(c => ({
      value: c.id,
      label: `${c.emoji || ""} ${c.label}`.trim(),
    }))),
  ];
  const isAdmin = user?.role === "admin";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
    refetchInterval: 15000, // refresh every 15s for cross-device sync
    staleTime: 5000,
  });

  const { data: liveClasses = [] } = useQuery({
    queryKey: ["upcomingClassesCommunity"],
    queryFn: () => base44.entities.LiveClass.filter({ is_active: true }),
  });

  const { data: topPoints = [] } = useQuery({
    queryKey: ["topContributors"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 5),
  });

  const { data: userPoints } = useQuery({
    queryKey: ["myPoints", user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myPoints = userPoints?.[0];

  // Filter
  const approvedPosts = posts.filter(p => p.is_approved || isAdmin);
  const pinnedPosts = approvedPosts.filter(p => p.is_pinned);
  const filteredPosts = approvedPosts.filter(p => {
    if (filter !== "all" && p.category !== filter) return false;
    return true;
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const upcomingClasses = liveClasses
    .filter(c => new Date(c.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 3);

  const adminEmailSet = new Set(
    posts.filter(p => p.is_admin_post).map(p => p.author_email)
  );

  // Live name lookup for pinned post author (sidebar)
  const pinnedPostEmail = pinnedPosts[0]?.author_email;
  const { data: pinnedAuthorData } = useQuery({
    queryKey: ["liveAuthorSidebar", pinnedPostEmail],
    queryFn: async () => {
      const result = await base44.functions.invoke('getUserAvatar', { email: pinnedPostEmail });
      return result.data || null;
    },
    enabled: !!pinnedPostEmail,
    staleTime: 60000,
  });
  const pinnedPostWithLiveName = pinnedPosts[0]
    ? { ...pinnedPosts[0], liveAuthorName: pinnedAuthorData?.display_name }
    : null;

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async ({ title, content, category, imageFile, postAsCoach }) => {
      let image_url = null;
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      }
      const displayName = getDisplayName(user);
      const postData = {
        title,
        content,
        category,
        author_email: user.email,
        author_name: postAsCoach ? "COACH" : displayName,
        author_avatar: user.avatar_url || user.data?.avatar_url || null,
        is_admin_post: postAsCoach || false,
        is_approved: true,
        is_pinned: false,
        likes: [],
        comment_count: 0,
        ...(image_url ? { image_url } : {}),
      };
      const created = await base44.entities.CommunityPost.create(postData);

      // Auto-email all members when admin posts
      if (isAdmin) {
        await base44.functions.invoke('sendBroadcastAnnouncement', {
          title: title,
          message: content,
          sendEmail: true,
        });
      }

      // Award XP for posting
      const pts = await getOrCreateUserPoints(user);
      if (pts) {
        await awardXP(pts.id, pts, 10, { posts_created: (pts.posts_created || 0) + 1 });
      }
      return created;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myPoints", user?.email] });
      setShowComposer(false);
      if (!isAdmin) {
        import("sonner").then(({ toast }) => toast.info("Your post is pending approval and will appear once an admin approves it."));
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const likes = post.likes || [];
      const newLikes = likes.includes(user.email)
        ? likes.filter(e => e !== user.email)
        : [...likes, user.email];
      await base44.entities.CommunityPost.update(post.id, { likes: newLikes });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const pinMutation = useMutation({
    mutationFn: (post) => base44.entities.CommunityPost.update(post.id, { is_pinned: !post.is_pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (post) => base44.entities.CommunityPost.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setOpenPost(null);
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111] tracking-tight">Community</h1>
          <p className="text-sm text-[#666] mt-0.5">Connect, share, and grow together</p>
        </div>
        <Button
          onClick={() => setShowComposer(true)}
          className="bg-black hover:bg-[#222] text-[#D4AF37] font-semibold gap-2 rounded-xl h-10 px-5 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-[#EEEEEE] rounded-2xl p-1.5 shadow-sm mb-6 overflow-x-auto">
        {dynamicFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filter === f.value
                ? "bg-black text-[#D4AF37]"
                : "text-[#666] hover:text-[#111] hover:bg-[#F5F5F5]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0">
          <CommunityFeed
            posts={filteredPosts}
            isLoading={isLoading}
            currentUser={user}
            adminEmails={adminEmailSet}
            myPoints={myPoints}
            onLike={(post) => likeMutation.mutate(post)}
            onPin={(post) => pinMutation.mutate(post)}
            onDelete={(post) => deleteMutation.mutate(post)}
            onOpen={setOpenPost}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right sidebar — hidden on mobile */}
        <div className="hidden lg:block w-72 shrink-0">
          <CommunitySidebar
            pinnedPost={pinnedPostWithLiveName}
            upcomingClasses={upcomingClasses}
            topContributors={topPoints}
            onOpenPost={setOpenPost}
          />
        </div>
      </div>

      {/* Post Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-xl p-0 rounded-2xl overflow-hidden border border-gray-200">
          <PostComposer
            user={user}
            isAdmin={isAdmin}
            onSubmit={(data) => createPostMutation.mutate(data)}
            isPending={createPostMutation.isPending}
            onClose={() => setShowComposer(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Post detail / comments drawer */}
      <AnimatePresence>
        {openPost && (
          <PostDetailDrawer
            post={openPost}
            currentUser={user}
            isAdmin={isAdmin}
            adminEmails={adminEmailSet}
            onClose={() => setOpenPost(null)}
            onLike={(post) => likeMutation.mutate(post)}
            onPin={(post) => pinMutation.mutate(post)}
            onDelete={(post) => { deleteMutation.mutate(post); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Post Detail Drawer ────────────────────────────────────────────────────────
import CommentSection from "../components/community/CommentSection";
import AvatarWithFallback from "../components/shared/AvatarWithFallback";
import RelativeTime from "../components/shared/RelativeTime";
import RoleBadge, { getRoleBadgeProps } from "../components/shared/RoleBadge";
import { Heart, MessageCircle, Pin, Trash2 } from "lucide-react";

const OWNER_EMAIL = "sheek24kustoms@gmail.com";

function PostDetailDrawer({ post, currentUser, isAdmin, adminEmails, onClose, onLike, onPin, onDelete }) {
  const isLiked = post.likes?.includes(currentUser?.email);
  const queryClient = useQueryClient();

  const isAdminPost = post.is_admin_post || post.author_email === OWNER_EMAIL;
  const { data: liveAuthor } = useQuery({
    queryKey: ["liveAuthorDrawer", post.author_email],
    queryFn: async () => {
      const result = await base44.functions.invoke('getUserAvatar', { email: post.author_email });
      return result.data || null;
    },
    enabled: !!post.author_email,
    staleTime: 30000,
  });
  const drawerAvatarUrl = liveAuthor?.avatar_url || post.author_avatar;
  const drawerDisplayName = liveAuthor?.display_name || post.author_name || post.author_email;

  // Sync latest post data
  const { data: latestPost } = useQuery({
    queryKey: ["singlePost", post.id],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 500).then(ps => ps.find(p => p.id === post.id) || post),
    initialData: post,
  });
  const p = latestPost || post;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#EEEEEE]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <AvatarWithFallback imageUrl={drawerAvatarUrl} name={p.author_name} email={p.author_email} size="sm" />
            <div>
              <div className="flex items-center gap-1.5 flex-nowrap">
                <p className="text-sm font-bold text-[#111] truncate min-w-0">{drawerDisplayName}</p>
                <RoleBadge role={getRoleBadgeProps(p.is_admin_post, p.is_admin_post)} />
              </div>
              <p className="text-xs text-[#999]"><RelativeTime date={p.created_date} /></p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#CFCFCF] hover:text-[#111] p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-3 space-y-3">
            {p.image_url && (
              <div className="w-full max-w-[420px] mx-auto rounded-xl overflow-hidden aspect-[3/4]">
                <img src={p.image_url} className="w-full h-full object-cover" />
              </div>
            )}
            <h2 className="text-lg font-bold text-[#111] leading-snug">{p.title}</h2>
            <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">{p.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-1 pt-2 border-t border-[#F5F5F5]">
              <button
                className={`h-8 px-3 flex items-center gap-1.5 text-xs rounded-xl font-semibold transition-all ${isLiked ? "text-[#E74C3C] bg-[#E74C3C]/5" : "text-[#666] hover:text-[#E74C3C] hover:bg-[#E74C3C]/5"}`}
                onClick={() => { onLike(p); queryClient.invalidateQueries({ queryKey: ["singlePost", p.id] }); }}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                {p.likes?.length || 0}
              </button>

              {isAdmin && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    className={`h-8 w-8 flex items-center justify-center rounded-xl transition-all ${p.is_pinned ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-[#CFCFCF] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                    onClick={() => { onPin(p); queryClient.invalidateQueries({ queryKey: ["singlePost", p.id] }); }}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-[#CFCFCF] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all"
                    onClick={() => { if (window.confirm("Delete this post?")) { onDelete(p); onClose(); } }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="px-5 pb-6">
            <CommentSection postId={p.id} user={currentUser} isAdmin={isAdmin} adminEmails={adminEmails} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}