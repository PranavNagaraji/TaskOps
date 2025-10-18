"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

export default function NewRequestPage() {
    const router = useRouter();

    // ✅ All hooks called unconditionally
    const [session, setSession] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);

    const [services, setServices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load session on mount
    useEffect(() => {
        getSession().then((sess) => {
            setSession(sess);
            setLoadingSession(false);
        });
    }, []);

    // Fetch services on mount
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

    // Filter services based on search
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

    // Early return for loading session
    if (loadingSession) return null;

    // Early return for not logged in
    if (!session)
        return (
            <div className="flex min-w-screen text-gray-500 px-6 py-4 justify-center">
                You must be logged in
            </div>
        );

    // Format duration
    const formatDuration = (minutes) => {
        if (!minutes) return "0 min";
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const parts = [];
        if (hrs) parts.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
        if (mins) parts.push(`${mins} min`);
        return parts.join(" ");
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!selected) {
            alert("Please select a service to request.");
            return;
        }

        setLoading(true);
        try {
            const userId = session?.user?.id;
            if (!userId) {
                alert("User not logged in!");
                setLoading(false);
                return;
            }

            const customerRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customers/${userId}`
            );
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">Request a New Service</h1>

            <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded w-full max-w-md mb-4"
            />

            <div className="w-full max-w-md mb-4">
                {filtered.length > 0 ? (
                    filtered.map((service) => (
                        <div
                            key={service.SERVICE_ID}
                            className={`p-3 mb-2 border rounded cursor-pointer ${selected?.SERVICE_ID === service.SERVICE_ID
                                    ? "bg-blue-100 border-blue-500"
                                    : "bg-white"
                                }`}
                            onClick={() => setSelected(service)}
                        >
                            <h3 className="font-semibold">{service.NAME}</h3>
                            {service.DESCRIPTION && (
                                <p className="text-gray-600">{service.DESCRIPTION}</p>
                            )}
                            <p className="text-gray-800 font-medium">
                                Cost: ${service.COST} | Duration: {formatDuration(service.DURATION)}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No services found.</p>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Submitting..." : "Request Service"}
            </button>
        </div>
    );
}
