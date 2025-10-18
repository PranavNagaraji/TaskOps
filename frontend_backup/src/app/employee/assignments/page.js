"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MyAssignmentsPage() {
    const { data: session } = useSession();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

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

            // Update UI instantly
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
            <h1 className="text-2xl font-semibold mb-6">My Assignments</h1>
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
                    </div>
                ))}
            </div>
        </div>
    );
}
