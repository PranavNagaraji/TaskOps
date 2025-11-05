"use client";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

export default function AdminEmployeesPage() {
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactiveModal, setShowInactiveModal] = useState(false);
    const [inactiveInfo, setInactiveInfo] = useState([]);
    const [checkingEmployees, setCheckingEmployees] = useState(new Set());
    const [isRunningCheck, setIsRunningCheck] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [resultType, setResultType] = useState("success"); // success | error
    const [resultMessage, setResultMessage] = useState("");
    const [pendingUserId, setPendingUserId] = useState(null);
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    // const MAX_INACTIVE_DAYS = 60;
    const MAX_INACTIVE_DAYS = 1 / (60 * 24);

    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            if (session?.user) setUser(session.user);
            setLoading(false);
        };
        fetchSession();
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchEmployees = async () => {
            try {
                const activeRes = await fetch(`${apiUrl}/api/employees/active`, { cache: "no-store" });
                if (!activeRes.ok) throw new Error("Failed to fetch active employees");
                const activeData = await activeRes.json();

                const inactiveRes = await fetch(`${apiUrl}/api/employees/inactive`, { cache: "no-store" });
                const inactiveData = inactiveRes.ok ? await inactiveRes.json() : [];

                const assignRes = await fetch(`${apiUrl}/api/assignments`, { cache: "no-store" });
                const assignments = assignRes.ok ? await assignRes.json() : [];

                const activeMapped = activeData.map(emp => {
                    const hasInProgress = assignments.some(
                        a => a.EMPLOYEE_ID === emp.EMPLOYEE_ID && a.STATUS === "In Progress"
                    );
                    return { ...emp, hasInProgress, isInactive: false };
                });

                const inactiveMapped = inactiveData.map(emp => ({
                    ...emp,
                    hasInProgress: false,
                    isInactive: true,
                }));

                setEmployees([...activeMapped, ...inactiveMapped]);
            } catch (err) {
                console.error(err);
                setEmployees([]);
            }
        };
        fetchEmployees();
    }, [user]);

    useEffect(() => {
        const key = "inactiveEmployees";
        const now = Date.now();
        const map = JSON.parse(localStorage.getItem(key) || "{}");
        const inactiveNow = employees.filter(e => e.isInactive);
        let changed = false;
        inactiveNow.forEach(e => {
            const id = String(e.USER_ID);
            if (!map[id]) {
                map[id] = { firstSeenInactive: now };
                changed = true;
            }
        });
        const activeNow = employees.filter(e => !e.isInactive);
        activeNow.forEach(e => {
            const id = String(e.USER_ID);
            if (map[id]) {
                delete map[id];
                changed = true;
            }
        });
        if (changed) localStorage.setItem(key, JSON.stringify(map));
    }, [employees]);

    useEffect(() => {
        if (!employees.length) return;
        const id = setInterval(() => {
            runAutoDeletionCheck(false);
            // }, 24 * 60 * 60 * 1000);
        }, 60 * 1000);
        return () => clearInterval(id);
    }, [employees]);

    const handleDelete = async (userId) => {
        setPendingUserId(userId);
        setConfirmOpen(true);
    };

    const performDeletion = async () => {
        if (!pendingUserId) return;
        try {
            const delRes = await fetch(`${apiUrl}/api/users/${pendingUserId}`, { method: "DELETE" });
            if (!delRes.ok) throw new Error("Failed to delete user");

            let extraMsg = "";
            try {
                const putRes = await fetch(`${apiUrl}/api/requests/incomplete`, { method: "PUT" });
                if (putRes.ok) {
                    const putData = await putRes.json();
                    extraMsg = putData?.message ? ` ${putData.message}` : "";
                } else {
                    extraMsg = " Requests update failed.";
                }
            } catch (_) {
                extraMsg = " Requests update failed.";
            }

            setEmployees(prev => prev.filter(e => e.USER_ID !== pendingUserId));
            const key = "inactiveEmployees";
            const map = JSON.parse(localStorage.getItem(key) || "{}");
            delete map[String(pendingUserId)];
            localStorage.setItem(key, JSON.stringify(map));

            setResultType("success");
            setResultMessage(`Employee deleted successfully.${extraMsg}`.trim());
            setResultOpen(true);
        } catch (err) {
            console.error(err);
            setResultType("error");
            setResultMessage(err.message || "Failed to delete user");
            setResultOpen(true);
        } finally {
            setConfirmOpen(false);
            setPendingUserId(null);
        }
    };

    const computeInactiveInfo = () => {
        const key = "inactiveEmployees";
        const map = JSON.parse(localStorage.getItem(key) || "{}");
        const now = Date.now();
        const list = employees
            .filter(e => e.isInactive)
            .map(e => {
                const id = String(e.USER_ID);
                const first = map[id]?.firstSeenInactive || now;
                // const daysInactive = Math.floor((now - first) / (1000 * 60 * 60 * 24));
                const daysInactive = (now - first) / (1000 * 60 * 60 * 24);
                const daysRemaining = Math.max(0, MAX_INACTIVE_DAYS - daysInactive);
                return { id: e.USER_ID, name: e.NAME, email: e.EMAIL, daysInactive, daysRemaining };
            })
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
        setInactiveInfo(list);
    };

    const addNotification = (message, type = "info") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        // Add as visible so it can slide in
        setNotifications(prev => [...prev, { id, message, type, visible: true }]);
        // Start slide-out slightly before removal
        const hideAfterMs = 1800;
        const removeAfterMs = 2000;
        setTimeout(() => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, visible: false } : n));
        }, hideAfterMs);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, removeAfterMs);
    };

    const runAutoDeletionCheck = async (showAlerts = true) => {
        setIsRunningCheck(true);
        addNotification("Starting deactivation check...", "info");

        const key = "inactiveEmployees";
        const map = JSON.parse(localStorage.getItem(key) || "{}");
        const now = Date.now();
        const list = employees
            .filter(e => e.isInactive)
            .map(e => {
                const id = String(e.USER_ID);
                const first = map[id]?.firstSeenInactive || now;
                // const daysInactive = Math.floor((now - first) / (1000 * 60 * 60 * 24));
                const daysInactive = (now - first) / (1000 * 60 * 60 * 24);
                const daysRemaining = Math.max(0, MAX_INACTIVE_DAYS - daysInactive);
                return { id: e.USER_ID, name: e.NAME, daysRemaining };
            });

        if (list.length === 0) {
            addNotification("No inactive employees found", "success");
            setIsRunningCheck(false);
            return;
        }

        addNotification(`Checking ${list.length} inactive employee(s)...`, "info");

        const toDelete = list.filter(x => x.daysRemaining <= 0);

        if (toDelete.length === 0) {
            addNotification(`Check complete: No employees eligible for deletion`, "success");
            setIsRunningCheck(false);
            return;
        }

        addNotification(`Found ${toDelete.length} employee(s) eligible for deletion`, "warning");

        let deletedCount = 0;
        for (const item of toDelete) {
            setCheckingEmployees(prev => new Set(prev).add(item.id));
            try {
                const delRes = await fetch(`${apiUrl}/api/users/${item.id}`, { method: "DELETE" });
                if (!delRes.ok) {
                    addNotification(`Failed to delete ${item.name}`, "error");
                    continue;
                }
                await fetch(`${apiUrl}/api/requests/incomplete`, { method: "PUT" });
                setEmployees(prev => prev.filter(e => e.USER_ID !== item.id));
                const map2 = JSON.parse(localStorage.getItem(key) || "{}");
                delete map2[String(item.id)];
                localStorage.setItem(key, JSON.stringify(map2));
                addNotification(`Deleted inactive employee: ${item.name}`, "success");
                deletedCount++;
            } catch (err) {
                addNotification(`Error deleting ${item.name}`, "error");
            } finally {
                setCheckingEmployees(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(item.id);
                    return newSet;
                });
            }
        }

        addNotification(`Deactivation check complete: ${deletedCount} employee(s) deleted`, "success");
        setIsRunningCheck(false);
    };

    if (!user || user.role !== "admin")
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Login as admin to view this page</div>;

    if (loading)
        return <div className="flex min-h-screen items-center justify-center text-gray-500 text-lg">Loading...</div>;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">Employees</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => { computeInactiveInfo(); setShowInactiveModal(true); }}
                        className="px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors duration-200"
                    >
                        Check Inactive Durations
                    </button>
                    <button
                        onClick={() => runAutoDeletionCheck(true)}
                        disabled={isRunningCheck}
                        className={`px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 ${isRunningCheck ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {isRunningCheck && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Run Deactivation Check
                    </button>
                </div>
            </div>

            {employees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(e => (
                        <div
                            key={e.USER_ID}
                            className={`bg-white rounded-lg shadow p-5 flex flex-col justify-between border-l-4 relative ${e.isInactive
                                ? "border-red-500"
                                : e.hasInProgress
                                    ? "border-yellow-500"
                                    : "border-green-500"
                                } ${checkingEmployees.has(e.USER_ID) ? "ring-4 ring-blue-400 animate-pulse" : ""}`}
                        >
                            {checkingEmployees.has(e.USER_ID) && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                    Checking...
                                </div>
                            )}
                            <div className="space-y-1">
                                <p><span className="font-semibold">Name:</span> {e.NAME}</p>
                                <p><span className="font-semibold">Email:</span> {e.EMAIL}</p>
                                <p><span className="font-semibold">Role:</span> {e.ROLE}</p>
                                <p><span className="font-semibold">Phone:</span> {e.PHONE}</p>
                                <p><span className="font-semibold">Status:</span> <span
                                    className={`px-2 py-1 rounded-lg text-white ${e.STATUS === "Inactive" ? "bg-red-500" : "bg-green-500"
                                        }`}
                                >
                                    <i>{e.STATUS}</i>
                                </span>
                                </p>
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

            {/* Confirm Delete Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-lg font-semibold">Confirm Deletion</h2>
                            <button onClick={() => setConfirmOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5 text-sm text-gray-700">
                            Are you sure you want to delete this employee? In-progress assignments will be removed and related requests set to Pending.
                        </div>
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
                            <button onClick={() => { setConfirmOpen(false); setPendingUserId(null); }} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={performDeletion} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {resultOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-lg font-semibold">{resultType === 'success' ? 'Success' : 'Error'}</h2>
                            <button onClick={() => setResultOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5 text-sm text-gray-700">
                            {resultMessage}
                        </div>
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
                            <button onClick={() => setResultOpen(false)} className="px-3 py-2 rounded border">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showInactiveModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
                        <div className="flex items-center justify-between px-5 py-3 border-b">
                            <h2 className="text-lg font-semibold">Inactive Employees – Deactivation Countdown</h2>
                            <button onClick={() => setShowInactiveModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5">
                            {inactiveInfo.length ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="text-left text-gray-600">
                                            <tr>
                                                <th className="py-2 pr-4">Name</th>
                                                <th className="py-2 pr-4">Email</th>
                                                {/* <th className="py-2 pr-4">Days Inactive</th> */}
                                                {/* <th className="py-2 pr-4">Days Remaining</th> */}
                                                <th className="py-2 pr-4">Minutes Inactive</th>
                                                <th className="py-2 pr-4">Minutes Remaining</th>
                                            </tr>
                                        </thead>
                                        {/* <tbody>
                                            {inactiveInfo.map(row => (
                                                <tr key={row.id} className="border-t">
                                                    <td className="py-2 pr-4">{row.name}</td>
                                                    <td className="py-2 pr-4">{row.email}</td>
                                                    <td className="py-2 pr-4">{row.daysInactive}</td>
                                                    <td className={`py-2 pr-4 ${row.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-800'}`}>{row.daysRemaining}</td>
                                                </tr>
                                            ))}
                                        </tbody> */}
                                        <tbody>
                                            {inactiveInfo.map(row => {
                                                const minutesInactive = (row.daysInactive * 1440).toFixed(1);
                                                const minutesRemaining = (row.daysRemaining * 1440).toFixed(1);
                                                // Check if remaining minutes is <= 0 (or very close, due to floating point math)
                                                const isDue = row.daysRemaining <= (1 / 1440);

                                                return (
                                                    <tr key={row.id} className="border-t">
                                                        <td className="py-2 pr-4">{row.name}</td>
                                                        <td className="py-2 pr-4">{row.email}</td>
                                                        <td className="py-2 pr-4">{minutesInactive} min</td>
                                                        <td className={`py-2 pr-4 ${isDue ? 'text-red-600' : 'text-gray-800'}`}>
                                                            {minutesRemaining} min
                                                        </td>
                                                    </tr>
                                                );
                                                S
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-gray-500">No inactive employees.</div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
                            <button onClick={() => setShowInactiveModal(false)} className="px-3 py-2 rounded border">Close</button>
                            <button onClick={() => runAutoDeletionCheck(true)} className="px-3 py-2 bg-red-600 text-white rounded">Run Deactivation Check</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {notifications.map((notif, idx) => (
                    <div
                        key={notif.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${notif.visible !== false ? 'animate-slide-in' : 'animate-slide-out'} ${notif.type === "success" ? "bg-green-500" :
                            notif.type === "error" ? "bg-red-500" :
                                notif.type === "warning" ? "bg-amber-500" :
                                    "bg-blue-500"
                            }`}
                        style={{ animationDelay: `${notif.visible !== false ? idx * 120 : 0}ms` }}
                    >
                        <span className="text-sm">{notif.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
