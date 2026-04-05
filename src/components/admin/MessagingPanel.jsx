import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function MessagingPanel() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [emailCopied, setEmailCopied] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["messagingUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  // Filter to only show users that aren't admins or have messaging disabled
  const messagingUsers = allUsers.filter(u => u.role !== "admin");

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedUser?.id],
    queryFn: () => selectedUser ? base44.entities.Message.list("-created_date", 100) : Promise.resolve([]),
    enabled: !!selectedUser,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Message.create({
        sender_email: user.email,
        sender_name: user.full_name || "Admin",
        recipient_email: selectedUser.email,
        recipient_name: selectedUser.full_name || selectedUser.email,
        content: message,
        is_read: false,
      });
      setMessage("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedUser?.id] });
      toast.success("Message sent");
    },
  });

  const conversationMessages = messages.filter(
    (m) =>
      (m.sender_email === selectedUser?.email || m.recipient_email === selectedUser?.email)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
      {/* Users list */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">Members</div>
        <div className="overflow-y-auto flex-1 space-y-1 p-2">
           {messagingUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${
                selectedUser?.id === u.id
                  ? "bg-gradient-to-r from-pink-100 to-violet-100 text-violet-700 font-semibold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{u.full_name || u.email}</p>
                <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(u.email);
                  setEmailCopied(u.id);
                  setTimeout(() => setEmailCopied(null), 1500);
                }}
              >
                {emailCopied === u.id ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </Button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedUser ? (
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">
            {selectedUser.full_name || selectedUser.email}
            <p className="text-xs text-gray-400 font-normal mt-0.5">{selectedUser.email}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversationMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_email === selectedUser.email ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                      msg.sender_email === selectedUser.email
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gradient-to-r from-pink-500 to-violet-500 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4 space-y-3">
            <Textarea
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-gray-200 min-h-[80px] resize-none"
            />
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!message || sendMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2"
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a member to message</p>
          </div>
        </div>
      )}
    </div>
  );
}