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
    { href: "/admin/employee-verification", label: "Employee Verification" },
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
    <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 left-0 w-full z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900 hover:text-indigo-600 transition-all duration-200"
          >
            <i>TaskOps</i>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            {status === "loading" && (
              <div className="text-gray-500 text-sm">Loading...</div>
            )}

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === link.href
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {(session?.user?.role === "customer" ||
              session?.user?.role === "employee") && (
                <Link
                  href={
                    session?.user?.role === "employee"
                      ? "/employee/email"
                      : "/customer/email"
                  }
                  aria-label="Email TaskOps"
                  className={`p-2 rounded-xl transition-all duration-200 ${pathname === "/customer/email" ||
                    pathname === "/employee/email"
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                    }`}
                  title="Email TaskOps"
                >
                  <Mail className="w-5 h-5" />
                </Link>
              )}

            {status === "authenticated" ? (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="ml-3 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-200"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="ml-3 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-200"
              >
                Log In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md animate-in slide-in-from-top duration-300 ease-out">
          <div className="px-5 pt-3 pb-5 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 ${pathname === link.href
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {(session?.user?.role === "customer" ||
              session?.user?.role === "employee") && (
                <Link
                  href={
                    session?.user?.role === "employee"
                      ? "/employee/email"
                      : "/customer/email"
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 ${pathname === "/customer/email" ||
                    pathname === "/employee/email"
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    }`}
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </Link>
              )}

            {status === "authenticated" ? (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-4 py-2 rounded-lg text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-200"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-4 py-2 rounded-lg text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-200"
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
