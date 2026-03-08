import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Pin, Trash2, CheckCircle, XCircle, Megaphone, BarChart2, Ban, Gamepad2, BookOpen, UserPlus, Copy, Check } from "lucide-react";
import QuizBuilder from "../components/admin/QuizBuilder";
import CourseManager from "../components/admin/CourseManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["adminPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allPoints = [] } = useQuery({
    queryKey: ["adminPoints"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 10),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.CommunityPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPosts"] }),
  });

  const pinPostMutation = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.CommunityPost.update(id, { is_pinned: !pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPosts"] }),
  });

  const approvePostMutation = useMutation({
    mutationFn: ({ id, approved }) => base44.entities.CommunityPost.update(id, { is_approved: !approved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPosts"] }),
  });

  const banUserMutation = useMutation({
    mutationFn: ({ id, banned }) => base44.entities.User.update(id, { is_banned: !banned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CommunityPost.create({
        title: announcementTitle,
        content: announcement,
        author_email: user.email,
        author_name: "Admin",
        category: "announcement",
        is_pinned: true,
        is_approved: true,
        likes: [],
        comment_count: 0,
      });
      const users = await base44.entities.User.list();
      await Promise.all(users.map((u) =>
        base44.entities.Notification.create({
          recipient_email: u.email,
          type: "announcement",
          message: `📢 Admin announcement: ${announcementTitle}`,
          from_name: "Admin",
          is_read: false,
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPosts", "communityPosts"] });
      setAnnouncement("");
      setAnnouncementTitle("");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Shield className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-1">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const postsToday = allPosts.filter((p) => p.created_date?.startsWith(today)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your community</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={allUsers.length} color="bg-blue-500" />
        <StatCard icon={FileText} label="Total Posts" value={allPosts.length} color="bg-violet-500" />
        <StatCard icon={BarChart2} label="Posts Today" value={postsToday} color="bg-pink-500" />
        <StatCard icon={CheckCircle} label="Pending Approval" value={allPosts.filter(p => !p.is_approved).length} color="bg-amber-500" />
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="bg-gray-100 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="announce">Announce</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Members</TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5" /> Quizzes
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Courses
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </TabsTrigger>
        </TabsList>

        {/* Posts moderation */}
        <TabsContent value="posts" className="space-y-3 mt-4">
          {allPosts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm truncate">{post.title}</span>
                  {post.is_pinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">📌 Pinned</Badge>}
                  {!post.is_approved && <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px]">Pending</Badge>}
                </div>
                <p className="text-xs text-gray-400">{post.author_name} · {moment(post.created_date).fromNow()} · {post.category}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.content}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8 text-amber-500 hover:bg-amber-50" onClick={() => pinPostMutation.mutate({ id: post.id, pinned: post.is_pinned })} title={post.is_pinned ? "Unpin" : "Pin"}>
                  <Pin className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className={`w-8 h-8 ${post.is_approved ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`} onClick={() => approvePostMutation.mutate({ id: post.id, approved: post.is_approved })} title={post.is_approved ? "Unapprove" : "Approve"}>
                  {post.is_approved ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-red-500 hover:bg-red-50" onClick={() => deletePostMutation.mutate(post.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-3 mt-4">
          {allUsers.map((u) => (
            <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                  {(u.full_name || u.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.full_name || u.email}</p>
                  <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.is_banned && <Badge className="bg-red-100 text-red-600 text-[10px]">Banned</Badge>}
                {u.email !== user?.email && (
                  <Button size="sm" variant="outline" className={`h-8 text-xs gap-1 ${u.is_banned ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`} onClick={() => banUserMutation.mutate({ id: u.id, banned: u.is_banned })}>
                    <Ban className="w-3 h-3" /> {u.is_banned ? "Unban" : "Ban"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Announcement */}
        <TabsContent value="announce" className="mt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-violet-600 font-semibold mb-2">
              <Megaphone className="w-5 h-5" /> Send Community Announcement
            </div>
            <p className="text-sm text-gray-500">This will create a pinned post AND send a notification to every member.</p>
            <Input
              placeholder="Announcement title..."
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="border-gray-200"
            />
            <Textarea
              placeholder="Write your announcement..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="border-gray-200 min-h-[120px]"
            />
            <Button
              onClick={() => sendAnnouncementMutation.mutate()}
              disabled={!announcementTitle || !announcement || sendAnnouncementMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {sendAnnouncementMutation.isPending ? "Sending..." : "Send to All Members"}
            </Button>
          </div>
        </TabsContent>

        {/* Quiz Builder */}
        <TabsContent value="quizzes" className="mt-4">
          <QuizBuilder />
        </TabsContent>

        {/* Course Manager */}
        <TabsContent value="courses" className="mt-4">
          <CourseManager />
        </TabsContent>

        {/* Top members */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Most Active Members</div>
            {allPoints.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {(entry.user_name || entry.user_email || "?")[0].toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-gray-800">{entry.user_name || entry.user_email}</span>
                <span className="text-sm font-bold text-fuchsia-600">{entry.total_xp || 0} XP</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}