import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import ChatButton from "@/app/components/ChatButton.jsx";
 

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
    // Sum COST for completed requests as total earnings
    const totalEarnings = myAssigned
        .filter(r => r.STATUS === "Completed")
        .reduce((sum, r) => sum + (Number(r.COST) || 0), 0);

    const activeAssignments = myAssigned
        .filter(r => r.STATUS !== "Completed")
        .sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));

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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
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
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500">Total Earnings</h3>
                        <p className="text-3xl font-bold text-blue-600">₹{totalEarnings.toFixed(2)}</p>
                    </div>
                </div>
                {employeeRecord && (
                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                      <h3 className="text-gray-500">Role</h3>
                      <p className="text-2xl font-semibold text-gray-800">{employeeRecord.ROLE || "Not set"}</p>
                    </div>
                  </div>
                )}

                {/* Active Assignments with Chat */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Assignments</h2>
                    {activeAssignments.length === 0 ? (
                      <div className="text-sm text-gray-500">No active assignments.</div>
                    ) : (
                      <div className="space-y-4">
                        {activeAssignments.map((a) => (
                          <div key={a.REQUEST_ID} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4">
                            <div>
                              <div className="text-sm text-gray-500">Service</div>
                              <div className="text-base font-semibold text-gray-900">{a.SERVICE_NAME}</div>
                              <div className="text-xs text-gray-600 mt-1">  stomer: {a.CUSTOMER_NAME || "N/A"}</div>
                              <div className="text-xs text-gray-600">Created: {new Date(a.CREATED_AT).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                a.STATUS === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                a.STATUS === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {a.STATUS}
                              </span>
                              <ChatButton
                                requestId={a.REQUEST_ID}
                                userId={employeeId}
                                userType="employee"
                                userName={session.user.name || ''}
                                label={a.STATUS !== 'Completed' ? 'Chat with Customer' : 'Chat (Disabled)'}
                                disabled={a.STATUS === 'Completed'}
                                title={`Request #${a.REQUEST_ID}`}
                                subtitle={`Service: ${a.SERVICE_NAME}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
            </div>
        </div>
    );
}
