"use client";
import { useState } from "react";

export default function RoleCard({ employeeId, initialRole = "" }) {
  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState("select"); // 'select' | 'custom'
  const [customRole, setCustomRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const presetRoles = [
    "plumber",
    "electrician",
    "mechanic",
    "carpenter",
    "painter",
    "teacher",
    "tutor",
    "driver",
    "technician",
  ];

  function clearAlerts() {
    setSuccess("");
    setError("");
  }

  async function onSubmit() {
    clearAlerts();
    const newRole = mode === "custom" ? customRole.trim() : role.trim();
    if (!newRole) {
      setError("Please provide a role.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employees/${employeeId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update role");
      setRole(newRole);
      setCustomRole("");
      setMode("select");
      setSuccess("Role updated successfully.");
    } catch (e) {
      setError(e.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Change Role</h2>
            <p className="text-sm text-muted-foreground">Current role: <span className="font-medium">{role || "Not set"}</span></p>
          </div>
        </div>

        {(success || error) && (
          <div className="mb-3">
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{success}</div>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "select" ? "bg-muted border-border" : "border-border hover:bg-muted"}`}
              onClick={() => setMode("select")}
            >
              Choose preset
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "custom" ? "bg-muted border-border" : "border-border hover:bg-muted"}`}
              onClick={() => setMode("custom")}
            >
              Custom
            </button>
          </div>

          {mode === "select" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select a role</option>
                {presetRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Enter custom role"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center px-3 py-2 rounded-md text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#22c55e" }}
            >
              {saving ? "Saving..." : "Save Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
