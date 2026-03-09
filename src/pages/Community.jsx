import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Users, ImagePlus, Pin, X } from "lucide-react";
import PostCard from "../components/community/PostCard";
import CommentSection from "../components/community/CommentSection";
import { getOrCreateUserPoints, awardXP } from "../components/shared/useUserPoints";

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
  const { data: myPoints } = useQuery({
    queryKey: ["myPointsCommunity", user?.email],
    queryFn: () => getOrCreateUserPoints(user),
    enabled: !!user?.email,
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
     await base44.entities.CommunityPost.create({
       ...newPost,
       image_url,
       author_email: user.email,
       author_name: user.full_name || user.email,
       author_avatar: user.avatar_url || "",
       likes: [],
       comment_count: 0,
       is_approved: user.role === "admin" ? true : false,
       is_pinned: false,
     });
      if (myPoints) {
        await awardXP(myPoints.id, myPoints, 15, { posts_created: (myPoints.posts_created || 0) + 1 });
      }
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
      // Notify post author
      if (isNewLike && post.author_email !== user.email) {
        await base44.entities.Notification.create({
          recipient_email: post.author_email,
          type: "like",
          message: `${user.full_name || user.email} liked your post "${post.title}"`,
          from_name: user.full_name || user.email,
          post_id: post.id,
          is_read: false,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Community</h1>
          <p className="text-lg text-gray-600 mt-2">Connect, share, and grow together</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
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
                      ? "bg-yellow-50 text-gray-900 border border-yellow-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        {/* Posts feed */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl"
            />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />)}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No posts here yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to post!</p>
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
              />
            ))
          )}
        </div>
      </div>

      {/* Create post dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create a Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="border-gray-200"
            />
            <Textarea
              placeholder="What's on your mind?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="border-gray-200 min-h-[120px]"
            />
            <Select value={newPost.category} onValueChange={(v) => setNewPost({ ...newPost, category: v })}>
              <SelectTrigger className="border-gray-200">
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
                <img src={imagePreview} className="w-full rounded-xl object-cover max-h-40" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer border border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-violet-300 hover:text-violet-500 transition-colors">
                <ImagePlus className="w-4 h-4" /> Add an image (optional)
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={!newPost.title || !newPost.content || createPostMutation.isPending || uploading}
                className="bg-gradient-to-r from-pink-500 to-violet-500 text-white"
              >
                {uploading || createPostMutation.isPending ? "Posting..." : "Post (+15 XP)"}
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
                <DialogTitle className="text-gray-900">{selectedPost.title}</DialogTitle>
              </DialogHeader>
              {selectedPost.image_url && (
                <img src={selectedPost.image_url} className="w-full rounded-xl object-cover max-h-60 mb-2" />
              )}
              <p className="text-sm text-gray-600 mb-2">{selectedPost.content}</p>
              <p className="text-xs text-gray-400 mb-4">
                by {selectedPost.author_name || selectedPost.author_email} · {new Date(selectedPost.created_date).toLocaleDateString()}
                {selectedPost.is_pinned && <span className="ml-2 text-amber-500">📌 Pinned</span>}
              </p>
              <CommentSection postId={selectedPost.id} user={user} myPoints={myPoints} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}