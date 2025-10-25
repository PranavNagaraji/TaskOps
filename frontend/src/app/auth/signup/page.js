"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
    // Common fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("customer");
    // Role-specific fields
    const [city, setCity] = useState("");
    const [employeeRole, setEmployeeRole] = useState("");
    const [documentLink, setDocumentLink] = useState("");
    // For UI
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        const commonFieldsValid = name && email && password && phone;
        let endpoint = "";
        let rolePayload = {};
        if (role === "customer") {
            if (!commonFieldsValid || !city) {
                setError("Please fill out all required fields.");
                setIsLoading(false);
                return;
            }
            endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customers`;
            rolePayload = { name, email, password, phone, address: city };
        } else if (role === "employee") {
            if (!commonFieldsValid || !employeeRole || !documentLink) {
                setError("Please fill out all required fields.");
                setIsLoading(false);
                return;
            }
            // Note: employee flow now uses employee verification endpoint
            endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-verification`;
            rolePayload = { employeeRole: employeeRole, document_link: documentLink };
        } else {
            setError("Invalid role selected.");
            setIsLoading(false);
            return;
        }

        try {
            // --- 1. Create the main user account ---
            const userPayload = { name, email, password, role, phone };
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userPayload),
            });

            if (!userRes.ok) {
                const data = await userRes.json();
                setError(data.message || "Failed to create user account.");
                setIsLoading(false);
                return;
            }
            // --- 2. Get the new user ID from the response ---
            const { userId } = await userRes.json();
            if (!userId) {
                setError("Could not retrieve user ID. Aborting.");
                setIsLoading(false);
                return;
            }
            // --- 3. Add the new userId to the role-specific payload ---
            const finalPayload = { ...rolePayload, user_id: userId };
            // --- 4. Create the customer/employee-related record linked by userId ---
            const roleRes = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalPayload),
            });
            if (role === "customer") {
                if (roleRes.ok) {
                    router.push("/auth/signin");
                } else {
                    const data = await roleRes.json();
                    setError(data.message || "User account created, but failed to save role details.");
                }
            } else {
                // Employee verification flow
                if (roleRes.ok) {
                    // Success -> verification created -> redirect to dashboard
                    router.push("/employee/dashboard");
                } else {
                    const data = await roleRes.json().catch(() => ({}));
                    if (roleRes.status === 409) {
                        // Duplicate/Pending already exists
                        setPendingVerification(true);
                        setError("Your account is pending admin approval");
                    } else {
                        setError(data.error || data.message || "Failed to submit verification.");
                    }
                }
            }
        } catch (error) {
            setError("Error connecting to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background py-12">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-sm border border-border w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Create an Account</h2>

                {error && (
                    <div className="bg-destructive text-white w-fit text-sm py-1 px-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {/* --- Common Fields --- */}
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />

                <hr className="my-4" />

                {/* --- Role Selection & Dynamic Fields --- */}
                <label className="block text-sm font-medium text-foreground mb-2">Select Your Role</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                </select>

                {/* Customer-specific Input */}
                {role === "customer" && (
                    <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                )}

                {/* Employee-specific Input */}
                {role === "employee" && (
                    pendingVerification ? (
                        <div className="w-full p-3 mb-4 rounded-md bg-amber-50 text-amber-800 border border-amber-200 animate-fade-in">
                            Your account is pending admin approval
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="Employee Role (e.g., Plumber, Electrician, etc.)"
                                value={employeeRole}
                                onChange={(e) => setEmployeeRole(e.target.value)}
                                className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <input
                                type="url"
                                placeholder="Document link (certificate/license URL)"
                                value={documentLink}
                                onChange={(e) => setDocumentLink(e.target.value)}
                                className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </>
                    )
                )}

                <button type="submit" disabled={isLoading} className="w-full mt-4 bg-secondary text-secondary-foreground p-2.5 rounded-md font-semibold hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground hover:cursor-pointer">
                    {isLoading ? "Signing Up..." : "Sign Up"}
                </button>

                <div className="text-center mt-4 text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-primary hover:underline">Sign In</Link>
                </div>
            </form>
        </div>
    );
}

