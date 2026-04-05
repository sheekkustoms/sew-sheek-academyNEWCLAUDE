import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell } from "lucide-react";

export default function PushNotificationPanel() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["pushSubscriptions"],
    queryFn: () => base44.entities.NotificationSubscription.list("-created_date", 500),
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendPushNotification", {
        title,
        body,
        sendToAll: true,
      });
      setResult({ ok: true, count: res.data?.sent || subscriptions.length });
      setTitle("");
      setBody("");
    } catch (err) {
      setResult({ ok: false, error: err.message });
    }
    setSending(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 text-violet-600 font-semibold">
        <Bell className="w-5 h-5" /> Send Push Notification
      </div>
      <p className="text-sm text-gray-500">
        Send a push notification directly to all members who have enabled browser notifications.
        <span className="ml-1 font-semibold text-gray-700">{subscriptions.length} subscriber{subscriptions.length !== 1 ? "s" : ""}</span>
      </p>

      {/* Who has push enabled */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Subscribed Members</p>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No one has enabled push notifications yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {subscriptions.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-gray-800 font-medium">{sub.user_name || sub.user_email}</span>
                <span className="text-gray-400 text-xs truncate">{sub.user_email}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Input
        placeholder="Notification title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="border-gray-200"
      />
      <Textarea
        placeholder="Notification message..."
        value={body}
        onChange={e => setBody(e.target.value)}
        className="border-gray-200 min-h-[100px]"
      />

      {result && (
        <div className={`text-sm px-4 py-2 rounded-xl font-medium ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {result.ok ? `✓ Sent to ${result.count} subscriber(s)` : `✗ Error: ${result.error}`}
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={!title.trim() || !body.trim() || sending}
        className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white gap-2"
      >
        <Bell className="w-4 h-4" />
        {sending ? "Sending..." : "Send Push Notification"}
      </Button>
    </div>
  );
}