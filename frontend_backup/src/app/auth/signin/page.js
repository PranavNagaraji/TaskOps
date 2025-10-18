"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session?.user?.role) {
            if (session.user.role === "admin") router.push("/admin/dashboard");
            else if (session.user.role === "customer") router.push("/customer/dashboard");
            else router.push("/employee/dashboard");
        }
    }, [session, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (res.error) {
            alert("Invalid credentials");
        } else {
            console.log("Login successful!");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-80">
                <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-3 border rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                    Sign In
                </button>

                <div className="text-center mt-4 text-sm">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </div>
            </form>
        </div>
    );
}