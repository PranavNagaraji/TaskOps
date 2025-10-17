import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";

async function getAssignedRequests(employeeId) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/assignments/employee/${employeeId}`, {
            method: "GET",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch requests");
        return res.json();
    } catch (error) {
        console.error("Error fetching employee requests:", error);
        return [];
    }
}

export default async function EmployeeDashboard() {
    const session = await getServerSession(authOptions);

    // Redirect or show message if no session
    if (!session || session.user.role !== "employee") {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
                You must be logged in as an employee to view this page.
            </div>
        );
    }

    const employeeId = session.user.id;
    const myAssigned = await getAssignedRequests(employeeId);

    const stats = {
        total: myAssigned.length,
        inProgress: myAssigned.filter(r => r.STATUS !== "Completed").length,
        completed: myAssigned.filter(r => r.STATUS === "Completed").length,
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Welcome back, {session.user.name}!
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Here’s an overview of your assigned service requests.
                        </p>
                    </div>
                    <Link
                        href="/employee/requests"
                        className="mt-4 sm:mt-0 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold"
                    >
                        All Requests
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500">Total Assigned</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500">In Progress</h3>
                        <p className="text-3xl font-bold text-yellow-500">{stats.inProgress}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500">Completed</h3>
                        <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
                    </div>
                </div>

                {/* Assigned Requests Table */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Assigned Requests:
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Service</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Date Assigned</th>
                                    <th className="px-6 py-3 font-medium">Completed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myAssigned.map((req) => (
                                    <tr key={req.ASSIGNMENT_ID} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{req.CUSTOMER_NAME}</td>
                                        <td className="px-6 py-4">{req.SERVICE_NAME}</td>
                                        <td className="px-6 py-4">{req.STATUS}</td>
                                        <td className="px-6 py-4">{new Date(req.CREATED_AT).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {req.COMPLETED_AT ? new Date(req.COMPLETED_AT).toLocaleString() : "Not Yet Completed"}
                                        </td>
                                    </tr>
                                ))}
                                {myAssigned.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-gray-500 px-6 py-4">
                                            No assigned requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
