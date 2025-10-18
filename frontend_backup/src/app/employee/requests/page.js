"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function EmployeeRequestsPage() {
    const { data: session, status } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Always run hooks before any conditional return
    useEffect(() => {
        if (status === "authenticated") {
            fetchRequests();
        }
    }, [status]);

    async function fetchRequests() {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to fetch requests");
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch requests:", err);
            setRequests([]);
        }
    }

    const handleAssign = async (requestId) => {
        if (!session?.user?.id) {
            alert("You must be logged in to assign requests!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId,
                    userId: session.user.id,
                }),
            });

            if (res.ok) {
                alert(`Request ${requestId} assigned successfully!`);
                fetchRequests(); // refresh list
            } else {
                const errMsg = await res.text();
                alert(`Failed to assign request: ${errMsg}`);
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while assigning the request.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Return *after* all hooks are declared
    if (status === "loading") {
        return <div className="flex min-w-screen text-gray-500 px-6 py-4 justify-center">Loading...</div>;
    }

    if (status === "unauthenticated" || !session) {
        return <div className="flex min-w-screen text-gray-500 px-6 py-4 justify-center">You must be logged in</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-4">All Service Requests</h1>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">Customer Name</th>
                            <th className="px-4 py-2">Service Name</th>
                            <th className="px-4 py-2">Phone</th>
                            <th className="px-4 py-2">Address</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Created At</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? (
                            requests.map((r) => (
                                <tr key={r.REQUEST_ID} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{r.CUSTOMER_NAME || "N/A"}</td>
                                    <td className="px-4 py-2">{r.SERVICE_NAME || "N/A"}</td>
                                    <td className="px-4 py-2">{r.CUSTOMER_PHONE || "N/A"}</td>
                                    <td className="px-4 py-2">{r.CUSTOMER_ADDRESS || "N/A"}</td>
                                    <td className="px-4 py-2">{r.STATUS}</td>
                                    <td className="px-4 py-2">{new Date(r.CREATED_AT).toLocaleString()}</td>
                                    <td className="px-4 py-2">
                                        {r.STATUS === "Pending" ? (
                                            <button
                                                disabled={loading}
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            "Are you sure you want this request? Do you want to mark this request as yours?"
                                                        )
                                                    ) {
                                                        handleAssign(r.REQUEST_ID);
                                                    }
                                                }}
                                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 hover:cursor-pointer disabled:opacity-50"
                                            >
                                                Assign
                                            </button>
                                        ) : (
                                            <span>{r.EMPLOYEE_NAME ? `Assigned to ${r.EMPLOYEE_NAME}` : "n/a"}</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-gray-500 px-4 py-2 text-center">
                                    No requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
