"use client";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

export default function CustomersPage() {
    const [user, setUser] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
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
        if (!confirm("Are you sure you want to delete this customer?")) return;

        try {
            const res = await fetch(`${apiUrl}/api/users/${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete customer");
            alert("Customer deleted successfully");
            fetchCustomers();
        } catch (err) {
            console.error(err);
            alert(err.message);
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
                                <p><span className="font-semibold">Joined:</span> {new Date(c.CREATED_AT).toLocaleDateString()}</p>
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
        </div>
    );
}
