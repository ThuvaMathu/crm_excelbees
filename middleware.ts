import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Correlation id: propagate an existing x-request-id, or mint one. Attached
  // to the request so `lib/logger/request-id.ts#getRequestId()` can read it
  // in route handlers / server actions.
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const withRequestId = (res: NextResponse) => {
    res.headers.set("x-request-id", requestId);
    return res;
  };

  // ----------------------------------------------------------------
  // Public paths — no auth required
  // ----------------------------------------------------------------
  const isPublicPath =
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path.startsWith("/about") ||
    path.startsWith("/blog") ||
    path.startsWith("/contact") ||
    path.startsWith("/invite");

  // ----------------------------------------------------------------
  // Protected org-scoped CRM routes
  // ----------------------------------------------------------------
  const isOrgPath = path.startsWith("/org");

  // ----------------------------------------------------------------
  // Legacy dashboard routes — redirect to /org so the client-side
  // org picker can handle the redirect to the correct org workspace.
  // ----------------------------------------------------------------
  const isLegacyDashboardPath =
    path.startsWith("/dashboard") ||
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
    path.startsWith("/users") ||
    path.startsWith("/analytics") ||
    path.startsWith("/emails");

  // Redirect legacy flat routes → /org picker
  if (isLegacyDashboardPath) {
    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("session")?.value;
    if (!authHeader && !sessionCookie) {
      return withRequestId(NextResponse.redirect(new URL("/login", request.url)));
    }
    return withRequestId(NextResponse.redirect(new URL("/org", request.url)));
  }

  // ----------------------------------------------------------------
  // Admin API routes (except internal sync-claims)
  //
  // This only checks that *some* auth credential is present — it cannot
  // verify the Firebase ID token or check the "admin" role here because
  // Admin SDK token verification isn't available in the Edge runtime.
  // The actual role check happens server-side in the route handlers
  // (e.g. app/api/admin/route.ts verifies the token with Firebase Admin
  // and checks `decodedToken.role === "admin"`) — that is the real
  // authorization boundary, this is just an early redirect for UX.
  // ----------------------------------------------------------------
  if (
    (path.startsWith("/admin") || path.startsWith("/api/admin")) &&
    !path.startsWith("/api/admin/sync-claims")
  ) {
    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("session")?.value;
    if (!authHeader && !sessionCookie) {
      return withRequestId(NextResponse.redirect(new URL("/login", request.url)));
    }
  }

  return withRequestId(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
