"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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
  ];

  const employeeLinks = [
    { href: "/employee/requests", label: "Requests" },
    { href: "/employee/assignments", label: "My Assignments" },
    { href: "/employee/dashboard", label: "Dashboard" },
  ];

  const customerLinks = [
    { href: "/requests/new", label: "Add Request" },
    { href: "/customer/dashboard", label: "Dashboard" },
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
    <nav className="bg-white shadow-md sticky top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-800">
              <i>Service Management</i>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-4">
            {status === "loading" && <div className="text-gray-500">Loading...</div>}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                {link.label}
              </Link>
            ))}

            {status === "authenticated" && (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Log Out
              </button>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="bg-green-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600"
              >
                Log In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)}>
              {open ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}

            {status === "authenticated" && (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-500 text-white hover:bg-red-600"
              >
                Log Out
              </button>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn({ callbackUrl: "/auth/signin" })}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-green-500 text-white hover:bg-green-600"
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
