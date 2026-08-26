/**
 * Authenticated API Route Wrapper
 *
 * Wraps API route handlers with Firebase Admin authentication.
 * Verifies the Bearer token and returns 401 if unauthorized.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyApiRequest, hasPermission, hasFeature, isAdmin, AuthenticatedUser } from "@/lib/auth/api-auth";

/**
 * Protected API Route Configuration
 */
export interface ProtectedRouteConfig {
  requireAuth?: boolean;
  requireRole?: ("admin" | "manager" | "team")[];
  requirePermission?: {
      module: keyof import("@/types/crm").UserPermissions;
      action?: "read" | "create" | "edit" | "delete";
  };
  requireFeature?: keyof import("@/types/crm").UserPermissions;
}

/**
 * Higher-order function to protect API routes
 *
 * Usage:
 * ```ts
 * import { protectedRoute } from "@/lib/api/protected-route";
 *
 * export const POST = protectedRoute(async (request, user) => {
 *   // User is authenticated, user object contains role and permissions
 *   // Your route logic here
 *   return NextResponse.json({ success: true });
 * }, {
 *   requireAuth: true,
 *   requireRole: ["admin", "manager"],
 * });
 * ```
 */
export function protectedRoute<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response> | NextResponse | Promise<NextResponse>,
  config: ProtectedRouteConfig = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    // If auth is not required, skip verification (not recommended for production)
    if (!config.requireAuth) {
      return handler(request, null as any);
    }

    // Verify authentication
    const authResult = await verifyApiRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: authResult.statusCode || 401 }
      );
    }

    const { user } = authResult;

    // Check role requirements
    if (config.requireRole) {
      const allowedRoles = Array.isArray(config.requireRole) ? config.requireRole : [config.requireRole];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // Check permission requirements
    if (config.requirePermission) {
      const { module, action = "read" } = config.requirePermission;
      if (!hasPermission(user, module, action)) {
        return NextResponse.json(
          { success: false, error: `Missing permission: ${module}.${action}` },
          { status: 403 }
        );
      }
    }

    // Check feature requirements
    if (config.requireFeature) {
      if (!hasFeature(user, config.requireFeature)) {
        return NextResponse.json(
          { success: false, error: `Feature not enabled: ${config.requireFeature}` },
          { status: 403 }
        );
      }
    }

    // All checks passed - execute handler
    return handler(request, user);
  };
}

/**
 * Simple authenticated route (just requires login)
 */
export function requireAuth<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response> | NextResponse | Promise<NextResponse>
) {
  return protectedRoute(handler, { requireAuth: true });
}

/**
 * Admin-only route
 */
export function requireAdmin<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response> | NextResponse | Promise<NextResponse>
) {
  return protectedRoute(handler, { requireAuth: true, requireRole: ["admin"] });
}

/**
 * Manager or Admin route
 */
export function requireManager<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response> | NextResponse | Promise<NextResponse>
) {
  return protectedRoute(handler, { requireAuth: true, requireRole: ["admin", "manager"] });
}
