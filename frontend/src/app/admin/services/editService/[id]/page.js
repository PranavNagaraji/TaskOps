"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { getSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

export default function EditServicePage() {
    const [user, setUser] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const router = useRouter();
    const { id } = useParams();
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            if (session?.user) setUser(session.user);
            setSessionLoading(false);
        };
        checkSession();
    }, []);

    const [service, setService] = useState({
        name: "",
        description: "",
        cost: "",
        duration: "",
        status: ""
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchService = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/services/${id}`);
                setService({
                    name: res.data.NAME,
                    description: res.data.DESCRIPTION,
                    cost: res.data.COST,
                    duration: res.data.DURATION,
                    status: res.data.STATUS?.toUpperCase() || ""
                });
            } catch (err) {
                console.error("Error fetching service:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    const handleEditService = async () => {
        try {
            await axios.put(`${apiUrl}/api/services/${id}`, service);
            alert("Service updated successfully!");
            router.push("/admin/services");
        } catch (err) {
            console.error("Error updating service:", err);
            alert("Failed to update service");
        }
    };

    const handleDeleteService = async (id) => {
        try {
            if (confirm(`Are you sure you want to delete this service?`)) {
                const res = await axios.delete(`${apiUrl}/api/services/${id}`, { cache: "no-store" });
                alert("Service deleted successfully!");
                router.push("/admin/services");
            }
        } catch (err) {
            console.error("Error deleting service:", err);
            alert("Failed to delete service");
        }
    }

    if (sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg font-medium text-gray-600">
                Checking authentication...
            </div>
        );
    }
    if (!user || user.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
                Please log in as an admin to view this page.
            </div>
        );
    }
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading service details...
            </div>
        );

    return (
        <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Service Details</h2>
                <button onClick={() => handleDeleteService(id)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 hover:cursor-pointer"><Trash2 size={18} /></button>
            </div>

            <div className="space-y-5">
                {/* Name */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        value={service.name}
                        onChange={(e) => setService({ ...service, name: e.target.value })}
                        className={`w-full border p-3 rounded-lg focus:outline-none ${isEditing ? "border-blue-400 bg-white" : "bg-gray-100 cursor-not-allowed"
                            }`}
                        readOnly={!isEditing}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Description</label>
                    <textarea
                        value={service.description}
                        onChange={(e) => setService({ ...service, description: e.target.value })}
                        className={`w-full border p-3 rounded-lg focus:outline-none h-24 ${isEditing ? "border-blue-400 bg-white" : "bg-gray-100 cursor-not-allowed resize-none"
                            }`}
                        readOnly={!isEditing}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cost */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Cost</label>
                        <input
                            type="number"
                            value={service.cost}
                            onChange={(e) => setService({ ...service, cost: e.target.value })}
                            className={`w-full border p-3 rounded-lg focus:outline-none ${isEditing ? "border-blue-400 bg-white" : "bg-gray-100 cursor-not-allowed"
                                }`}
                            readOnly={!isEditing}
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Duration</label>
                        <input
                            type="text"
                            value={service.duration}
                            onChange={(e) => setService({ ...service, duration: e.target.value })}
                            className={`w-full border p-3 rounded-lg focus:outline-none ${isEditing ? "border-blue-400 bg-white" : "bg-gray-100 cursor-not-allowed"
                                }`}
                            readOnly={!isEditing}
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Status</label>
                    <select
                        value={service.status}
                        onChange={(e) => setService({ ...service, status: e.target.value })}
                        className={`w-full border p-3 rounded-lg focus:outline-none ${isEditing ? "border-blue-400 bg-white" : "bg-gray-100 cursor-not-allowed"
                            }`}
                        disabled={!isEditing}
                    >
                        <option value="">Select status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-4">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 px-5 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-all hover:cursor-pointer"
                        >
                            Edit Service
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to save changes?")) {
                                        handleEditService();
                                    }
                                }}
                                className="flex-1 px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-all hover:cursor-pointer"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-5 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow hover:bg-gray-600 transition-all hover:cursor-pointer"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
