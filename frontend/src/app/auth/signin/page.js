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
        <div className="relative min-h-screen">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/login_page.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80" />
            <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-zinc-900/85 text-zinc-100 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/10"
                >
                    <h2 className="text-3xl font-extrabold mb-6 text-teal-300 text-left">Login</h2>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 mb-4 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80"
                    />
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 mb-6 rounded-lg bg-zinc-800/60 border border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80"
                    />
                    <button
                        type="submit"
                        className="w-full bg-teal-400 text-zinc-900 font-semibold py-2.5 rounded-lg hover:bg-teal-300 transition focus:outline-none focus:ring-2 focus:ring-teal-400/80 hover:cursor-pointer"
                    >
                        Sign In
                    </button>

                    <div className="text-center mt-5 text-sm text-zinc-400">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="text-teal-300 hover:underline">
                            Sign Up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}