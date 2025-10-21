// components/ServiceCard.jsx
"use client";

export default function ServiceCard({ service, onClick }) {
    const STATUS = service.STATUS.charAt(0).toUpperCase() + service.STATUS.slice(1).toLowerCase();
    return (
        <div
            className="hover:cursor-pointer bg-white flex flex-col rounded-2xl shadow-sm p-5 hover:shadow-md transition justify-between min-h-full border border-border"
            onClick={onClick}
        >
            <div>
                <h2 className="text-lg font-semibold text-foreground">{service.NAME}</h2>
                <p className="text-muted-foreground text-sm mt-1">{service.DESCRIPTION}</p>
            </div>
            <div className="mt-3 text-sm text-foreground/80">
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
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                            }`}
                    >
                        {STATUS}
                    </span>
                </p>
            </div>
        </div >
    );
}
