import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "drive.google.com",
  "lh3.googleusercontent.com",
  "storage.googleapis.com",
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url", { status: 400 });

  let url: string;
  try {
    url = decodeURIComponent(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!isAllowed(url)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BoranaB2B/1.0)" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
