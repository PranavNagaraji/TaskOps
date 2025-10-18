"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function EmployeeRequestsPage() {
    const { data: session, status } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

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
            <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">
                Loading...
            </div>
        );
    }

    if (status === "unauthenticated" || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">
                You must be logged in
            </div>
        );
    }

    // Function to get badge classes based on status
    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "In Progress":
                return "bg-blue-100 text-blue-800";
            case "Completed":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Service Requests</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
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
                                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                                >
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.length > 0 ? (
                            requests.map((r) => (
                                <tr
                                    key={r.REQUEST_ID}
                                    className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-6 py-4 text-gray-700 font-medium">
                                        {r.CUSTOMER_NAME || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{r.SERVICE_NAME || "N/A"}</td>
                                    <td className="px-6 py-4 text-gray-700">{r.CUSTOMER_PHONE || "N/A"}</td>
                                    <td className="px-6 py-4 text-gray-700">{r.CUSTOMER_ADDRESS || "N/A"}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-block px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusBadge(r.STATUS)}`}
                                        >
                                            {r.STATUS}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(r.CREATED_AT).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.STATUS === "Pending" ? (
                                            <button
                                                disabled={loading}
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            "Do you want to assign this request to yourself?"
                                                        )
                                                    ) {
                                                        handleAssign(r.REQUEST_ID);
                                                    }
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-150 hover:cursor-pointer"
                                            >
                                                Assign
                                            </button>
                                        ) : (
                                            <span className="text-gray-600 text-sm">
                                                {r.EMPLOYEE_NAME ? `Assigned to ${r.EMPLOYEE_NAME}` : "n/a"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center py-8 text-gray-400 text-lg font-medium"
                                >
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
