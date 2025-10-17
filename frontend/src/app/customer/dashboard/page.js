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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome, {session?.user?.name}
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage your service requests below.
            </p>
          </div>
          {/* <Link
            href="/requests/new"
            className="mt-4 sm:mt-0 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold"
          >
            + Request New Service
          </Link> */}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500">In Progress</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.processing}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500">Completed</h3>
            <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Your Requests 🛠️
          </h2>
          <div className="overflow-x-auto">
            {myRequests.length > 0 ? (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Service Name</th>
                    <th className="px-6 py-3 font-medium">Cost</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((request) => (
                    <tr key={request.REQUEST_ID} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {request.SERVICE_NAME}
                      </td>
                      <td className="px-6 py-4">₹{request.COST}</td>
                      <td className="px-6 py-4">{request.STATUS}</td>
                      <td className="px-6 py-4">
                        {new Date(request.CREATED_AT).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No requests found yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
