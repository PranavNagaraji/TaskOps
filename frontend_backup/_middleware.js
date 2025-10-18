import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        if (pathname.startsWith("/admin") && token?.role !== "admin") {
            return NextResponse.redirect(new URL("/auth/signin", req.url));
        }
        if (pathname.startsWith("/customer") && token?.role !== "customer") {
            return NextResponse.redirect(new URL("/auth/signin", req.url));
        }
        if (pathname.startsWith("/employee") && token?.role !== "employee") {
            return NextResponse.redirect(new URL("/auth/signin", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/customer/:path*", "/employee/:path*"],
};
