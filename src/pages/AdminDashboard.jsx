import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Pin, Trash2, CheckCircle, XCircle, Megaphone, BarChart2, Ban, Gamepad2, BookOpen, UserPlus, Copy, Check, Brain, Video, Zap, Tags, Mail, Bell, UserX, Star } from "lucide-react";
import QuizBuilder from "../components/admin/QuizBuilder";
import CourseManager from "../components/admin/CourseManager";
import WeeklyChallengeManager from "../components/admin/WeeklyChallengeManager";
import LiveClassManager from "../components/admin/LiveClassManager";
import LevelSettingsManager from "../components/admin/LevelSettingsManager";
import CategoryManager from "../components/admin/CategoryManager";
import MessagingPanel from "../components/admin/MessagingPanel";
import RewardPointsPanel from "../components/admin/RewardPointsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-200 transition-all" : ""}`}
      onClick={onClick}
    >
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
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteResults, setInviteResults] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [adminMessagingEnabled, setAdminMessagingEnabled] = useState({});
  const [activeTab, setActiveTab] = useState("posts");
  const [forceSubLoading, setForceSubLoading] = useState(false);
  const [editingPoints, setEditingPoints] = useState({});
  const [xpToAdd, setXpToAdd] = useState({});

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

  const { data: allUserPoints = [] } = useQuery({
    queryKey: ["adminAllUserPoints"],
    queryFn: () => base44.entities.UserPoints.list("-last_activity_date", 200),
  });

  const { data: invitedEmails = [] } = useQuery({
    queryKey: ["invitedEmails"],
    queryFn: () => base44.entities.InvitedEmail.list("-created_date", 200),
  });

  const { data: allEnrollments = [] } = useQuery({
    queryKey: ["adminEnrollments"],
    queryFn: () => base44.entities.Enrollment.list("-updated_date", 500),
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["adminComments"],
    queryFn: () => base44.entities.Comment.list("-created_date", 500),
  });

  const { data: allCommunityPosts = [] } = useQuery({
    queryKey: ["adminCommunityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 500),
  });

  const userPointsMap = useMemo(() => {
    const map = {};
    allUserPoints.forEach(p => { map[p.user_email] = p; });
    return map;
  }, [allUserPoints]);

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

  const removeUserMutation = useMutation({
    mutationFn: async (u) => {
      // Delete all user data across entities
      const [posts, comments, points, enrollments] = await Promise.all([
        base44.entities.CommunityPost.filter({ author_email: u.email }),
        base44.entities.Comment.filter({ author_email: u.email }),
        base44.entities.UserPoints.filter({ user_email: u.email }),
        base44.entities.Enrollment.filter({ user_email: u.email }),
      ]);
      await Promise.all([
        ...posts.map(p => base44.entities.CommunityPost.delete(p.id)),
        ...comments.map(c => base44.entities.Comment.delete(c.id)),
        ...points.map(p => base44.entities.UserPoints.delete(p.id)),
        ...enrollments.map(e => base44.entities.Enrollment.delete(e.id)),
        base44.entities.User.delete(u.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ id, currentRole }) => base44.entities.User.update(id, { role: currentRole === "admin" ? "user" : "admin" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const toggleMessagingPermissionMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.User.update(id, { can_message: !enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const updatePointsMutation = useMutation({
    mutationFn: async ({ pointsId, newXP }) => {
      await base44.entities.UserPoints.update(pointsId, { total_xp: newXP });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUserPoints"] });
      queryClient.invalidateQueries({ queryKey: ["adminPoints"] });
      setEditingPoints({});
      setXpToAdd({});
    },
  });

  const setAllAdminsToLevel10Mutation = useMutation({
    mutationFn: async () => {
      // Get all admins
      const admins = allUsers.filter(u => u.role === "admin");
      
      // Calculate XP needed for level 10
      // Assume standard progression or get thresholds
      const levelSettings = await base44.entities.LevelSettings.list();
      const thresholds = levelSettings[0]?.thresholds || [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
      const xpForLevel10 = thresholds[9] || 4500;

      // Update or create UserPoints for each admin
      await Promise.all(
        admins.map(async (admin) => {
          const existing = allUserPoints.find(p => p.user_email === admin.email);
          if (existing) {
            await base44.entities.UserPoints.update(existing.id, { total_xp: xpForLevel10 });
          } else {
            await base44.entities.UserPoints.create({
              user_email: admin.email,
              user_name: admin.full_name || admin.email,
              total_xp: xpForLevel10,
              level: 10,
            });
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUserPoints"] });
      queryClient.invalidateQueries({ queryKey: ["adminPoints"] });
      alert("✓ All admins set to Level 10!");
    },
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

  const ADMIN_EMAILS = ["sheek24kustoms@gmail.com"];
  const isAdminUser = user?.role === "admin" || ADMIN_EMAILS.includes(user?.email);

  if (!isAdminUser) {
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
        <StatCard icon={Users} label="Total Members" value={allUsers.length} color="bg-blue-500" onClick={() => setActiveTab("users")} />
        <StatCard icon={FileText} label="Total Posts" value={allPosts.length} color="bg-violet-500" onClick={() => setActiveTab("posts")} />
        <StatCard icon={BarChart2} label="Posts Today" value={postsToday} color="bg-pink-500" onClick={() => setActiveTab("posts")} />
        <StatCard icon={CheckCircle} label="Pending Approval" value={allPosts.filter(p => !p.is_approved).length} color="bg-amber-500" onClick={() => setActiveTab("posts")} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          <TabsTrigger value="weekly" className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" /> Weekly Challenge
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </TabsTrigger>
          <TabsTrigger value="liveclasses" className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5" /> Live Classes
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Levels
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1">
            <Tags className="w-3.5 h-3.5" /> Categories
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-1">
             <Mail className="w-3.5 h-3.5" /> Messages
           </TabsTrigger>
           <TabsTrigger value="points" className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Manage Points
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" /> Activity Log
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
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Push Notifications</p>
                <p className="text-xs text-blue-700 mt-1">Force all members to enable notifications. They'll get an in-app reminder.</p>
              </div>
            </div>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              onClick={async () => {
                setForceSubLoading(true);
                try {
                  const result = await base44.functions.invoke('forceSubscribeAllUsers', {});
                  alert(`✓ Notified ${result.data.unsubscribed} members to enable push notifications.`);
                } catch (err) {
                  alert('Error: ' + err.message);
                }
                setForceSubLoading(false);
              }}
              disabled={forceSubLoading}
            >
              {forceSubLoading ? "Sending..." : "Notify All"}
            </Button>
          </div>
          {allUsers.map((u) => (
            <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                  {(u.full_name || u.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.role === "admin" ? "👑 " : ""}{u.full_name || u.email}</p>
                   <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                  {userPointsMap[u.email] && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {(() => {
                        const lastActive = userPointsMap[u.email].last_activity_date;
                        if (!lastActive) return "Never active · " + (userPointsMap[u.email].total_xp || 0) + " XP";
                        const mins = moment().diff(moment(lastActive), 'minutes');
                        const status = mins <= 30 ? "Active within last 30 mins" : mins <= 60 ? "Active within last hour" : "Active " + moment(lastActive).fromNow();
                        return status + " · " + (userPointsMap[u.email].total_xp || 0) + " XP";
                      })()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {u.is_banned && <Badge className="bg-red-100 text-red-600 text-[10px]">Banned</Badge>}
                {u.role === "admin" && <Badge className="bg-violet-100 text-violet-700 text-[10px]">Admin</Badge>}
                {u.email !== user?.email && !ADMIN_EMAILS.includes(u.email) && (
                  <>
                    <Button size="sm" variant="outline" className={`h-8 text-xs gap-1 ${u.role === "admin" ? "text-violet-600 hover:bg-violet-50 border-violet-200" : "text-gray-500 hover:bg-gray-50"}`} onClick={() => toggleAdminMutation.mutate({ id: u.id, currentRole: u.role })}>
                      <Shield className="w-3 h-3" /> {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </Button>
                    <Button size="sm" variant="outline" className={`h-8 text-xs gap-1 ${u.can_message ? "text-blue-600 hover:bg-blue-50 border-blue-200" : "text-gray-500 hover:bg-gray-50"}`} onClick={() => toggleMessagingPermissionMutation.mutate({ id: u.id, enabled: u.can_message })}>
                      <Mail className="w-3 h-3" /> {u.can_message ? "Block Messages" : "Allow Messages"}
                    </Button>
                    <Button size="sm" variant="outline" className={`h-8 text-xs gap-1 ${u.is_banned ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`} onClick={() => banUserMutation.mutate({ id: u.id, banned: u.is_banned })}>
                      <Ban className="w-3 h-3" /> {u.is_banned ? "Unban" : "Ban"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 text-red-700 hover:bg-red-100 border-red-300"
                      onClick={() => {
                        if (window.confirm(`Remove ${u.full_name || u.email} from the app? This will delete their account and all their data.`)) {
                          removeUserMutation.mutate(u);
                        }
                      }}
                    >
                      <UserX className="w-3 h-3" /> Remove
                    </Button>
                  </>
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

        {/* Weekly Challenge Manager */}
        <TabsContent value="weekly" className="mt-4">
          <WeeklyChallengeManager />
        </TabsContent>

        {/* Invite Members */}
        <TabsContent value="invite" className="mt-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-violet-600 font-semibold">
              <UserPlus className="w-5 h-5" /> Invite New Members
            </div>
            <p className="text-sm text-gray-500">
              Send an invite email so someone can join Sew Sheek Sewing. They'll need to be approved by you (set your app to <strong>Private</strong> in Base44 Dashboard → Overview to require manual approval).
            </p>

            {/* Share link */}
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Signup / Invite Link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="https://sewsheek.academy"
                  className="bg-white text-gray-800 font-mono text-sm border-pink-200"
                />
                <Button
                  variant="outline"
                  className="border-pink-300 text-pink-600 hover:bg-pink-50 shrink-0 gap-1"
                  onClick={() => {
                   navigator.clipboard.writeText("https://sewsheek.academy");
                   setLinkCopied(true);
                   setTimeout(() => setLinkCopied(false), 2000);
                 }}
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">Share this link with students. Invited users via email will be automatically approved.</p>
            </div>

            {/* Invite by email */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Or invite directly by email:</p>
              <p className="text-xs text-gray-400">Enter one email per line to send multiple invites at once.</p>
              <Textarea
                placeholder={"student1@email.com\nstudent2@email.com\nstudent3@email.com"}
                value={inviteEmails}
                onChange={e => setInviteEmails(e.target.value)}
                className="border-gray-200 min-h-[100px] font-mono text-sm"
              />
              {inviteResults && (
                <div className="text-xs space-y-1">
                  {inviteResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-1.5 ${r.ok ? "text-green-600" : "text-red-500"}`}>
                      <span>{r.ok ? "✓" : "✗"}</span>
                      <span>{r.email} — {r.ok ? "Invited!" : r.error}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                 disabled={!inviteEmails.trim() || inviteSent}
                 className="bg-gradient-to-r from-pink-500 to-violet-500 text-white"
                 onClick={async () => {
                   const emails = inviteEmails.split("\n").map(e => e.trim()).filter(e => e.length > 0);
                   const results = await Promise.all(emails.map(async (email) => {
                     try {
                       await base44.functions.invoke("handleUserInvite", { email });
                       return { email, ok: true };
                     } catch (err) {
                       return { email, ok: false, error: err.message || "Failed" };
                     }
                   }));
                   setInviteResults(results);
                   setInviteEmails("");
                   setInviteSent(true);
                   setTimeout(() => { setInviteSent(false); setInviteResults(null); }, 5000);
                   queryClient.invalidateQueries({ queryKey: ["invitedEmails"] });
                 }}
               >
                 {inviteSent ? "✓ Invites Sent!" : "Send Invites"}
               </Button>
            </div>

            {/* Invite history */}
            {invitedEmails.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">Previously Invited Emails ({invitedEmails.length})</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {invitedEmails.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700 font-mono">{inv.email}</span>
                      <span className="text-[10px] text-gray-400">{moment(inv.created_date).fromNow()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current users with photo status */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Members & Profile Photo Status</p>
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover border-2 border-green-300" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-dashed border-gray-300">
                        {(u.full_name || u.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    {u.avatar_url
                      ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Photo ✓</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">No Photo</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Live Classes */}
        <TabsContent value="liveclasses" className="mt-4">
          <LiveClassManager />
        </TabsContent>

        {/* Level Settings */}
        <TabsContent value="levels" className="mt-4">
          <LevelSettingsManager />
        </TabsContent>

        {/* Category Manager */}
        <TabsContent value="categories" className="mt-4">
          <CategoryManager />
        </TabsContent>

        {/* Messaging */}
        <TabsContent value="messaging" className="mt-4">
          <MessagingPanel />
        </TabsContent>

        {/* Activity Log */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity Records</h3>
            <p className="text-sm text-gray-500 mb-4">Complete activity metrics for all members</p>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {allUserPoints.map((userPoint) => {
                const courses = allEnrollments.filter(e => e.user_email === userPoint.user_email);
                const uniqueCourses = [...new Set(courses.map(e => e.course_id))].length;
                const comments = allComments.filter(c => c.author_email === userPoint.user_email).length;
                const posts = allCommunityPosts.filter(p => p.author_email === userPoint.user_email).length;
                const lastActive = userPoint.last_activity_date ? new Date(userPoint.last_activity_date) : null;
                const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div key={userPoint.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{userPoint.user_name || userPoint.user_email}</p>
                        <p className="text-xs text-gray-500">{userPoint.user_email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-purple-600">{userPoint.total_xp || 0} XP</p>
                        <p className="text-xs text-gray-500">Level {userPoint.level || 1}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{uniqueCourses}</p>
                        <p className="text-[11px] text-gray-600">Courses</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{posts}</p>
                        <p className="text-[11px] text-gray-600">Posts</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-600">{comments}</p>
                        <p className="text-[11px] text-gray-600">Comments</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-pink-600">{daysSinceActive !== null ? daysSinceActive : "—"}</p>
                        <p className="text-[11px] text-gray-600">{daysSinceActive === 0 ? "Today" : "Days ago"}</p>
                      </div>
                    </div>

                    {userPoint.badges && userPoint.badges.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-[11px] font-semibold text-gray-700 mb-1">Badges: {userPoint.badges.join(", ")}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Manage Points */}
        <TabsContent value="points" className="mt-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-600 font-semibold">
                <Star className="w-5 h-5" /> Manage Member Points & Levels
              </div>
              <Button
                onClick={() => setAllAdminsToLevel10Mutation.mutate()}
                disabled={setAllAdminsToLevel10Mutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
              >
                {setAllAdminsToLevel10Mutation.isPending ? "Setting..." : "Set All Admins to Level 10"}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Manually add XP to any member's account to adjust their level.</p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allUserPoints.map((points) => (
                <div key={points.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{points.user_name || points.user_email}</p>
                    <p className="text-xs text-gray-500">{points.user_email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingPoints[points.id] ? (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Add XP:</span>
                          <Input
                            type="number"
                            value={xpToAdd[points.id] || 0}
                            onChange={(e) => setXpToAdd({ ...xpToAdd, [points.id]: parseInt(e.target.value) || 0 })}
                            className="w-20 h-8 border-gray-300 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                          onClick={() => {
                            const newXP = (points.total_xp || 0) + (xpToAdd[points.id] || 0);
                            updatePointsMutation.mutate({ pointsId: points.id, newXP });
                          }}
                          disabled={updatePointsMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setEditingPoints({ ...editingPoints, [points.id]: false });
                            setXpToAdd({ ...xpToAdd, [points.id]: 0 });
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{points.total_xp || 0} XP</p>
                          <p className="text-xs text-gray-400">Level {points.level || 1}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => setEditingPoints({ ...editingPoints, [points.id]: true })}
                        >
                          Add XP
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Top members */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Most Active Members (Excluding Admins)</div>
            {allPoints.filter(entry => {
              const user = allUsers.find(u => u.email === entry.user_email);
              return user?.role !== "admin";
            }).map((entry, i) => (
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