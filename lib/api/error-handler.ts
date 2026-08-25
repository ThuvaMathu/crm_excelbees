import { NextResponse } from "next/server";
import { logger, getRequestId } from "@/lib/logger";

interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export function apiError(
  message: string,
  code: string = "INTERNAL_ERROR",
  status: number = 500,
  details?: unknown
): NextResponse<ErrorResponse> {
  logger.error(message, {
    module: "api",
    action: code,
    code,
    status,
    metadata: details !== undefined ? { details } : undefined,
  });
  return NextResponse.json({ error: message, code, details }, { status });
}

export function apiUnauthorized(message = "Unauthorized"): NextResponse<ErrorResponse> {
  return apiError(message, "UNAUTHORIZED", 401);
}

export function apiForbidden(message = "Forbidden"): NextResponse<ErrorResponse> {
  return apiError(message, "FORBIDDEN", 403);
}

export function apiNotFound(message = "Not found"): NextResponse<ErrorResponse> {
  return apiError(message, "NOT_FOUND", 404);
}

export function apiValidationError(message: string, details?: unknown): NextResponse<ErrorResponse> {
  return apiError(message, "VALIDATION_ERROR", 400, details);
}

export function apiRateLimited(message = "Too many requests"): NextResponse<ErrorResponse> {
  return apiError(message, "RATE_LIMITED", 429);
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiHandler(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request) => {
    const requestId = await getRequestId();
    const log = requestId ? logger.child({ requestId }) : logger;
    try {
      return await handler(req);
    } catch (error) {
      log.error("Unhandled API error", { module: "api", action: "handler", error });
      return apiError("An unexpected error occurred");
    }
  };
}
