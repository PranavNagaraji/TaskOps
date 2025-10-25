"use client";
import { useEffect, useState } from "react";

export default function EmployeeVerificationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [busyById, setBusyById] = useState({}); // { [verificationId]: 'approve' | 'reject' }
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewCandidates, setPreviewCandidates] = useState([]); // array of candidate embed URLs
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);

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
    setBusyById(prev => ({ ...prev, [verificationId]: 'approve' }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification/${verificationId}/approve`, {
        method: "PATCH",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Failed to approve`);
      setItems(prev => prev.filter(v => v.VERIFICATION_ID !== verificationId));
      if (expandedId === verificationId) setExpandedId(null);
      setSuccessMessage("Employee verification approved successfully.");
    } catch (err) {
      setError(err.message || "Failed to approve");
    } finally {
      setBusyById(prev => ({ ...prev, [verificationId]: undefined }));
    }
  }

  async function handleReject(verificationId, userId) {
    clearAlerts();
    setBusyById(prev => ({ ...prev, [verificationId]: 'reject' }));
    try {
      // First delete the User via existing Users backend flow
      const del = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`, { method: "DELETE" });
      const delData = await del.json().catch(() => ({}));
      if (!del.ok) throw new Error(delData.error || delData.message || "Failed to delete user");

      // Then reject the verification via existing route
      const rej = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification/${verificationId}/reject`, { method: "PATCH" });
      const rejData = await rej.json().catch(() => ({}));
      // If verification was already removed (e.g., by cascade/another process), treat 404 as success to avoid false error
      if (!rej.ok && rej.status !== 404) {
        throw new Error(rejData.error || rejData.message || "Failed to reject verification");
      }

      setItems(prev => prev.filter(v => v.VERIFICATION_ID !== verificationId));
      if (expandedId === verificationId) setExpandedId(null);
      setRejectionMessage("Employee verification rejected.");
    } catch (err) {
      setError(err.message || "Failed to reject verification");
    } finally {
      setBusyById(prev => ({ ...prev, [verificationId]: undefined }));
    }
  }

  function isImageUrl(url = "") {
    return /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/i.test(url);
  }

  function normalizePreviewUrl(url = "") {
    if (!url) return url;
    try {
      // Handle Drive file URL pattern: https://drive.google.com/file/d/FILE_ID/view?... -> uc?export=view&id=FILE_ID
      const fileMatch = url.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//i);
      if (fileMatch && fileMatch[1]) {
        const id = fileMatch[1];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }
      // Handle Drive view/open link with id query: https://drive.google.com/open?id=FILE_ID or .../uc?id=FILE_ID
      const u = new URL(url);
      const idParam = u.searchParams.get('id');
      if (idParam) {
        return `https://drive.google.com/uc?export=view&id=${idParam}`;
      }
    } catch (_) {
      // fall through; return original url on parse error
    }
    return url;
  }

  // Build list of preview candidates for Drive and other sources
  // Priority: /preview (Drive embed) -> uc?export=view (normalized) -> original
  function buildPreviewCandidates(original = "") {
    const candidates = [];
    if (!original) return candidates;

    let fileId = null;
    const fileMatch = original.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//i);
    if (fileMatch && fileMatch[1]) {
      fileId = fileMatch[1];
    } else {
      try {
        const u = new URL(original);
        const idParam = u.searchParams.get('id');
        if (idParam) fileId = idParam;
      } catch (_) { }
    }

    if (fileId) {
      candidates.push(`https://drive.google.com/file/d/${fileId}/preview`);
    }
    const norm = normalizePreviewUrl(original);
    if (!candidates.includes(norm)) candidates.push(norm);
    if (original && !candidates.includes(original)) candidates.push(original);
    return candidates;
  }

  // Helper to detect Google Drive/Docs URLs at render time
  function isDriveUrl(url = "") {
    try {
      const u = new URL(url);
      return /(^|\.)drive\.google\.com$/.test(u.hostname) || /(^|\.)docs\.google\.com$/.test(u.hostname);
    } catch (_) {
      return false;
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
                    <div className="mt-1 text-xs inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">Status: {v.STATUS}</div>
                  </div>
                </div>

                {expandedId === v.VERIFICATION_ID && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Document:</span>{" "}
                      {v.DOCUMENT_LINK ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-border text-sm text-primary hover:bg-primary/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = v.DOCUMENT_LINK;
                            if (isDriveUrl(link)) {
                              const norm = normalizePreviewUrl(link);
                              window.open(norm, "_blank", "noopener,noreferrer");
                              return;
                            }
                            const cands = buildPreviewCandidates(link);
                            setPreviewCandidates(cands);
                            setPreviewIndex(0);
                            setImgZoom(1);
                            setPreviewUrl(cands[0] || "");
                            setShowPreview(true);
                          }}
                        >
                          {isDriveUrl(v.DOCUMENT_LINK) ? "Open in new tab" : "Open Document"}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">No document provided</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#22c55e" }}
                        disabled={!!busyById[v.VERIFICATION_ID]}
                        onClick={(e) => { e.stopPropagation(); if (!busyById[v.VERIFICATION_ID]) handleApprove(v.VERIFICATION_ID); }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#ef4444" }}
                        disabled={!!busyById[v.VERIFICATION_ID]}
                        onClick={(e) => { e.stopPropagation(); if (!busyById[v.VERIFICATION_ID]) handleReject(v.VERIFICATION_ID, v.USER_ID); }}
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

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => { setShowPreview(false); setPreviewUrl(""); }}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-border w-[92vw] max-w-3xl h-[70vh] p-3 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs sm:text-sm text-muted-foreground truncate mr-2">{previewUrl}</div>
              <div className="flex items-center gap-2">
                {isImageUrl(previewUrl) && (
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                      onClick={() => setImgZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                    >
                      -
                    </button>
                    <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(imgZoom * 100)}%</span>
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                      onClick={() => setImgZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                      onClick={() => setImgZoom(1)}
                    >
                      Reset
                    </button>
                  </div>
                )}
                {previewCandidates.length > 1 && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md border border-border text-xs sm:text-sm hover:bg-muted"
                    onClick={() => {
                      const next = (previewIndex + 1) % previewCandidates.length;
                      setPreviewIndex(next);
                      setPreviewUrl(previewCandidates[next]);
                    }}
                  >
                    Try alternate viewer
                  </button>
                )}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md border border-border text-xs sm:text-sm hover:bg-muted"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-border text-xs sm:text-sm hover:bg-muted"
                  onClick={() => { setShowPreview(false); setPreviewUrl(""); setPreviewCandidates([]); setPreviewIndex(0); setImgZoom(1); }}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="w-full h-[calc(100%-2rem)] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
              {isImageUrl(previewUrl) ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="object-contain"
                    style={{ transform: `scale(${imgZoom})`, transformOrigin: 'center center' }}
                  />
                </div>
              ) : (
                <iframe src={previewUrl} title="Document preview" className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}