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
    const [step, setStep] = useState(1);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otp, setOtp] = useState("");
    const router = useRouter();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!email) {
            setError("Please enter your email first.");
            return;
        }
        try {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/otp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Failed to send OTP.");
                return;
            }
            setOtpSent(true);
        } catch (_) {
            setError("Error connecting to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!otp) {
            setError("Please enter the OTP sent to your email.");
            return;
        }
        try {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/otp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Invalid or expired OTP.");
                return;
            }
            setOtpVerified(true);
            setStep(2);
        } catch (_) {
            setError("Error connecting to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        if (!otpVerified) {
            setError("Please verify your email via OTP first.");
            setIsLoading(false);
            return;
        }
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
                const data = await userRes.json().catch(() => ({}));
                if (userRes.status === 409 || (data && /already exists/i.test(data.message || ''))) {
                    setError("User with this email already exists");
                } else {
                    setError(data.message || "Failed to create user account.");
                }
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
        <div className="relative min-h-screen">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/sign_up.jpeg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80" />
            <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-zinc-900/85 text-zinc-100 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/10"
                >
                    <h2 className="text-3xl font-extrabold mb-6 text-left text-teal-300">Create an Account</h2>

                    {error && (
                        <div className="mb-4 w-full rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm py-2 px-3">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Only Email and OTP */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={otpVerified}
                        className="w-full px-3 py-2.5 mb-2 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80 disabled:opacity-80"
                    />
                    {step === 1 && (
                        <>
                            {!otpSent && (
                                <button type="button" onClick={handleSendOtp} disabled={isLoading || !email} className="w-full mb-4 bg-teal-400 text-zinc-900 p-2.5 rounded-lg font-semibold hover:bg-teal-300 disabled:opacity-70 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/80">
                                    {isLoading ? "Sending OTP..." : "Send OTP"}
                                </button>
                            )}
                            {otpSent && !otpVerified && (
                                <div className="mt-1 mb-3">
                                    <div className="text-sm text-zinc-400 mb-2">OTP sent to your email</div>
                                    <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-3 py-2.5 mb-2 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80" />
                                    <button type="button" onClick={handleVerifyOtp} disabled={isLoading || !otp} className="w-full bg-teal-400 text-zinc-900 p-2.5 rounded-lg font-semibold hover:bg-teal-300 disabled:opacity-70 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/80">
                                        {isLoading ? "Verifying..." : "Verify OTP"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 2: Full form after verification */}
                    {step === 2 && (
                        <>
                            <div className="text-green-400 text-sm mb-3">Email verified</div>
                            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80" />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80" />
                            <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80" />

                            <hr className="my-4" />

                            {/* --- Role Selection & Dynamic Fields --- */}
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Select Your Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/80"
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
                                    className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 animate-fade-in focus:outline-none focus:ring-2 focus:ring-teal-400/80"
                                />
                            )}

                            {/* Employee-specific Input */}
                            {role === "employee" && (
                                pendingVerification ? (
                                    <div className="w-full p-3 mb-4 rounded-md border border-amber-400/20 bg-amber-400/10 text-amber-300 animate-fade-in">
                                        Your account is pending admin approval
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={employeeRole}
                                            onChange={(e) => setEmployeeRole(e.target.value)}
                                            className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 animate-fade-in focus:outline-none focus:ring-2 focus:ring-teal-400/80 hover:bg-zinc-800/70"
                                        >
                                            <option value="">Select Employee Role</option>
                                            <option value="Plumber">Plumber</option>
                                            <option value="Electrician">Electrician</option>
                                            <option value="Carpenter">Carpenter</option>
                                            <option value="Painter">Painter</option>
                                            <option value="Mechanic">Mechanic</option>
                                            <option value="Technician">Technician</option>
                                            <option value="Cleaner">Cleaner</option>
                                            <option value="Driver">Driver</option>
                                            <option value="Security Guard">Security Guard</option>
                                        </select>
                                        <input
                                            type="url"
                                            placeholder="Document link (certificate/license URL)"
                                            value={documentLink}
                                            onChange={(e) => setDocumentLink(e.target.value)}
                                            className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 animate-fade-in focus:outline-none focus:ring-2 focus:ring-teal-400/80"
                                        />
                                    </>
                                )
                            )}

                            <button type="submit" disabled={isLoading || !otpVerified} className="w-full mt-4 bg-teal-400 text-zinc-900 p-2.5 rounded-lg font-semibold hover:bg-teal-300 disabled:opacity-70 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/80">
                                {isLoading ? "Signing Up..." : (!otpVerified ? "Verify Email to Continue" : "Sign Up")}
                            </button>

                        </>
                    )}

                    <div className="text-center mt-4 text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-teal-300 hover:underline">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
