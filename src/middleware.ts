import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Customer routes — publicly accessible, no login needed
  if (pathname.startsWith("/customer")) {
    return NextResponse.next();
  }

  // Admin routes — must be logged in as ADMIN
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
