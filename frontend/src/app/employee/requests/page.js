"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ChatModal from "../../components/ChatModal";

export default function EmployeeRequestsPage() {
    const { data: session, status } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatReq, setChatReq] = useState(null); // current request row for chat

    useEffect(() => {
        if (status === "authenticated") fetchRequests();
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
            console.error(err);
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
                body: JSON.stringify({ requestId, userId: session.user.id }),
            });

            if (res.ok) {
                alert(`Request ${requestId} assigned successfully!`);
                fetchRequests();
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

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center text-muted-foreground text-lg">
                Loading...
            </div>
        );
    }

    if (status === "unauthenticated" || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center text-muted-foreground text-lg">
                You must be logged in
            </div>
        );
    }

    // Function to get badge classes based on status
    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return "bg-warning/10 text-warning";
            case "In Progress":
                return "bg-primary/10 text-primary";
            case "Completed":
                return "bg-success/10 text-success";
            default:
                return "bg-muted text-foreground";
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Service Requests</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-sm rounded-lg overflow-hidden border border-border">
                    <thead className="bg-muted/60">
                        <tr>
                            {[
                                "Customer",
                                "Service",
                                "Phone",
                                "Address",
                                "Status",
                                "Created At",
                                "Action",
                            ].map((title) => (
                                <th
                                    key={title}
                                    className="px-6 py-3 text-left text-sm font-semibold text-foreground/80 uppercase tracking-wider"
                                >
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {requests.length > 0 ? (
                            requests.map((r) => (
                                <tr
                                    key={r.REQUEST_ID}
                                    className="hover:bg-muted/40 transition-colors duration-150"
                                >
                                    <td className="px-6 py-4 text-foreground font-medium">
                                        {r.CUSTOMER_NAME || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-foreground/80">{r.SERVICE_NAME || "N/A"}</td>
                                    <td className="px-6 py-4 text-foreground/80">{r.CUSTOMER_PHONE || "N/A"}</td>
                                    <td className="px-6 py-4 text-foreground/80">{r.CUSTOMER_ADDRESS || "N/A"}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-block px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusBadge(r.STATUS)}`}
                                        >
                                            {r.STATUS}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-muted-foreground text-sm">
                                        {new Date(r.CREATED_AT).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                    {r.STATUS === "Pending" ? (
                                        <button
                                            disabled={loading}
                                            onClick={() => {
                                                if (confirm("Do you want to assign this request to yourself?")) {
                                                    handleAssign(r.REQUEST_ID);
                                                }
                                            }}
                                            className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 shadow-sm"
                                        >
                                            Assign
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-700 text-sm font-medium">
                                                {r.EMPLOYEE_NAME ? (
                                                    <span className="text-green-700">{`Assigned to ${r.EMPLOYEE_NAME}`}</span>
                                                ) : (
                                                    "n/a"
                                                )}
                                            </span>
                                            {r.STATUS === "In Progress" && (
                                                <button
                                                    onClick={() => { setChatReq(r); setChatOpen(true); }}
                                                    className="px-3 py-1.5 rounded-lg font-medium bg-slate-800 text-white hover:bg-slate-900 transition"
                                                >
                                                    Open Chat
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center py-8 text-muted-foreground text-lg font-medium"
                                >
                                    No requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {chatOpen && chatReq && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => { setChatOpen(false); setChatReq(null); }}
                    requestId={chatReq.REQUEST_ID}
                    userId={session.user.id}
                    userType="employee"
                    userName={session.user.name}
                    title={`Chat with ${chatReq.CUSTOMER_NAME || 'Customer'}`}
                    subtitle={chatReq.SERVICE_NAME || ''}
                />
            )}
        </div>
    );
}

{/* Chat Modal */}
{/* Render at root of component file */}
export function ChatHostWrapper() {
    return null;
}
