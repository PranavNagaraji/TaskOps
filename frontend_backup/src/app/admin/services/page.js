"use client";

import ServiceCard from "@/app/components/ServiceCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

export default function AdminServicesPage() {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const router = useRouter();

    // Check session
    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession(); // client-safe
            setUser(session?.user);
        };
        checkSession();
    }, []);

    // Fetch services
    useEffect(() => {
        const handleGetServices = async () => {
            if (!user || user.role !== "admin") return; // wait for user check
            try {
                const res = await fetch(`${apiUrl}/api/services`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch services");
                const data = await res.json();
                setServices(data);
            } catch (err) {
                console.error(err);
            }
        };
        handleGetServices();
    }, [user, apiUrl]);

    if (!user || user.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
                Please log in to view your dashboard.
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Services</h1>
                <button
                    onClick={() => router.push("/admin/services/newService")}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:cursor-pointer hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all duration-200"
                >
                    + Add New Service
                </button>
            </div>

            {services.length === 0 ? (
                <p className="text-gray-500">No services found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <ServiceCard key={service.SERVICE_ID} service={service} />
                    ))}
                </div>
            )}
        </div>
    );
}
