import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Mail, Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function AnnouncementPanel({ adminUser, queryClient }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [result, setResult] = useState(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      // 1. Create pinned community post
      await base44.entities.CommunityPost.create({
        title,
        content: message,
        author_email: adminUser.email,
        author_name: "Admin",
        category: "announcement",
        is_pinned: true,
        is_approved: true,
        likes: [],
        comment_count: 0,
      });

      // 2. Broadcast in-app + optional email via backend function
      const res = await base44.functions.invoke("sendBroadcastAnnouncement", {
        title,
        message,
        sendEmail,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setTitle("");
      setMessage("");
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
        queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      }
      toast.success(`Sent to ${data?.notifCount || 0} members${data?.emailCount ? ` + ${data.emailCount} emails` : ""}`);
    },
    onError: (err) => {
      toast.error("Failed: " + err.message);
    },
  });

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-violet-600 font-semibold">
        <Megaphone className="w-5 h-5" /> Send Broadcast Announcement
      </div>
      <p className="text-sm text-gray-500">
        Creates a pinned community post <strong>and</strong> sends in-app notifications to every member.
        Optionally also sends emails.
      </p>

      <Input
        placeholder="Announcement title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-gray-200"
      />
      <Textarea
        placeholder="Write your announcement message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border-gray-200 min-h-[120px]"
      />

      {/* Options */}
      <div className="space-y-3 pt-1">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Options</p>

        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <input type="checkbox" checked={true} readOnly className="accent-violet-500 w-4 h-4" />
          <div>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-violet-500" /> In-app notification
            </p>
            <p className="text-xs text-gray-400">Always sent to all members</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="accent-violet-500 w-4 h-4"
          />
          <div>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" /> Email notification
            </p>
            <p className="text-xs text-gray-400">Only sent to members who have announcement emails enabled</p>
          </div>
        </label>
      </div>

      {result && (
        <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2.5">
          <CheckCheck className="w-4 h-4 shrink-0" />
          Sent to {result.notifCount} members
          {result.emailCount > 0 && ` · ${result.emailCount} emails sent`}
        </div>
      )}

      <Button
        onClick={() => sendMutation.mutate()}
        disabled={!title.trim() || !message.trim() || sendMutation.isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white gap-2"
      >
        <Megaphone className="w-4 h-4" />
        {sendMutation.isPending ? "Sending..." : "Send to All Members"}
      </Button>
    </div>
  );
}