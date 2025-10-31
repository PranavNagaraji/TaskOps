"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Link from "next/link";
import ChatModal from "../../components/ChatModal";

export default function MyRequests() {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const [chatReq, setChatReq] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const session = await getSession();
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }
            setUserId(session.user.id);
            setUserName(session.user.name || "");

            try {
                const resRequests = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests/all`);
                const allRequests = await resRequests.json();

                const resCustomer = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customers/${session.user.id}`);
                const customerData = await resCustomer.json();
                const customerId = customerData?.[0]?.CUSTOMER_ID;

                const filtered = allRequests.filter(req => req.CUSTOMER_ID === customerId);
                setMyRequests(filtered);
            } catch (err) {
                console.error("Error fetching requests:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleDelete = async (requestId) => {
        if (!confirm("Are you sure you want to delete this request?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests/${requestId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete request");
            setMyRequests(myRequests.filter(r => r.REQUEST_ID !== requestId));
        } catch (err) {
            console.error("Error deleting request:", err);
            alert("Failed to delete request. Try again.");
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">Loading...</div>;
    }

    if (!userId) {
        return <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
            Please log in to view your requests.
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">My Service Requests</h1>
                </div>

                {/* Requests Table */}
                <div className="bg-white shadow rounded-xl overflow-hidden">
                    {myRequests.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Service Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Cost</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date Created</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myRequests.map((request) => (
                                    <tr
                                        key={request.REQUEST_ID}
                                        className={`hover:bg-gray-50 transition ${request.STATUS === "In Progress" ? "cursor-pointer" : ""}`}
                                        onClick={() => {
                                            if (request.STATUS === "In Progress") {
                                                setChatReq(request);
                                                setChatOpen(true);
                                            }
                                        }}
                                    >
                                        <td className="px-6 py-4 text-gray-800 font-medium">{request.SERVICE_NAME}</td>
                                        <td className="px-6 py-4 text-gray-700">₹{request.COST}</td>
                                        <td className={`px-6 py-4 font-semibold ${request.STATUS === "Completed" ? "text-green-500" : request.STATUS === "In Progress" ? "text-blue-500" : "text-yellow-500"}`}>
                                            {request.STATUS}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(request.CREATED_AT).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {request.STATUS !== "Completed" && request.STATUS !== "In Progress" ? (
                                                <button
                                                    onClick={() => handleDelete(request.REQUEST_ID)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition hover:cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            ) : request.STATUS === "In Progress" ? (
                                                <button
                                                    onClick={() => { setChatReq(request); setChatOpen(true); }}
                                                    className="bg-slate-800 text-white px-3 py-1 rounded-md hover:bg-slate-900 transition hover:cursor-pointer"
                                                >
                                                    Open Chat
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="bg-gray-300 text-gray-600 px-3 py-1 rounded-md cursor-not-allowed"
                                                >
                                                    <i>Disabled</i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 text-center py-10 text-lg">You have no service requests yet.</p>
                    )}
                </div>
            </div>
            {chatOpen && chatReq && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => { setChatOpen(false); setChatReq(null); }}
                    requestId={chatReq.REQUEST_ID}
                    userId={userId}
                    userType="customer"
                    userName={userName}
                    title={`Chat with ${chatReq.EMPLOYEE_NAME || 'Employee'}`}
                    subtitle={chatReq.SERVICE_NAME || ''}
                />
            )}
        </div>
    );
}

// Chat modal host
export function ChatHost() {
    return null;
}
