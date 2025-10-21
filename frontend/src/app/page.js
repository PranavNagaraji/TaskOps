"use client";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = async () => {
    const session = await getSession();
    if (session?.user) {
      router.push(`/${session.user.role}/dashboard`);
    } else {
      router.push("/auth/signin");
    }
  };

  const handleLearnMore = async () => {
    
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center text-white bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1920&q=80&fm=webp')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
          Welcome to <span className="text-blue-400">TaskOps</span>
        </h1>

        <p className="text-lg text-gray-200 max-w-xl mx-auto mb-8">
          Organize. Track. Execute. Empower your team with a streamlined
          workflow and effortless task management.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/30 hover:cursor-pointer"
          >
            Get Started
          </button>
          <button className="bg-transparent border border-gray-300 hover:bg-white/10 px-6 py-2 rounded-lg font-semibold transition-all" onClick={handleLearnMore}>
            Learn More
          </button>
        </div>
      </div>

      <footer className="absolute bottom-4 text-sm text-gray-300">
        © {new Date().getFullYear()} TaskOps. All rights reserved.
      </footer>
    </main>
  );
}
