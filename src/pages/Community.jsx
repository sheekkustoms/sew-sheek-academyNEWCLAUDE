import React, { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "../components/shared/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Users, ImagePlus, Pin, X, Trash2, Activity } from "lucide-react";
import PostCard from "../components/community/PostCard";
import CommentSection from "../components/community/CommentSection";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";
import { getDisplayName } from "../components/shared/useDisplayName";

export default function Community() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "discussion" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

   // Get display name with fallback chain
   const displayName = getDisplayName(user);

  const { data: categorySettings = [] } = useQuery({
    queryKey: ["categorySettings"],
    queryFn: () => base44.entities.CategorySettings.list(),
  });
  const dynamicCategories = categorySettings[0]?.categories || [];
  const SECTIONS = [
    { value: "all", label: "🌐 All Posts" },
    ...dynamicCategories.map(c => ({ value: c.id, label: `${c.emoji || ""} ${c.label}`.trim() })),
  ];
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForAdminCheck"],
    queryFn: () => base44.entities.User.list(),
    staleTime: 60000,
  });
  const adminEmails = new Set(allUsers.filter(u => u.role === "admin").map(u => u.email));
  const { data: myPoints } = useQuery({
    queryKey: ["myPointsCommunity", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
  });

  const { data: allUserPoints = [] } = useQuery({
    queryKey: ["allUserPoints"],
    queryFn: () => base44.entities.UserPoints.list("-last_activity_date", 100),
    refetchInterval: 30000,
  });

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let image_url = "";
      if (imageFile) {
        setUploading(true);
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = result.file_url;
        setUploading(false);
      }
      const createdPost = await base44.entities.CommunityPost.create({
        ...newPost,
        image_url,
        author_email: user.email,
        author_name: displayName,
        author_avatar: user.avatar_url || "",
        likes: [],
        comment_count: 0,
        is_approved: user.role === "admin" ? true : false,
        is_pinned: false,
      });

      console.log("[Community] Post created:", {
        postId: createdPost.id,
        title: newPost.title,
        author: user.email,
        isAdmin: user.role === "admin",
      });

      // Award XP to creator
      if (myPoints) {
        await awardXP(myPoints.id, myPoints, 15, { posts_created: (myPoints.posts_created || 0) + 1 });
      }

      // Notify all users if this is an admin post
      if (user.role === "admin") {
        console.log("[Community] Triggering notifications for admin post...");
        try {
          const notifyResult = await base44.functions.invoke('notifyOnNewPost', {
            postId: createdPost.id,
            postTitle: newPost.title,
            authorEmail: user.email,
            authorName: displayName,
            isAnnouncement: true,
          });
          console.log("[Community] Notification result:", notifyResult.data);
        } catch (notifyErr) {
          console.error("[Community] Failed to send notifications:", notifyErr);
        }
      }

      return createdPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myPointsCommunity", "myPoints"] });
      setShowCreateDialog(false);
      setNewPost({ title: "", content: "", category: "discussion" });
      setImageFile(null);
      setImagePreview(null);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const likes = [...(post.likes || [])];
      const idx = likes.indexOf(user.email);
      const isNewLike = idx === -1;
      if (idx > -1) likes.splice(idx, 1);
      else likes.push(user.email);
      await base44.entities.CommunityPost.update(post.id, { likes });
      if (isNewLike && post.author_email !== user.email) {
        await base44.entities.Notification.create({
          recipient_email: post.author_email,
          type: "like",
          message: `${displayName} liked your post "${post.title}"`,
          from_name: displayName,
          post_id: post.id,
          is_read: false,
        });
      }
    },
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ["communityPosts"] });
      const previous = queryClient.getQueryData(["communityPosts"]);
      queryClient.setQueryData(["communityPosts"], (old = []) =>
        old.map((p) => {
          if (p.id !== post.id) return p;
          const likes = [...(p.likes || [])];
          const idx = likes.indexOf(user.email);
          if (idx > -1) likes.splice(idx, 1);
          else likes.push(user.email);
          return { ...p, likes };
        })
      );
      return { previous };
    },
    onError: (_err, _post, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["communityPosts"], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: async (post) => {
      await base44.entities.CommunityPost.delete(post.id);
      const comments = await base44.entities.Comment.filter({ post_id: post.id });
      await Promise.all(comments.map(c => base44.entities.Comment.delete(c.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setSelectedPost(null);
    },
  });

  const deleteCommentFromPostMutation = useMutation({
    mutationFn: async (commentId, postId) => {
      await base44.entities.Comment.delete(commentId);
      const posts = await base44.entities.CommunityPost.filter({ id: postId });
      if (posts[0]) {
        await base44.entities.CommunityPost.update(postId, { comment_count: Math.max((posts[0].comment_count || 1) - 1, 0) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  // Sort: pinned first, then by date
   const filteredAndSorted = posts
     .filter((p) => p.is_approved !== false)
     .filter((p) => {
       const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase());
       const matchSection = section === "all" || p.category === section;
       return matchSearch && matchSection;
     })
     .sort((a, b) => {
       if (a.is_pinned && !b.is_pinned) return -1;
       if (!a.is_pinned && b.is_pinned) return 1;
       return new Date(b.created_date) - new Date(a.created_date);
     });

   // Auto-select most recent post on load
   React.useEffect(() => {
     if (filteredAndSorted.length > 0 && !selectedPost) {
       setSelectedPost(filteredAndSorted[0]);
     }
   }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    await queryClient.refetchQueries({ queryKey: ["communityPosts"] });
  }, [queryClient]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Community</h1>
          <p className="text-lg text-gray-600 mt-2">Connect, share, and grow together</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-green-800 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sections sidebar */}
        <div className="lg:w-52 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-1 sticky top-20">
              {SECTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSection(s.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    section === s.value
                      ? "bg-green-700 text-white border border-green-800"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        {/* Posts feed */}
         <div className="flex-1 space-y-4">
          <div className="relative bg-white rounded-lg p-2 shadow-sm">
            <Search className="absolute left-6 top-5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg"
            />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-lg h-32 animate-pulse border border-gray-200" />)}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No posts here yet</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to share!</p>
            </div>
          ) : (
            filteredAndSorted.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={user?.email}
                onLike={(p) => likeMutation.mutate(p)}
                onClick={() => setSelectedPost(post)}
                index={i}
                isAdminPost={adminEmails.has(post.author_email)}
                isAdmin={user?.role === "admin"}
              />
            ))
          )}
        </div>
      </div>

      {/* Create post dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Create a Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Post title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="border-gray-200 h-10"
            />
            <Textarea
              placeholder="What's on your mind?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="border-gray-200 min-h-[120px]"
            />
            <Select value={newPost.category} onValueChange={(v) => setNewPost({ ...newPost, category: v })}>
              <SelectTrigger className="border-gray-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.filter(s => s.value !== "all").map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Image upload */}
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} className="w-full rounded-lg object-cover max-h-40" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-green-600 hover:text-gray-900 transition-colors">
                <ImagePlus className="w-4 h-4" /> Add an image (optional)
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-200">Cancel</Button>
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={!newPost.title || !newPost.content || createPostMutation.isPending || uploading}
                className="bg-green-800 hover:bg-green-700 text-white font-medium"
              >
                {uploading || createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post detail */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900">{selectedPost.title}</DialogTitle>
              </DialogHeader>
              {selectedPost.image_url && (
                <img src={selectedPost.image_url} className="w-full rounded-lg object-cover max-h-60 mb-4" />
              )}
              <p className="text-base text-gray-700 mb-4">{selectedPost.content}</p>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-500">
                  by {selectedPost.author_name || selectedPost.author_email} · {new Date(selectedPost.created_date).toLocaleDateString()}
                  {selectedPost.is_pinned && <span className="ml-2 text-yellow-600">📌 Pinned</span>}
                </p>
                {(selectedPost.author_email === user?.email || user?.role === "admin") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-xs"
                    onClick={() => {
                      if (window.confirm(`Delete this post${user?.role === "admin" && selectedPost.author_email !== user?.email ? " (admin action)" : ""}?`)) deletePostMutation.mutate(selectedPost);
                    }}
                    disabled={deletePostMutation.isPending}
                    title={user?.role === "admin" && selectedPost.author_email !== user?.email ? "Admin: delete any post" : "Delete"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <CommentSection postId={selectedPost.id} user={user} myPoints={myPoints} isAdmin={user?.role === "admin"} adminEmails={adminEmails} />
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PullToRefresh>
  );
}