"use client";
import { useEffect, useState } from "react";

export default function EmployeeVerificationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchPending() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification/pending`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Failed to load pending verifications");
        }
        const data = await res.json();
        if (isMounted) setItems(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || "Something went wrong");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPending();
    return () => {
      isMounted = false;
    };
  }, []);

  function clearAlerts() {
    setSuccessMessage("");
    setRejectionMessage("");
    setError("");
  }

  async function handleApprove(verificationId) {
    clearAlerts();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification/${verificationId}/approve`, {
        method: "PATCH",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Failed to approve`);
      setItems(prev => prev.filter(v => v.VERIFICATION_ID !== verificationId));
      setSuccessMessage("Employee verification approved successfully.");
    } catch (err) {
      setError(err.message || "Failed to approve");
    }
  }

  async function handleReject(verificationId, userId) {
    clearAlerts();
    try {
      // First delete the User via existing Users backend flow
      const del = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`, { method: "DELETE" });
      const delData = await del.json().catch(() => ({}));
      if (!del.ok) throw new Error(delData.error || delData.message || "Failed to delete user");

      // Then reject the verification via existing route
      const rej = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification/${verificationId}/reject`, { method: "PATCH" });
      const rejData = await rej.json().catch(() => ({}));
      if (!rej.ok) throw new Error(rejData.error || rejData.message || "Failed to reject verification");

      setItems(prev => prev.filter(v => v.VERIFICATION_ID !== verificationId));
      setRejectionMessage("Employee verification rejected.");
    } catch (err) {
      setError(err.message || "Failed to reject verification");
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Employee Verification</h1>

      {successMessage && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          {successMessage}
        </div>
      )}
      {rejectionMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm">
          {rejectionMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">No pending verifications.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => (
            <div
              key={v.VERIFICATION_ID}
              className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedId(prev => (prev === v.VERIFICATION_ID ? null : v.VERIFICATION_ID))}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-foreground">{v.NAME}</div>
                    <div className="text-sm text-muted-foreground break-all">{v.EMAIL}</div>
                    <div className="text-sm text-muted-foreground">{v.PHONE}</div>
                    <div className="mt-1 text-sm"><span className="text-muted-foreground">Role:</span> <span className="font-medium">{v.ROLE}</span></div>
                    <div className="mt-1 text-xs inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">Status: {v.STATUS}</div>
                  </div>
                </div>

                {expandedId === v.VERIFICATION_ID && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Document:</span>{" "}
                      {v.DOCUMENT_LINK ? (
                        <a
                          href={v.DOCUMENT_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open Document
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No document provided</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md text-white text-sm"
                        style={{ backgroundColor: "#22c55e" }}
                        onClick={(e) => { e.stopPropagation(); handleApprove(v.VERIFICATION_ID); }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md text-white text-sm"
                        style={{ backgroundColor: "#ef4444" }}
                        onClick={(e) => { e.stopPropagation(); handleReject(v.VERIFICATION_ID, v.USER_ID); }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
