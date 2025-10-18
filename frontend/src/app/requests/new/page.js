"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import ServiceCard from "@/app/components/ServiceCard";

export default function NewRequestPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [services, setServices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load session
    useEffect(() => {
        getSession().then((sess) => {
            setSession(sess);
            setLoadingSession(false);
        });
    }, []);

    // Fetch services
    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services`);
                const data = await res.json();
                const servicesArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data.services)
                        ? data.services
                        : [];
                setServices(servicesArray);
                setFiltered(servicesArray);
            } catch (err) {
                console.error("Failed to load services:", err);
                setServices([]);
                setFiltered([]);
            }
        }
        fetchServices();
    }, []);

    // Filter services
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            Array.isArray(services)
                ? services.filter(
                    (s) =>
                        s.NAME.toLowerCase().includes(q) ||
                        (s.DESCRIPTION && s.DESCRIPTION.toLowerCase().includes(q))
                )
                : []
        );
    }, [search, services]);

    if (loadingSession) return null;
    if (!session)
        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500 px-6 py-4">
                You must be logged in
            </div>
        );

    const handleSubmit = async () => {
        if (!selected) {
            alert("Please select a service to request.");
            return;
        }

        if (!confirm(`Are you sure you want to request "${selected.NAME}"?`)) return;

        setLoading(true);
        try {
            const userId = session?.user?.id;
            if (!userId) {
                alert("User not logged in!");
                setLoading(false);
                return;
            }

            const customerRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customers/${userId}`);
            const customerData = await customerRes.json();
            const customerId = customerData?.[0]?.CUSTOMER_ID;

            if (!customerId) {
                alert("No customer found for this user.");
                setLoading(false);
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: selected.SERVICE_ID,
                    customerId,
                }),
            });

            if (res.ok) {
                alert("Request created successfully!");
                router.push("/customer/dashboard");
            } else {
                const errMsg = await res.text();
                alert(`Failed to create request: ${errMsg}`);
            }
        } catch (err) {
            console.error("Error creating request:", err);
            alert("Something went wrong while creating the request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-gray-800">Request a New Service</h1>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl mb-8 items-center">
                <input
                    type="text"
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2 w-full sm:flex-1 transition"
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? "Submitting..." : "Request Service"}
                </button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {filtered.length > 0 ? (
                    filtered.map((service) => (
                        <div
                            key={service.SERVICE_ID}
                            className={`cursor-pointer rounded-2xl overflow-hidden border transition-all transform hover:scale-105 hover:shadow-lg ${selected?.SERVICE_ID === service.SERVICE_ID
                                ? "ring-4 ring-blue-500 scale-105"
                                : "ring-0"
                                }`}
                            onClick={() => setSelected(service)}
                        >
                            <ServiceCard service={service} />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 col-span-full text-center py-10 text-lg">No services found.</p>
                )}
            </div>
        </div>
    );
}
