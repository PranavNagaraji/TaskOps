"use client";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

export default function AdminEmployeesPage() {
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Fetch session
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            if (session?.user) setUser(session.user);
            setLoading(false);
        };
        fetchSession();
    }, []);

    // Fetch employees & assignments
    useEffect(() => {
        if (!user) return;

        const fetchEmployees = async () => {
            try {
                // Fetch active employees
                const activeRes = await fetch(`${apiUrl}/api/employees/active`, { cache: "no-store" });
                if (!activeRes.ok) throw new Error("Failed to fetch active employees");
                const activeData = await activeRes.json();

                // Fetch inactive employees
                const inactiveRes = await fetch(`${apiUrl}/api/employees/inactive`, { cache: "no-store" });
                const inactiveData = inactiveRes.ok ? await inactiveRes.json() : [];

                // Fetch all assignments
                const assignRes = await fetch(`${apiUrl}/api/assignments`, { cache: "no-store" });
                const assignments = assignRes.ok ? await assignRes.json() : [];

                // Mark active employees
                const activeMapped = activeData.map(emp => {
                    const hasInProgress = assignments.some(
                        a => a.EMPLOYEE_ID === emp.EMPLOYEE_ID && a.STATUS === "In Progress"
                    );
                    return { ...emp, hasInProgress, isInactive: false };
                });

                // Mark inactive employees
                const inactiveMapped = inactiveData.map(emp => ({
                    ...emp,
                    hasInProgress: false,
                    isInactive: true,
                }));

                // Combine both lists
                setEmployees([...activeMapped, ...inactiveMapped]);
            } catch (err) {
                console.error(err);
                setEmployees([]);
            }
        };
        fetchEmployees();
    }, [user]);

    // Handle employee deletion
    const handleDelete = async (userId) => {
        const confirmed = confirm(
            "Are you sure you want to delete this employee? In-progress assignments will be removed and requests set to Pending."
        );
        if (!confirmed) return;

        try {
            // Delete employee
            const delRes = await fetch(`${apiUrl}/api/users/${userId}`, { method: "DELETE" });
            if (!delRes.ok) throw new Error("Failed to delete user");
            alert("Employee deleted successfully");

            // Update in-progress requests to pending (always)
            const putRes = await fetch(`${apiUrl}/api/requests/incomplete`, { method: "PUT" });
            if (!putRes.ok) throw new Error("Failed to update requests");
            const putData = await putRes.json();
            alert(putData.message);

            // Update frontend state
            setEmployees(prev => prev.filter(e => e.USER_ID !== userId));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (!user || user.role !== "admin")
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Login as admin to view this page</div>;

    if (loading)
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Loading...</div>;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Employees</h1>

            {employees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(e => (
                        <div
                            key={e.USER_ID}
                            className={`bg-white rounded-lg shadow p-5 flex flex-col justify-between border-l-4 ${e.isInactive
                                ? "border-red-500" // Inactive employee card border
                                : e.hasInProgress
                                    ? "border-yellow-500" // Active but has in-progress tasks
                                    : "border-green-500"  // Active and free
                                }`}
                        >
                            <div className="space-y-1">
                                <p><span className="font-semibold">Name:</span> {e.NAME}</p>
                                <p><span className="font-semibold">Email:</span> {e.EMAIL}</p>
                                <p><span className="font-semibold">Role:</span> {e.ROLE}</p>
                                <p><span className="font-semibold">Phone:</span> {e.PHONE}</p>
                                <p><span className="font-semibold">Status:</span> {e.STATUS}</p>
                                {e.hasInProgress && <p className="text-red-600 font-semibold">Has in-progress assignments!</p>}
                            </div>
                            <button
                                onClick={() => handleDelete(e.USER_ID)}
                                className="flex justify-center mt-4 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                            >
                                <Trash2 size={16} className="mr-1" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 w-full text-center">No employees found.</p>
            )}
        </div>
    );
}
