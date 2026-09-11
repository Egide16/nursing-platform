import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    if (path.startsWith("/admin") && !["SUPER_ADMIN", "INSPECTOR"].includes(role as string)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/company") && role !== "COMPANY_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (
      (path.startsWith("/dashboard") || path.startsWith("/courses") || path.startsWith("/certificates")) &&
      role !== "STUDENT"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/courses/:path*", "/certificates/:path*", "/company/:path*", "/admin/:path*"],
};
