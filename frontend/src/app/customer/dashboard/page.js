import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";

async function getServiceRequests() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests/all`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch service requests");
    return res.json();
  } catch (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
}

async function getCustomerId(userId) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customers/${userId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data?.[0]?.CUSTOMER_ID || null;
  } catch (err) {
    console.error("Error fetching customer by user ID:", err);
    return null;
  }
}

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
        Please log in to view your dashboard.
      </div>
    );
  }

  const allRequests = await getServiceRequests();
  const customerId = await getCustomerId(userId);
  const myRequests = allRequests.filter(
    (request) => request.CUSTOMER_ID === customerId
  );

  const stats = {
    total: myRequests.length,
    processing: myRequests.filter((r) => r.STATUS !== "Completed").length,
    completed: myRequests.filter((r) => r.STATUS === "Completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-2">
              Welcome, {session?.user?.name}
            </h1>
            <p className="text-gray-500 text-lg">
              Here’s an overview of your service requests.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <h3 className="text-gray-500 font-medium text-lg mb-3">Total Requests</h3>
            <p className="text-5xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <h3 className="text-gray-500 font-medium text-lg mb-3">In Progress</h3>
            <p className="text-5xl font-bold text-yellow-500">{stats.processing}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <h3 className="text-gray-500 font-medium text-lg mb-3">Completed</h3>
            <p className="text-5xl font-bold text-green-500">{stats.completed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
