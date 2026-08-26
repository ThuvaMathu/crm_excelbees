/**
 * API Authentication & Authorization Middleware
 *
 * Provides server-side authentication verification for API routes.
 * Uses Firebase Admin SDK to verify ID tokens and fetch user permissions.
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { logger } from "@/lib/logger";
import { UserRole, UserPermissions, ROLE_DEFAULTS } from "@/types/crm";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  isActive?: boolean;
  isApproved?: boolean;
}

export interface ApiAuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Verify API Request - Main auth helper for API routes
 *
 * Usage in API route:
 * ```ts
 * const auth = await verifyApiRequest(request);
 * if (!auth.success) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
 * }
 * const { user } = auth;
 * ```
 */
export async function verifyApiRequest(request: NextRequest): Promise<ApiAuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return {
        success: false,
        error: "Authorization header required",
        statusCode: 401,
      };
    }

    // Extract Bearer token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        error: "Invalid authorization format",
        statusCode: 401,
      };
    }

    // Verify ID token with Firebase Admin
    const adminAuth = getAuth();
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken) {
      return {
        success: false,
        error: "Invalid or expired token",
        statusCode: 401,
      };
    }

    // Fetch user document from Firestore for role and permissions
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: "User profile not found",
        statusCode: 404,
      };
    }

    const userData = userDoc.data();

    // Check if user is active
    if (userData?.isActive === false) {
      return {
        success: false,
        error: "User account is deactivated",
        statusCode: 403,
      };
    }

    // Check if user is approved
    if (userData?.isApproved === false) {
      return {
        success: false,
        error: "User account is pending approval",
        statusCode: 403,
      };
    }

    // Build authenticated user object
    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: userData?.role || "team",
      permissions: userData?.permissions,
      isActive: userData?.isActive ?? true,
      isApproved: userData?.isApproved ?? true,
    };

    return { success: true, user };
  } catch (error) {
    logger.warn("API auth failed", { module: "auth", action: "api-auth", error });
    return {
      success: false,
      error: "Authentication failed",
      statusCode: 401,
    };
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  module: keyof UserPermissions,
  action: "read" | "create" | "edit" | "delete" | "editAll" = "read"
): boolean {
  // Admin bypass
  if (user.role === "admin") return true;

  // Get resolved permissions (user-specific or role defaults)
  const permissions = user.permissions || ROLE_DEFAULTS[user.role];

  if (!permissions) return false;

  const modulePerm = permissions[module];
  if (!modulePerm) return false;

  // Feature toggles
  if ("enabled" in modulePerm) {
    return modulePerm.enabled;
  }

  // Module permissions
  if (typeof modulePerm === "object" && action in modulePerm) {
    return (modulePerm as unknown as Record<string, boolean>)[action];
  }

  return false;
}

/**
 * Check if user has feature access
 */
export function hasFeature(
  user: AuthenticatedUser,
  feature: keyof UserPermissions
): boolean {
  // Admin bypass
  if (user.role === "admin") return true;

  const permissions = user.permissions || ROLE_DEFAULTS[user.role];
  if (!permissions) return false;

  const featurePerm = permissions[feature];
  if (!featurePerm) return false;

  return "enabled" in featurePerm ? featurePerm.enabled : false;
}

/**
 * Require minimum role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Admin-only check
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === "admin";
}

/**
 * Manager or Admin check
 */
export function isManager(user: AuthenticatedUser): boolean {
  return user.role === "admin" || user.role === "manager";
}

/**
 * API Response Helpers
 */
export function unauthorized(message = "Unauthorized") {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbidden(message = "Forbidden") {
  return Response.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function notFound(message = "Resource not found") {
  return Response.json(
    { success: false, error: message },
    { status: 404 }
  );
}

export function badRequest(message = "Bad request", data?: any) {
  return Response.json(
    { success: false, error: message, ...(data && { data }) },
    { status: 400 }
  );
}
