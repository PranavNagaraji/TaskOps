"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";

export default function EmployeeEmailPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState({ name: "", email: "", phone: "" });

  const [type, setType] = useState("Complaint");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const session = await getSession();
        setUser({
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          phone: "",
        });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setToast({ type: "error", text: "Subject and message are required" });
      return;
    }
    setSending(true);
    setToast(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employees/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, type, user }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send email");
      setToast({ type: "success", text: "Email sent successfully" });
      setSubject("");
      setMessage("");
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to send email" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">Contact TaskOps</h1>
          <p className="text-gray-500 mt-2">Employees can reach TaskOps for complaints, requests, feedback, or anything else.</p>
        </div>

        {toast && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                placeholder="you@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser((u) => ({ ...u, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option>Complaint</option>
                <option>Request</option>
                <option>Feedback</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                placeholder="Subject"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Write your message here..."
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className={`px-5 py-2 rounded-lg text-white font-medium ${
                sending ? "bg-gray-400" : "bg-gray-900 hover:bg-black"
              }`}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
