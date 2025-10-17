import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";

export default async function AdminDashboard() {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (user.role !== "admin") return <>Please Login To Continue</>;

    const [reqRes, assignRes, empRes] = await Promise.all([
        fetch(`${apiUrl}/api/requests`, { cache: "no-store" }),
        fetch(`${apiUrl}/api/assignments`, { cache: "no-store" }),
        fetch(`${apiUrl}/api/employees`, { cache: "no-store" }),
    ]);

    if (!reqRes.ok || !assignRes.ok || !empRes.ok)
        throw new Error("One of the API calls failed");

    const [requests, assignments, employees] = await Promise.all([
        reqRes.json(),
        assignRes.json(),
        empRes.json(),
    ]);

    const completedRequests = requests.filter(r => r.STATUS === "Completed").length;
    const pendingRequests = requests.filter(r => r.STATUS === "Pending").length;
    const inProgressRequests = requests.filter(r => r.STATUS === "In Progress").length;

    const activeEmployees = employees.filter(e => e.STATUS === "Active").length;
    const acceptPercent = (assignments.length / requests.length) * 100;

    const stats = [
        { title: "Total Requests", count: requests.length, color: "bg-blue-100", text: "text-blue-800" },
        { title: "Assignments underway", count: assignments.length, color: "bg-green-100", text: "text-green-800" },
        { title: "Employees strength", count: employees.length, color: "bg-yellow-100", text: "text-yellow-800" },
    ];

    return (
        <main className="min-h-screen p-12 bg-gray-50 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-12">Admin Dashboard</h1>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl mb-12">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className={`${stat.color} p-8 rounded-2xl shadow-lg flex flex-col items-center`}
                    >
                        <h3 className="text-lg font-medium text-gray-500 mb-2">{stat.title}</h3>
                        <p className={`text-4xl font-bold ${stat.text}`}>{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* Request Breakdown */}
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-md mb-12">
                <h2 className="text-2xl font-semibold mb-8 text-gray-800 border-b pb-4">Request Breakdown</h2>

                <div className="grid grid-cols-3 gap-8 text-center">
                    {[
                        { label: "Completed", count: completedRequests, color: "green" },
                        { label: "In Progress", count: inProgressRequests, color: "blue" },
                        { label: "Pending", count: pendingRequests, color: "red" },
                    ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center">
                            <div className={`w-24 h-24 rounded-full bg-${item.color}-100 flex items-center justify-center shadow-inner`}>
                                <p className={`text-3xl font-bold text-${item.color}-700`}>
                                    {((item.count / requests.length) * 100).toFixed(0)}%
                                </p>
                            </div>
                            <p className="mt-3 text-gray-700 font-semibold">{item.label}</p>
                            <p className="text-gray-500">{item.count} total</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee Summary */}
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-md mt-12">
                <h2 className="text-2xl font-semibold mb-8 text-gray-800 border-b pb-4">Employee Summary</h2>

                <div className="grid grid-cols-2 gap-8 text-center">
                    {/* Active Employees */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="50"
                                    stroke="#E5E7EB"
                                    strokeWidth="10"
                                    fill="none"
                                />
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="50"
                                    stroke={activeEmployees / employees.length < 0.5 ? "red" : "#10B981"}
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${((activeEmployees / employees.length) * 314).toFixed(1)}, 314`}
                                    strokeLinecap="round"
                                    className="transition-all duration-700 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-2xl font-bold text-green-700">
                                    {((activeEmployees / employees.length) * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-gray-700 font-semibold">Active Employees</p>
                        <p className="text-gray-500">{activeEmployees} / {employees.length}</p>
                    </div>

                    {/* Requests Fulfilled */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="50"
                                    stroke="#E5E7EB"
                                    strokeWidth="10"
                                    fill="none"
                                />
                                <circle
                                    cx="56"
                                    cy="56"
                                    r="50"
                                    stroke={acceptPercent < 50 ? "red" : "#8B5CF6"}
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${((acceptPercent / 100) * 314).toFixed(1)}, 314`}
                                    strokeLinecap="round"
                                    className="transition-all duration-700 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className={`text-2xl font-bold ${acceptPercent < 50 ? "text-red-600" : "text-purple-700"}`}>
                                    {acceptPercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-gray-700 font-semibold">Requests Fulfilled</p>
                        <p className="text-gray-500">Across all customers</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
