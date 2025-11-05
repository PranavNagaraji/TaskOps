"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatModal from "../../components/ChatModal";

export default function MyAssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatItem, setChatItem] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpAssignmentId, setOtpAssignmentId] = useState(null);
  const baseUrl = "http://localhost:5000";

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAssignments = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/assignments/employee/${session.user.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch assignments");

        const data = await res.json();
        setAssignments(data);
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [session]);

  // Derive activeness heuristically from assignments: any In Progress implies Active
  useEffect(() => {
    if (!assignments || assignments.length === 0) return;
    const hasInProgress = assignments.some((a) => a.STATUS === "In Progress");
    if (hasInProgress && !isActive) {
      setIsActive(true);
    }
  }, [assignments]);

  const handleMarkCompleted = async (assignmentId) => {
    try {
      const res = await fetch(`${baseUrl}/api/assignments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      if (!res.ok) throw new Error("Failed to mark completed");

      // Update UI
      setAssignments((prev) =>
        prev.map((a) =>
          a.ASSIGNMENT_ID === assignmentId
            ? { ...a, STATUS: "Completed", COMPLETED_AT: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error("Error updating assignment:", err);
      // Error will be surfaced in OTP modal flow
    }
  };

  async function startOtpFlow(assignmentId) {
    setOtpAssignmentId(assignmentId);
    setOtpError("");
    setOtpCode("");
    setOtpOpen(true);
    setOtpLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/assignments/${assignmentId}/completion-otp`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send OTP");
      }
    } catch (err) {
      setOtpError(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtpAndComplete() {
    if (!otpAssignmentId) return;
    setOtpError("");
    setOtpVerifying(true);
    try {
      const vres = await fetch(`${baseUrl}/api/assignments/${otpAssignmentId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpCode.trim() }),
      });
      const vdata = await vres.json().catch(() => ({}));
      if (!vres.ok || vdata?.valid === false) {
        throw new Error(vdata?.message || "Invalid OTP");
      }

      // Proceed with existing completion API
      const cres = await fetch(`${baseUrl}/api/assignments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: otpAssignmentId }),
      });
      if (!cres.ok) {
        const cdata = await cres.json().catch(() => ({}));
        throw new Error(cdata?.error || "Failed to mark completed");
      }
      setAssignments((prev) =>
        prev.map((a) =>
          a.ASSIGNMENT_ID === otpAssignmentId
            ? { ...a, STATUS: "Completed", COMPLETED_AT: new Date().toISOString() }
            : a
        )
      );
      setOtpOpen(false);
      setOtpAssignmentId(null);
      setOtpCode("");
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setOtpVerifying(false);
    }
  }

  const handleToggleActive = async () => {
    if (!session?.user?.id) return;

    const hasInProgress = assignments.some((a) => a.STATUS === "In Progress");
    if (hasInProgress) return; // prevent toggle when in-progress assignments exist

    try {
      setUpdating(true);
      const res = await fetch("http://localhost:5000/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          status: isActive ? "Inactive" : "Active",
        }),
      });

      if (!res.ok) throw new Error("Failed to update active status");
      setIsActive(!isActive);
      alert("Employee status updated successfully.");
    } catch (err) {
      console.error("Error toggling active status:", err);
      alert("Failed to update employee status.");
    } finally {
      setUpdating(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="p-6 text-center text-gray-500">Please log in.</div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  // Do not early-return here; keep header and status button visible even with zero assignments

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Assignments</h1>
        <button
          onClick={handleToggleActive}
          disabled={
            assignments.some((a) => a.STATUS === "In Progress") || updating
          }
          className={`px-4 py-2 rounded-md text-white transition 
            ${
              assignments.some((a) => a.STATUS === "In Progress")
                ? "bg-gray-400 cursor-not-allowed"
                : isActive
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-green-600 hover:bg-green-500"
            }`}
        >
          {updating
            ? "Updating..."
            : assignments.some((a) => a.STATUS === "In Progress")
              ? "Cannot Change Activeness"
              : isActive
                ? "Set Inactive"
                : "Set Active"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {assignments.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No assignments yet.</div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.ASSIGNMENT_ID}
              className="p-4 border rounded-2xl shadow-sm bg-white hover:shadow-md transition"
            >
              <h2 className="text-lg font-medium">{a.SERVICE_NAME}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Customer Phone: <b><i>{a.CUSTOMER_PHONE || "N/A"}</i></b>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Customer Email: <b><i>{a.CUSTOMER_EMAIL || "N/A"}</i></b>
              </p>
              <p className="text-sm text-gray-600">
                Cost: ₹{a.COST || "N/A"}
              </p>
              <p className="text-sm mt-2">
                <span
                  className={`px-2 py-1 rounded-lg text-white ${
                    a.STATUS === "Completed"
                      ? "bg-green-600"
                      : a.STATUS === "In Progress"
                        ? "bg-yellow-600"
                        : "bg-gray-400"
                  }`}
                >
                  {a.STATUS}
                </span>
              </p>
              {a.COMPLETED_AT && (
                <p className="text-xs text-gray-500 mt-2">
                  Completed at: {new Date(a.COMPLETED_AT).toLocaleString()}
                </p>
              )}

              {a.STATUS !== "Completed" && (
                <button
                  onClick={() => startOtpFlow(a.ASSIGNMENT_ID)}
                  className="mt-3 w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-600 hover:cursor-pointer transition"
                >
                  Mark as Completed
                </button>
              )}
              {a.STATUS === "In Progress" && (
                <button
                  onClick={() => {
                    setChatItem(a);
                    setChatOpen(true);
                  }}
                  className="mt-2 w-full bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 transition"
                >
                  Open Chat
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {chatOpen && chatItem && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setChatItem(null);
          }}
          requestId={chatItem.REQUEST_ID}
          userId={session?.user?.id}
          userType="employee"
          userName={session?.user?.name || ""}
          title={`Chat with ${chatItem.CUSTOMER_NAME || "Customer"}`}
          subtitle={chatItem.SERVICE_NAME || ""}
        />
      )}

      {/* OTP Modal */}
      {otpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-lg font-semibold">Confirm Completion</h2>
              <button
                onClick={() => {
                  if (!otpVerifying) {
                    setOtpOpen(false);
                    setOtpAssignmentId(null);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              {otpLoading ? (
                <div className="text-sm text-gray-700">
                  Sending OTP to the customer's registered email...
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Enter the OTP sent to the customer's registered email to
                    confirm completion.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="6-digit OTP"
                  />
                  {otpError && (
                    <div className="text-sm text-red-600">{otpError}</div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button
                onClick={async () => {
                  if (!otpAssignmentId) return;
                  setOtpLoading(true);
                  setOtpError("");
                  try {
                    const res = await fetch(
                      `${baseUrl}/api/assignments/${otpAssignmentId}/completion-otp`,
                      { method: "POST" }
                    );
                    if (!res.ok) throw new Error("Failed to resend OTP");
                  } catch (e) {
                    setOtpError(e.message || "Failed to resend OTP");
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                className="px-3 py-2 rounded border"
                disabled={otpLoading || otpVerifying}
              >
                Resend OTP
              </button>
              <button
                onClick={verifyOtpAndComplete}
                disabled={
                  otpLoading || otpVerifying || otpCode.trim().length !== 6
                }
                className={`px-3 py-2 rounded text-white ${
                  otpLoading || otpVerifying || otpCode.trim().length !== 6
                    ? "bg-gray-400"
                    : "bg-green-700 hover:bg-green-600"
                }`}
              >
                {otpVerifying ? "Verifying..." : "Verify & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
