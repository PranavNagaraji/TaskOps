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

    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            setUser(session?.user);
        };
        checkSession();
    }, []);

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
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-foreground/80">
                Please log in to view your dashboard.
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-background">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Services</h1>
                <button
                    onClick={() => router.push("/admin/services/newService")}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:cursor-pointer hover:bg-primary/90 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    + Add New Service
                </button>
            </div>

            {services.length === 0 ? (
                <p className="text-muted-foreground">No services found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <ServiceCard key={service.SERVICE_ID} service={service} onClick={() => router.push(`/admin/services/editService/${service.SERVICE_ID}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}
