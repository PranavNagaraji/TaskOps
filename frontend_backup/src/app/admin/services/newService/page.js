"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewServicePage() {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", description: "", cost: "", duration: "" });
    const [hours, setHours] = useState("");
    const [minutes, setMinutes] = useState("");

    const handleAddService = async () => {
        const { name, description, cost } = formData;

        if (!name.trim() || !description.trim() || !cost.trim() || (!hours && !minutes)) {
            alert("Please fill in all fields.");
            return false;
        }

        const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);

        try {
            const res = await fetch(`${apiUrl}/api/services`, {
                method: "POST",
                body: JSON.stringify({ ...formData, duration: totalMinutes }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.message || "Failed to add service.");
                return false;
            }

            return true;
        } catch (err) {
            alert("An error occurred while adding service.");
            return false;
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Add New Service</h1>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!confirm("Are you sure you want to add this service?")) return;

                    const success = await handleAddService();
                    if (success) {
                        router.push("/admin/services");
                    }
                }}
                className="space-y-4"
            >
                {/* Service Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter service name"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        maxLength={490}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                        placeholder="Describe the service"
                    />
                </div>

                {/* Cost */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                    <input
                        type="number"
                        name="cost"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        onWheel={(e) => e.currentTarget.blur()}
                        min={100}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter cost in ₹"
                    />
                </div>

                {/* Duration: Hours + Minutes */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                            type="number"
                            min="0"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="0"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-transform duration-150 hover:cursor-pointer"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
