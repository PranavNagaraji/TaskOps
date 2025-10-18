"use client";
import { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";

export default function AdminRequestsPage() {
    const [user, setUser] = useState(null);
    const [data, setData] = useState({ assigned: [], unassigned: [] });
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(""); // store userId of employee
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Fetch logged-in admin session
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            if (session?.user) setUser(session.user);
        };
        fetchSession();
    }, []);

    // Fetch all requests
    useEffect(() => {
        if (!user) return;

        const fetchRequests = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/assignments/requests/all`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch requests");
                const json = await res.json();

                // Sort assigned
                json.assigned.sort((a, b) => {
                    const order = { "In Progress": 1, "Pending": 2, "Completed": 3 };
                    return (order[a.REQUEST_STATUS] || 4) - (order[b.REQUEST_STATUS] || 4);
                });

                setData(json);
            } catch (err) {
                console.error(err);
                setData({ assigned: [], unassigned: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user]);

    // Search & filter helpers
    const handleSearch = (items) => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.CUSTOMER_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.EMPLOYEE_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.SERVICE_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filteredAssigned = useMemo(() => {
        let items = handleSearch(data.assigned);
        if (filterStatus !== "All") items = items.filter(a => a.REQUEST_STATUS === filterStatus);
        return items;
    }, [data.assigned, filterStatus, searchTerm]);

    const filteredUnassigned = useMemo(() => {
        let items = handleSearch(data.unassigned);
        if (filterStatus !== "All") items = items.filter(r => r.REQUEST_STATUS === filterStatus);
        return items;
    }, [data.unassigned, filterStatus, searchTerm]);

    const getStatusColor = (status, isUnassigned = false) => {
        if (isUnassigned && status === "Completed") return "bg-gray-100 text-gray-800 border-gray-400";
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-500";
            case "In Progress": return "bg-blue-100 text-blue-800 border-blue-500";
            case "Completed": return "bg-green-100 text-green-800 border-green-500";
            default: return "bg-gray-100 text-gray-800 border-gray-400";
        }
    };

    // When a request card is clicked
    const handleRequestClick = (request) => {
        setSelectedRequest(request);
        setSelectedEmployeeId(""); // reset selection
        setShowConfirmModal(true);
    };

    // Fetch active employees and open assignment modal
    const confirmAssign = async () => {
        setShowConfirmModal(false);
        try {
            const res = await fetch(`${apiUrl}/api/employees/active`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch employees");
            const json = await res.json();
            setEmployees(json.filter(emp => emp.STATUS === "Active"));
            setShowAssignModal(true);
        } catch (err) {
            console.error(err);
            alert("Failed to load employees");
        }
    };

    // Assign request to selected employee (send USER_ID)
    const handleAssign = async () => {
        if (!selectedEmployeeId) {
            alert("Please select an employee");
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/api/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: selectedRequest.REQUEST_ID,
                    userId: selectedEmployeeId, // send USER_ID here
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Server response:", text);
                throw new Error("Failed to assign request");
            }

            alert("Request assigned successfully!");
            setShowAssignModal(false);

            // Refresh requests
            const refreshed = await fetch(`${apiUrl}/api/assignments/requests/all`, { cache: "no-store" });
            const json = await refreshed.json();
            json.assigned.sort((a, b) => {
                const order = { "In Progress": 1, "Pending": 2, "Completed": 3 };
                return (order[a.REQUEST_STATUS] || 4) - (order[b.REQUEST_STATUS] || 4);
            });
            setData(json);

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Request card component
    const Card = ({ children, status, isUnassigned = false, onClick }) => (
        <div
            onClick={onClick}
            className={`flex flex-col border-l-4 ${getStatusColor(status, isUnassigned)} rounded-lg shadow hover:shadow-xl transition-shadow duration-200 p-5 h-full cursor-pointer`}
        >
            {children}
        </div>
    );

    if (!user || user.role !== "admin") {
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Login as admin to view this page</div>;
    }
    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <input
                    type="text"
                    placeholder="Search by customer, employee, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded-lg p-2 flex-1"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg p-2 bg-white"
                >
                    <option value="All">All</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            {/* Assigned Requests */}
            <section className="mb-12">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Assigned Requests</h1>
                {filteredAssigned.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssigned.map(a => (
                            <Card key={a.ASSIGNMENT_ID} status={a.REQUEST_STATUS}>
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-lg font-semibold text-gray-800">Service: {a.SERVICE_NAME}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(a.REQUEST_STATUS)}`}>
                                        {a.REQUEST_STATUS}
                                    </span>
                                </div>
                                <div className="text-gray-600 space-y-1">
                                    <p><span className="font-semibold">Customer:</span> {a.CUSTOMER_NAME}</p>
                                    <p><span className="font-semibold">Assigned To:</span> {a.EMPLOYEE_NAME}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center">No assigned requests found.</p>
                )}
            </section>

            {/* Unassigned Requests */}
            <section>
                <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Unassigned Requests</h1>
                {filteredUnassigned.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnassigned.map(r => (
                            <Card key={r.REQUEST_ID} status={r.REQUEST_STATUS} isUnassigned onClick={() => handleRequestClick(r)}>
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-lg font-semibold text-gray-800">Service: {r.SERVICE_NAME}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(r.REQUEST_STATUS, true)}`}>
                                        {r.REQUEST_STATUS}
                                    </span>
                                </div>
                                <div className="text-gray-600 space-y-1">
                                    <p><span className="font-semibold">Customer:</span> {r.CUSTOMER_NAME}</p>
                                    <p><span className="font-semibold">Phone:</span> {r.CUSTOMER_PHONE}</p>
                                    <p><span className="font-semibold">Email:</span> {r.CUSTOMER_EMAIL}</p>
                                    <p><span className="font-semibold">Address:</span> {r.CUSTOMER_ADDRESS}</p>
                                </div>
                                <div className="mt-3 text-gray-500 text-sm">
                                    <p><span className="font-semibold">Created At:</span> {new Date(r.REQUEST_CREATED_AT).toLocaleString()}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center">No unassigned requests found.</p>
                )}
            </section>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-lg text-center">
                        <h2 className="text-xl font-semibold mb-4">Assign Request?</h2>
                        <p className="text-gray-600 mb-6">Do you want to assign this request to an employee?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button onClick={confirmAssign} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Yes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Assign Request</h2>
                        <p className="text-gray-600 mb-4">Service: {selectedRequest?.SERVICE_NAME}</p>
                        <select
                            value={selectedEmployeeId || ""}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-4"
                        >
                            <option value="">Select an employee</option>
                            {employees.map(emp => (
                                <option key={emp.USER_ID} value={emp.USER_ID}>
                                    {emp.EMPLOYEE_ID} - {emp.NAME} ({emp.EMAIL})
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button onClick={handleAssign} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
