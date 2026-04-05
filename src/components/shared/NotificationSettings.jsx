import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, Check } from "lucide-react";
import { toast } from "sonner";

const SETTINGS = [
  {
    key: "notif_community_replies",
    label: "Community reply emails",
    desc: "Email me when someone comments on my post",
  },
  {
    key: "notif_new_lessons",
    label: "New lesson emails",
    desc: "Email me when a new lesson is published",
  },
  {
    key: "notif_announcements",
    label: "Admin announcement emails",
    desc: "Email me important announcements from the team",
  },
];

export default function NotificationSettings({ user }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(null);

  const toggle = async (key) => {
    const current = user?.[key] !== false; // default true
    setSaving(key);
    await base44.auth.updateMe({ [key]: !current });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    toast.success(`${!current ? "Enabled" : "Disabled"} successfully`);
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Mail className="w-4 h-4 text-[#D4AF37]" /> Email Notifications
      </div>
      <p className="text-xs text-gray-500">
        Transactional emails (welcome, password reset) are always sent. Control optional emails below.
      </p>
      <div className="space-y-3">
        {SETTINGS.map(({ key, label, desc }) => {
          const enabled = user?.[key] !== false;
          return (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={saving === key}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  enabled ? "bg-[#D4AF37]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    enabled ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}