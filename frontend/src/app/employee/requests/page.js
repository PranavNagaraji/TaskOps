"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function EmployeeRequestsPage() {
    const { data: session, status } = useSession();
    const [requests, setRequests] = useState([]);
    const [employee, setEmployee] = useState(null); // { exists, employee }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            fetchEmployee().then(() => fetchRequests());
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
            console.error(err);
            setRequests([]);
        }
    }

    async function fetchEmployee() {
        try {
            const userId = session?.user?.id;
            if (!userId) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employees/user/${userId}`, {
                cache: "no-store",
            });
            if (!res.ok) return;
            const json = await res.json();
            if (json?.exists) setEmployee(json.employee);
        } catch (e) {
            console.error("Failed to load employee by user", e);
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

    // Build role relevance and groups
    const role = (employee?.ROLE || "").toLowerCase();
    const userId = session?.user?.id;
    const employeeId = employee?.EMPLOYEE_ID;

    function relevanceScore(r) {
        const name = String(r.SERVICE_NAME || "").toLowerCase();
        const inName = role && name.includes(role) ? 1 : 0;
        // prior statuses: Pending > In Progress > Completed
        const statusRank = r.STATUS === "Pending" ? 2 : r.STATUS === "In Progress" ? 1 : 0;
        return inName * 10 + statusRank; // role match dominates, then status
    }

    const myTasks = requests
        .filter((r) => Number(r.EMPLOYEE_ID || 0) && employeeId && Number(r.EMPLOYEE_ID) === Number(employeeId))
        .sort((a, b) => relevanceScore(b) - relevanceScore(a) || new Date(b.CREATED_AT) - new Date(a.CREATED_AT));

    const unassigned = requests
        .filter((r) => !r.EMPLOYEE_ID)
        .sort((a, b) => relevanceScore(b) - relevanceScore(a) || new Date(b.CREATED_AT) - new Date(a.CREATED_AT));

    const otherAssigned = requests
        .filter((r) => r.EMPLOYEE_ID && (!employeeId || Number(r.EMPLOYEE_ID) !== Number(employeeId)))
        .sort((a, b) => relevanceScore(b) - relevanceScore(a) || new Date(b.CREATED_AT) - new Date(a.CREATED_AT));

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Service Requests</h1>

            {/* Groups */}
            {[
                { title: "My Tasks", data: myTasks },
                { title: "Unassigned (Relevant First)", data: unassigned },
                { title: "Other Assigned", data: otherAssigned },
            ].map((group) => (
                <div key={group.title} className="mb-10">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">{group.title}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow-sm rounded-lg overflow-hidden border border-border">
                            <thead className="bg-muted/60">
                                <tr>
                                    {["Customer", "Service", "Phone", "Address", "Status", "Created At", "Action"].map((title) => (
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
                                {group.data.length > 0 ? (
                                    group.data.map((r) => (
                                        <tr key={r.REQUEST_ID} className="hover:bg-muted/40 transition-colors duration-150">
                                            <td className="px-6 py-4 text-foreground font-medium">{r.CUSTOMER_NAME || "N/A"}</td>
                                            <td className="px-6 py-4 text-foreground/80">{r.SERVICE_NAME || "N/A"}</td>
                                            <td className="px-6 py-4 text-foreground/80">{r.CUSTOMER_PHONE || "N/A"}</td>
                                            <td className="px-6 py-4 text-foreground/80">{r.CUSTOMER_ADDRESS || "N/A"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusBadge(r.STATUS)}`}>
                                                    {r.STATUS}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-sm">{new Date(r.CREATED_AT).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {(!r.EMPLOYEE_ID && r.STATUS === "Pending") ? (
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
                                                    <span className="text-gray-700 text-sm font-medium">
                                                        {r.EMPLOYEE_NAME ? (
                                                            <span className="text-green-700">{`Assigned to ${r.EMPLOYEE_NAME}`}</span>
                                                        ) : (
                                                            "n/a"
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground text-lg font-medium">
                                            No requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

{/* Chat Modal */}
{/* Render at root of component file */}
export function ChatHostWrapper() { return null; }
