import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailBlastPanel() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [results, setResults] = useState(null);
  const [target, setTarget] = useState("all"); // "all" or "specific"
  const [specificEmails, setSpecificEmails] = useState("");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["emailBlastUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers", {});
      return res.data?.users || [];
    },
  });

  const students = allUsers.filter(u => u.role !== "admin");

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and message.");
      return;
    }

    let recipients = [];
    if (target === "all") {
      recipients = students.map(u => u.email).filter(Boolean);
    } else {
      recipients = specificEmails.split("\n").map(e => e.trim()).filter(e => e.includes("@"));
    }

    if (recipients.length === 0) {
      toast.error("No valid recipients found.");
      return;
    }

    setSending(true);
    const successes = [];
    const failures = [];

    await Promise.all(
      recipients.map(async (email) => {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: subject.trim(),
            body: body.trim(),
            from_name: "Oh Sew Sheek Academy",
          });
          successes.push(email);
        } catch (err) {
          failures.push(email);
        }
      })
    );

    setSending(false);
    setSent(true);
    setResults({ successes, failures });
    toast.success(`Email sent to ${successes.length} student${successes.length !== 1 ? "s" : ""}!`);
  };

  const handleReset = () => {
    setSubject("");
    setBody("");
    setSent(false);
    setResults(null);
    setSpecificEmails("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Email All Students</h3>
          <p className="text-sm text-gray-500">{students.length} students in the platform</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTarget("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${target === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setTarget("specific")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${target === "specific" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Specific Emails
          </button>
        </div>
      </div>

      {sent && results ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">Emails Sent!</h3>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-extrabold text-green-600">{results.successes.length}</p>
              <p className="text-gray-500">Delivered</p>
            </div>
            {results.failures.length > 0 && (
              <div>
                <p className="text-2xl font-extrabold text-red-500">{results.failures.length}</p>
                <p className="text-gray-500">Failed</p>
              </div>
            )}
          </div>
          {results.failures.length > 0 && (
            <p className="text-xs text-red-500">Failed: {results.failures.join(", ")}</p>
          )}
          <Button onClick={handleReset} variant="outline" className="mt-2">
            Send Another Email
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          {target === "specific" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Recipient Emails (one per line)</label>
              <Textarea
                placeholder={"student1@email.com\nstudent2@email.com"}
                value={specificEmails}
                onChange={e => setSpecificEmails(e.target.value)}
                className="border-gray-200 min-h-[80px] font-mono text-sm"
              />
            </div>
          )}

          {target === "all" && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-800">
                This email will be sent to <strong>all {students.length} students</strong>.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Subject</label>
            <Input
              placeholder="e.g. Important Update from Oh Sew Sheek Academy"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="border-gray-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Message</label>
            <Textarea
              placeholder="Write your message here..."
              value={body}
              onChange={e => setBody(e.target.value)}
              className="border-gray-200 min-h-[180px]"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="w-full bg-black hover:bg-gray-800 text-white gap-2 py-3"
          >
            <Send className="w-4 h-4" />
            {sending
              ? `Sending to ${target === "all" ? students.length : specificEmails.split("\n").filter(e => e.includes("@")).length} students...`
              : `Send Email${target === "all" ? ` to All ${students.length} Students` : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}