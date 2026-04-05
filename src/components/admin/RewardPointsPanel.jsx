import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Trophy, Search, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function RewardPointsPanel({ adminUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [xpAmount, setXpAmount] = useState(50);
  const [projectName, setProjectName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allUserPoints = [] } = useQuery({
    queryKey: ["adminAllUserPoints"],
    queryFn: () => base44.entities.UserPoints.list("-last_activity_date", 200),
  });

  const nonAdminUsers = allUsers.filter(u => u.role !== "admin");

  const filtered = nonAdminUsers.filter(u => {
    const name = (u.display_name || u.full_name || u.email || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const toggleUser = (u) => {
    setSelectedUsers(prev =>
      prev.find(s => s.id === u.id) ? prev.filter(s => s.id !== u.id) : [...prev, u]
    );
  };

  const handleReward = async () => {
    if (!selectedUsers.length || !xpAmount) return;
    setSending(true);

    try {
      const names = selectedUsers.map(u => u.display_name || u.full_name || u.email.split("@")[0]).join(", ");
      const tags = selectedUsers.map(u => `@${u.display_name || u.full_name || u.email.split("@")[0]}`).join(" ");
      const project = projectName.trim() || "a project";

      // 1. Award XP to each selected user
      await Promise.all(selectedUsers.map(async (u) => {
        const existing = allUserPoints.find(p => p.user_email === u.email);
        if (existing) {
          await base44.entities.UserPoints.update(existing.id, {
            total_xp: (existing.total_xp || 0) + xpAmount,
          });
        } else {
          await base44.entities.UserPoints.create({
            user_email: u.email,
            user_name: u.display_name || u.full_name || u.email,
            total_xp: xpAmount,
          });
        }
      }));

      // 2. Send personal notification to each user
      await Promise.all(selectedUsers.map(u =>
        base44.entities.Notification.create({
          recipient_email: u.email,
          type: "badge",
          message: `🏆 You earned ${xpAmount} XP for completing ${project}! Great work!`,
          from_name: "COACH",
          is_read: false,
        })
      ));

      // 3. Create a public community celebration post
      const postContent = customMessage.trim()
        || `Huge shoutout to our amazing students who completed ${project}! 🎉 They each earned ${xpAmount} XP for their hard work!\n\n🏆 ${names}\n\n${tags}\n\nKeep sewing and showing up — you all inspire this community! 💪✨`;

      await base44.entities.CommunityPost.create({
        title: `🏆 Project Completion Shoutout!`,
        content: postContent,
        author_email: adminUser.email,
        author_name: "COACH",
        author_avatar: adminUser.avatar_url || "",
        category: "announcement",
        is_pinned: false,
        is_approved: true,
        is_admin_post: true,
        likes: [],
        comment_count: 0,
      });

      queryClient.invalidateQueries({ queryKey: ["adminAllUserPoints"] });
      queryClient.invalidateQueries({ queryKey: ["adminPoints"] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });

      toast.success(`Rewarded ${selectedUsers.length} student(s) and posted a community shoutout!`);
      setSelectedUsers([]);
      setProjectName("");
      setCustomMessage("");
      setXpAmount(50);
      setSearch("");
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
        <Trophy className="w-5 h-5" /> Reward Students for Completing Projects
      </div>
      <p className="text-sm text-gray-500">
        Select students, set XP, and hit send — they'll each get a personal notification <strong>and</strong> a public shoutout post will appear in the community.
      </p>

      {/* Step 1: Pick students */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">1. Pick Students</p>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>

        {/* Selected chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(u => (
              <span key={u.id} className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                {u.display_name || u.full_name || u.email.split("@")[0]}
                <button onClick={() => toggleUser(u)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Member list */}
        <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No members found</p>
          )}
          {filtered.map(u => {
            const isSelected = !!selectedUsers.find(s => s.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggleUser(u)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? "bg-amber-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {u.avatar_url
                    ? <img src={u.avatar_url} className="w-full h-full object-cover" />
                    : (u.display_name || u.full_name || u.email)?.[0]?.toUpperCase()
                  }
                </div>
                <span className="flex-1 text-sm text-gray-800">{u.display_name || u.full_name || u.email}</span>
                {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Project name & XP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">2. Project Name</p>
          <Input
            placeholder="e.g. The Stole Project"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="border-gray-200"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">3. XP to Award</p>
          <Input
            type="number"
            min={1}
            value={xpAmount}
            onChange={e => setXpAmount(parseInt(e.target.value) || 0)}
            className="border-gray-200"
          />
        </div>
      </div>

      {/* Step 3: Custom message (optional) */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">4. Custom Post Message <span className="text-gray-400 font-normal">(optional — leave blank for auto-generated)</span></p>
        <Textarea
          placeholder="Write a custom shoutout message, or leave blank for an auto-generated one..."
          value={customMessage}
          onChange={e => setCustomMessage(e.target.value)}
          className="border-gray-200 min-h-[80px]"
        />
      </div>

      {/* Preview */}
      {selectedUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-1">
          <p className="font-semibold">Preview:</p>
          <p>📬 {selectedUsers.length} student(s) will receive a personal notification</p>
          <p>🏆 Each will earn <strong>{xpAmount} XP</strong></p>
          <p>📢 A public community post will be created announcing them</p>
        </div>
      )}

      <Button
        onClick={handleReward}
        disabled={sending || !selectedUsers.length || !xpAmount}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-11"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending Rewards...</>
        ) : (
          <><Gift className="w-4 h-4 mr-2" /> Reward {selectedUsers.length > 0 ? selectedUsers.length : ""} Student{selectedUsers.length !== 1 ? "s" : ""} & Post Shoutout</>
        )}
      </Button>
    </div>
  );
}