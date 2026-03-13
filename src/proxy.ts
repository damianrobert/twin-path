import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for maintenance mode cookie or header
  const maintenanceMode = (request.cookies.get("maintenance-mode")?.value === "true") || 
                         request.headers.get("x-maintenance-mode") === "true";

  // If maintenance mode is enabled
  if (maintenanceMode) {
    // Allow access to maintenance page
    if (pathname === "/maintenance") {
      return NextResponse.next();
    }

    // Allow access to auth logout endpoint
    if (pathname === "/api/auth/logout") {
      return NextResponse.next();
    }

    // Allow access to auth pages (login/signup)
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Allow access to admin pages (admins can manage maintenance)
    if (pathname.startsWith("/admin/")) {
      return NextResponse.next();
    }

    // Allow access to static assets and API routes that don't require auth
    if (pathname.startsWith("/_next") || 
        pathname.startsWith("/api") || 
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/public")) {
      return NextResponse.next();
    }

    // Redirect all other requests to maintenance page
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // If not in maintenance mode, allow normal access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
