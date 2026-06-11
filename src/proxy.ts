import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets, API routes, and the login page
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // Customer-facing routes are fully public — no session required
  if (pathname.startsWith("/customer") || pathname === "/") {
    const session = await auth();
    // If a logged-in admin somehow lands on a customer page, send them home
    if (session?.user?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes require an authenticated admin session
  if (pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/customer/catalog", request.url));
    }
    return NextResponse.next();
  }

  // Everything else (print pages, etc.) — require a session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
