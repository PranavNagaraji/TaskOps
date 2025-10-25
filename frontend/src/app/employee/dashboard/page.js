import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import RoleCard from "./RoleCard";

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
    if (!session || session.user.role !== "employee") {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
                You must be logged in as an employee to view this page.
            </div>
        );
    }

    const employeeId = session.user.id;
    const myAssigned = await getAssignedRequests(employeeId);

    async function getEmployeeRecord(userId) {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employees`, { method: "GET", cache: "no-store" });
            if (!res.ok) return null;
            const list = await res.json();
            return Array.isArray(list) ? list.find(e => String(e.USER_ID) === String(userId)) : null;
        } catch (_) {
            return null;
        }
    }

    const employeeRecord = await getEmployeeRecord(employeeId);

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
                {employeeRecord && (
                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <RoleCard employeeId={employeeRecord.EMPLOYEE_ID} initialRole={employeeRecord.ROLE || ""} />
                  </div>
                )}
            </div>
        </div>
    );
}
