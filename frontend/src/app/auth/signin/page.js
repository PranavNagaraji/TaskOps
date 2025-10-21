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
        <div className="flex min-h-screen items-center justify-center bg-background">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-border w-80">
                <h2 className="text-2xl font-bold mb-4 text-center text-foreground">Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 mb-3 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 mb-4 border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground p-2.5 rounded-md font-semibold hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:cursor-pointer"
                >
                    Sign In
                </button>

                <div className="text-center mt-4 text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-primary hover:underline">
                        Sign Up
                    </Link>
                </div>
            </form>
        </div>
    );
}