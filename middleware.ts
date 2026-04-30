import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "agentlaunch_session";

function getSecret(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ||
    "agentlaunch-dev-only-secret-change-me-please-1234567890";
  return new TextEncoder().encode(raw);
}

async function readRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await readRole(req);

  // Sia Admin scope
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (role !== "sia_admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Project Admin scope (`/dashboard`, `/challenges`, `/teams`, `/results`, `/demo-day`, `/settings`)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/challenges") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/demo-day") ||
    pathname.startsWith("/settings")
  ) {
    if (role !== "project_admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Participant scope
  if (pathname.startsWith("/my")) {
    if (role !== "participant") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If already logged in, bounce away from login pages
  if (pathname === "/admin/login" && role === "sia_admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }
  if (pathname === "/login" && role === "project_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname === "/login" && role === "participant") {
    return NextResponse.redirect(new URL("/my/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/challenges/:path*",
    "/teams/:path*",
    "/results/:path*",
    "/demo-day/:path*",
    "/settings/:path*",
    "/my/:path*",
    "/login",
  ],
};
