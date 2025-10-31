"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatModal from "../../components/ChatModal";

export default function MyAssignmentsPage() {
    const { data: session } = useSession();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatItem, setChatItem] = useState(null);

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

    const handleMarkCompleted = async (assignmentId) => {
        try {
            const res = await fetch("http://localhost:5000/api/assignments", {
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
            alert("Failed to update assignment.");
        }
    };

    const handleToggleActive = async () => {
        if (!session?.user?.id) return;

        const hasInProgress = assignments.some(a => a.STATUS === "In Progress");
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
        return <div className="p-6 text-center text-gray-500">Please log in.</div>;
    }

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading...</div>;
    }

    if (assignments.length === 0) {
        return <div className="p-6 text-center text-gray-500">No assignments yet.</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">My Assignments</h1>
                <button
                    onClick={handleToggleActive}
                    disabled={assignments.some(a => a.STATUS === "In Progress") || updating}
                    className={`px-4 py-2 rounded-md text-white transition 
            ${assignments.some(a => a.STATUS === "In Progress")
                            ? "bg-gray-400 cursor-not-allowed"
                            : isActive
                                ? "bg-red-600 hover:bg-red-500"
                                : "bg-green-600 hover:bg-green-500"
                        }`}
                >
                    {updating
                        ? "Updating..."
                        : assignments.some(a => a.STATUS === "In Progress")
                            ? "Cannot Change Activeness"
                            : isActive
                                ? "Set Inactive"
                                : "Set Active"}
                </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {assignments.map((a) => (
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
                                className={`px-2 py-1 rounded-lg text-white ${a.STATUS === "Completed"
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
                                onClick={() => {
                                    if (confirm("Are you sure you want to mark this assignment as completed?")) {
                                        handleMarkCompleted(a.ASSIGNMENT_ID);
                                    }
                                }}
                                className="mt-3 w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-600 hover:cursor-pointer transition"
                            >
                                Mark as Completed
                            </button>
                        )}
                        {a.STATUS === "In Progress" && (
                            <button
                                onClick={() => { setChatItem(a); setChatOpen(true); }}
                                className="mt-2 w-full bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 transition"
                            >
                                Open Chat
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {chatOpen && chatItem && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => { setChatOpen(false); setChatItem(null); }}
                    requestId={chatItem.REQUEST_ID}
                    userId={session?.user?.id}
                    userType="employee"
                    userName={session?.user?.name || ""}
                    title={`Chat with ${chatItem.CUSTOMER_NAME || 'Customer'}`}
                    subtitle={chatItem.SERVICE_NAME || ''}
                />
            )}
        </div>
    );
}
