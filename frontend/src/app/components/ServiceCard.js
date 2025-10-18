// components/ServiceCard.jsx
"use client";

export default function ServiceCard({ service, onClick }) {
    const STATUS = service.STATUS.charAt(0).toUpperCase() + service.STATUS.slice(1).toLowerCase();
    return (
        <div
            className="hover:cursor-pointer bg-white flex flex-col rounded-2xl shadow-md p-5 hover:shadow-lg transition justify-between min-h-full"
            onClick={onClick}
        >
            <div>
                <h2 className="text-lg font-semibold text-gray-700">{service.NAME}</h2>
                <p className="text-gray-500 text-sm mt-1">{service.DESCRIPTION}</p>
            </div>
            <div className="mt-3 text-sm text-gray-600">
                <p>
                    <span className="font-medium">Cost:</span> ₹{service.COST}
                </p>
                <p>
                    <span className="font-medium">Duration:</span> {service.DURATION / 60 > 0 ? `${service.DURATION / 60} hr ` : ""} {service.DURATION % 60 > 0 ? `${service.DURATION % 60} min ` : ""}
                </p>
                <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                            }`}
                    >
                        {STATUS}
                    </span>
                </p>
            </div>
        </div >
    );
}
