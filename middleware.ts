import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password";

  // Define protected paths
  const isProtectedPath = path.startsWith("/dashboard") ||
    path.startsWith("/leads") ||
    path.startsWith("/contacts") ||
    path.startsWith("/companies") ||
    path.startsWith("/deals") ||
    path.startsWith("/projects") ||
    path.startsWith("/tasks") ||
    path.startsWith("/invoices") ||
    path.startsWith("/reports") ||
    path.startsWith("/settings") ||
    path.startsWith("/profile") ||
    path.startsWith("/users");

  // Protect Admin Routes at the edge by checking if auth cookie or header exists
  // We exclude /api/admin/sync-claims because it relies on an internal secret key instead of a user session
  if ((path.startsWith("/admin") || path.startsWith("/api/admin")) && !path.startsWith("/api/admin/sync-claims")) {
    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("session")?.value;

    if (!authHeader && !sessionCookie) {
       return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // For now, we'll rely on client-side auth checks
  // In production, you'd want to verify the Firebase auth token here
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
