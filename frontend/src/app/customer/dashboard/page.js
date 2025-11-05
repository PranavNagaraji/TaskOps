import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import ChatButton from "@/app/components/ChatButton.jsx";

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
  const myRequests = allRequests.filter((request) => request.CUSTOMER_ID === customerId);

  // Removed current request card

  // All assigned requests for this customer (via assignments view)
  let myAssigned = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/assignments/requests/all`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      const assignmentsView = await res.json();
      const assigned = Array.isArray(assignmentsView.assigned) ? assignmentsView.assigned : [];
      myAssigned = assigned
        .filter((r) => Number(r.CUSTOMER_ID) === Number(customerId))
        .sort((a, b) => new Date(b.REQUEST_CREATED_AT) - new Date(a.REQUEST_CREATED_AT));
    }
  } catch (err) {
    console.error("Error fetching assignments view:", err);
  }

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

        {/* Current Request card removed as per requirement */}

        {/* In-Progress Assigned Requests */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">In-Progress Assigned Requests</h2>
          {myAssigned.filter(r => r.REQUEST_STATUS === 'In Progress').length === 0 ? (
            <div className="text-gray-500 text-sm">No assigned requests yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myAssigned
                .filter((r) => r.REQUEST_STATUS === 'In Progress')
                .map((r) => (
                <div key={r.REQUEST_ID} className="bg-white p-5 rounded-xl shadow border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Service</div>
                      <div className="text-lg font-semibold text-gray-900">{r.SERVICE_NAME}</div>
                      <div className="text-xs text-gray-600 mt-1">Assigned To: {r.EMPLOYEE_NAME}</div>
                      <div className="text-xs text-gray-600">Created: {new Date(r.REQUEST_CREATED_AT).toLocaleString()}</div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${r.REQUEST_STATUS === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        r.REQUEST_STATUS === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {r.REQUEST_STATUS}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <ChatButton
                      requestId={r.REQUEST_ID}
                      userId={userId}
                      userType="customer"
                      userName={session?.user?.name || ''}
                      label={r.REQUEST_STATUS === 'In Progress' ? 'Chat with Employee' : 'Chat (Disabled)'}
                      disabled={r.REQUEST_STATUS !== 'In Progress'}
                      title={`Request #${r.REQUEST_ID}`}
                      subtitle={`Service: ${r.SERVICE_NAME}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
