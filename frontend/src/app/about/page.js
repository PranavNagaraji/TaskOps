"use client";
import Link from "next/link";

export default function LearnMorePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg p-12">
                {/* Header */}
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
                    Discover TaskOps
                </h1>
                <p className="text-gray-700 text-lg mb-12 text-center">
                    TaskOps is your all-in-one Service Management System designed to streamline operations, track requests, and manage employees, customers, and services efficiently.
                </p>

                {/* Features */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Feature 1 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
                        <p className="text-gray-600">
                            Get a bird’s-eye view of your organization. Track requests, monitor employee workloads, and stay updated on service performance in real-time.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Request Management</h2>
                        <p className="text-gray-600">
                            Create, assign, and track service requests seamlessly. Customers can submit new requests, and employees can update their progress with ease.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Employee Management</h2>
                        <p className="text-gray-600">
                            Keep all employee details in one place. Assign tasks, track performance, and manage roles efficiently.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Customer Management</h2>
                        <p className="text-gray-600">
                            Manage customer profiles, view request history, and ensure timely communication to enhance customer satisfaction.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Service Catalog</h2>
                        <p className="text-gray-600">
                            Organize and manage your services efficiently. Update offerings, track usage, and provide detailed descriptions for customers and employees.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
                        <p className="text-gray-600">
                            Gain insights with detailed reports on requests, employee performance, and service efficiency to make informed decisions.
                        </p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <Link
                        href="/auth/signin"
                        className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-lg shadow hover:bg-gray-800 transition"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    );
}
