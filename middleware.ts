import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken, type UserRole } from "./lib/session";

const roleHome: Record<UserRole, string> = {
  HR: "/dashboard",
  EMPLOYEE: "/my-schedule",
};

const roleRoutes: Record<UserRole, string[]> = {
  HR: ["/dashboard", "/employees", "/requests", "/calendar", "/schedules"],
  EMPLOYEE: ["/my-schedule", "/my-requests"],
};

const publicRoutes = ["/login"];

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  );
}

function isAllowed(pathname: string, role: UserRole) {
  return roleRoutes[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    if (pathname === "/login" || pathname === "/") {
      console.log("[middleware] redirect from", pathname, "to", roleHome[session.role], "role", session.role);
      return NextResponse.redirect(new URL(roleHome[session.role], req.url));
    }

    if (!isAllowed(pathname, session.role)) {
      console.log("[middleware] blocked", pathname, "role", session.role, "->", roleHome[session.role]);
      return NextResponse.redirect(new URL(roleHome[session.role], req.url));
    }

    console.log("[middleware] allow", pathname, "role", session.role);
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isPublic) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
