"use client";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

export default function CustomersPage() {
    const [user, setUser] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [resultType, setResultType] = useState("success"); // success | error
    const [resultMessage, setResultMessage] = useState("");
    const [pendingUserId, setPendingUserId] = useState(null);
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            if (session?.user) setUser(session.user);
            setLoading(false);
        };
        fetchSession();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/customers`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch customers");
            const data = await res.json();
            setCustomers(data);
        } catch (err) {
            console.error(err);
            setCustomers([]);
        }
    };

    useEffect(() => {
        if (user) fetchCustomers();
    }, [user]);

    const handleDelete = async (userId) => {
        setPendingUserId(userId);
        setConfirmOpen(true);
    };

    const performDeletion = async () => {
        if (!pendingUserId) return;
        try {
            const res = await fetch(`${apiUrl}/api/users/${pendingUserId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete customer");
            setResultType("success");
            setResultMessage("Customer deleted successfully.");
            setResultOpen(true);
            await fetchCustomers();
        } catch (err) {
            console.error(err);
            setResultType("error");
            setResultMessage(err.message || "Failed to delete customer.");
            setResultOpen(true);
        } finally {
            setConfirmOpen(false);
            setPendingUserId(null);
        }
    };

    if (!user || user.role !== "admin")
        return <p className="flex justify-center items-center min-h-screen text-gray-500">You must be logged in as an admin to view this page</p>;

    if (loading)
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">All Customers</h1>

            {customers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map(c => (
                        <div
                            key={c.CUSTOMER_ID}
                            className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between"
                        >
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-gray-800">{c.NAME}</h2>
                                <p><span className="font-semibold">Phone:</span> {c.PHONE}</p>
                                <p><span className="font-semibold">Email:</span> {c.EMAIL}</p>
                                <p><span className="font-semibold">Address:</span> {c.ADDRESS}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(c.USER_ID)} // <- Use USER_ID, not CUSTOMER_ID
                                className="flex justify-center mt-4 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:text-white transition-colors duration-200"
                            >
                                <Trash2 size={16} className="mr-1" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 w-full text-center">No customers found.</p>
            )}

            {/* Confirm Delete Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-lg font-semibold">Confirm Deletion</h2>
                            <button onClick={() => setConfirmOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5 text-sm text-gray-700">
                            Are you sure you want to delete this customer? This action cannot be undone.
                        </div>
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
                            <button onClick={() => { setConfirmOpen(false); setPendingUserId(null); }} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={performDeletion} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {resultOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-lg font-semibold">{resultType === 'success' ? 'Success' : 'Error'}</h2>
                            <button onClick={() => setResultOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5 text-sm text-gray-700">
                            {resultMessage}
                        </div>
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
                            <button onClick={() => setResultOpen(false)} className="px-3 py-2 rounded border">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

