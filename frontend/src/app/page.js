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
    router.push("/about");
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
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Welcome to <span className="text-primary">TaskOps</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-200 max-w-xl mx-auto mb-8">
          Organize. Track. Execute.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleGetStarted}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary/20 hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get Started
          </button>
          <button
            className="bg-transparent border border-border text-white hover:bg-white/10 px-6 py-2 rounded-lg font-semibold transition-all hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleLearnMore}
          >
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
