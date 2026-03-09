import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Archive, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["myMessages", user?.email],
    queryFn: async () => {
      const received = await base44.entities.Message.filter({ recipient_email: user.email });
      const sent = await base44.entities.Message.filter({ sender_email: user.email });
      return [...received, ...sent].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!user?.email,
  });

  const messages = allMessages;

  // Group messages by conversation (both sent and received)
  const conversations = messages.reduce((acc, msg) => {
    const otherUserEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
    const otherUserName = msg.sender_email === user?.email ? msg.recipient_name : msg.sender_name;
    
    if (!acc[otherUserEmail]) {
      acc[otherUserEmail] = { sender_name: otherUserName, sender_email: otherUserEmail, messages: [] };
    }
    acc[otherUserEmail].messages.push(msg);
    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort((a, b) => {
    const lastA = a.messages[a.messages.length - 1]?.created_date;
    const lastB = b.messages[b.messages.length - 1]?.created_date;
    return new Date(lastB) - new Date(lastA);
  });

  const currentConversation = selectedConversation ? conversations[selectedConversation] : null;
  const unreadCount = messages.filter(m => !m.is_read).length;

  // Mark as read when viewing
  const markAsReadMutation = useMutation({
    mutationFn: (messageIds) =>
      Promise.all(messageIds.map(id => base44.entities.Message.update(id, { is_read: true }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myMessages"] }),
  });

  useEffect(() => {
    if (currentConversation?.messages) {
      const unreadIds = currentConversation.messages.filter(m => !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate(unreadIds);
      }
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        queryClient.invalidateQueries({ queryKey: ["myMessages"] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Message.create({
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: selectedConversation,
        recipient_name: currentConversation.sender_name,
        content: replyText,
        is_read: false,
      });
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["myMessages"] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">{unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex h-[600px]">
        {/* Conversation list */}
        <div className="w-full md:w-64 border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationList.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                <AlertCircle className="w-4 h-4 mx-auto mb-2 opacity-50" />
                No messages yet
              </div>
            ) : (
              conversationList.map((conv) => {
                const lastMsg = conv.messages[conv.messages.length - 1];
                const unread = conv.messages.filter(m => !m.is_read).length;
                return (
                  <button
                    key={conv.sender_email}
                    onClick={() => setSelectedConversation(conv.sender_email)}
                    className={`w-full px-4 py-3 border-b border-gray-50 text-left transition-colors ${
                      selectedConversation === conv.sender_email
                        ? "bg-blue-50 border-b border-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-800 truncate">{conv.sender_name}</p>
                      {unread > 0 && (
                        <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{lastMsg.content}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message view */}
        <div className={`flex flex-col flex-1 ${!selectedConversation ? "hidden md:flex" : ""}`}>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{currentConversation.sender_name}</p>
                  <p className="text-xs text-gray-400">{currentConversation.sender_email}</p>
                </div>
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-gray-600">
                  <Archive className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">
                {currentConversation.messages.map((msg) => {
                  const isOwn = msg.sender_email === user?.email;
                  const paragraphs = msg.content.split(/\n\n+/);
                  const lines = msg.content.split(/\n/);
                  const isLong = msg.content.length > 200;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      {/* Sender name */}
                      <p className={`text-[11px] font-semibold mb-1 px-1 ${isOwn ? "text-blue-400" : "text-gray-400"}`}>
                        {isOwn ? "You" : (msg.sender_name || "User")}
                      </p>
                      {/* Bubble */}
                      <div
                        className={`w-[85%] md:w-[65%] rounded-2xl px-4 py-3 break-words shadow-sm ${
                          isOwn
                            ? "bg-blue-500 text-white rounded-tr-sm"
                            : "bg-gray-100 text-gray-800 rounded-tl-sm"
                        }`}
                      >
                        {isLong ? (
                          <div className={`text-sm leading-relaxed space-y-2 ${isOwn ? "text-white" : "text-gray-800"}`}>
                            {paragraphs.map((para, i) => (
                              <p key={i} className="whitespace-pre-wrap">{para}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      {/* Timestamp */}
                      <p className={`text-[10px] mt-1 px-1 ${isOwn ? "text-gray-400" : "text-gray-400"}`}>
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 md:px-6 py-3 border-t border-gray-100 bg-white flex gap-2 items-end">
                <Textarea
                  placeholder="Type a reply… (Shift+Enter for new line)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="resize-none min-h-[44px] max-h-32 text-sm border-gray-200 flex-1 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (replyText.trim()) sendReplyMutation.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => sendReplyMutation.mutate()}
                  disabled={!replyText.trim() || sendReplyMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white shrink-0 rounded-xl h-11 w-11 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}