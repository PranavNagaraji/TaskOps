"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Mail } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/employee-verification", label: "Employee Verification" }
  ];

  const employeeLinks = [
    { href: "/employee/dashboard", label: "Dashboard" },
    { href: "/employee/requests", label: "Requests" },
    { href: "/employee/assignments", label: "My Assignments" },
  ];

  const customerLinks = [
    { href: "/customer/dashboard", label: "Dashboard" },
    { href: "/customer/myRequests", label: "My Requests" },
    { href: "/requests/new", label: "Add Request" },
  ];

  const links =
    session?.user?.role === "admin"
      ? adminLinks
      : session?.user?.role === "employee"
        ? employeeLinks
        : session?.user?.role === "customer"
          ? customerLinks
          : [];

  return (
    <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-border sticky top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-foreground hover:text-primary transition-colors"
            >
              <i>TaskOps</i>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" && (
              <div className="text-muted-foreground text-sm">Loading...</div>
            )}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                  ? "text-foreground bg-muted"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {session?.user?.role === "customer" && (
              <Link
                href="/customer/email"
                aria-label="Email TaskOps"
                className={`p-2 rounded-md transition-colors ${
                  pathname === "/customer/email"
                    ? "text-foreground bg-muted"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`}
                title="Email TaskOps"
              >
                <Mail className="w-5 h-5" />
              </Link>
            )}

            {status === "authenticated" && (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors hover:cursor-pointer"
              >
                Log Out
              </button>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors hover:cursor-pointer"
              >
                Log In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-b border-border shadow-sm">
          <div className="px-4 pt-4 pb-3 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === link.href
                  ? "text-foreground bg-muted"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {session?.user?.role === "customer" && (
              <Link
                href="/customer/email"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === "/customer/email"
                    ? "text-foreground bg-muted"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </div>
              </Link>
            )}

            {status === "authenticated" && (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-3 py-2 rounded-md text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Log Out
              </button>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-3 py-2 rounded-md text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
