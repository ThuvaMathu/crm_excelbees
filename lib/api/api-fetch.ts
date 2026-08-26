/**
 * Authenticated API Fetch Wrapper
 *
 * Wraps fetch calls to include Firebase ID token authentication.
 * All API calls should use this wrapper instead of raw fetch.
 */

import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger/client";

type ApiRequestInit = Omit<RequestInit, "headers"> & {
  headers?: {
    Authorization?: string;
    [key: string]: string | undefined;
  };
};

/**
 * Make an authenticated API request
 *
 * @param endpoint - API endpoint path (e.g., "/api/email/send")
 * @param options - fetch options
 * @returns Promise with response data
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { user } = useAuth();

  if (!user) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  // Get ID token from Firebase user
  const token = await user.getIdToken();
  if (!token) {
    return {
      success: false,
      error: "No authentication token available",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = value as string;
    });
  }

  const authOptions: ApiRequestInit = {
    ...options,
    headers: headers as any,
  };

  try {
    const response = await fetch(endpoint, authOptions as RequestInit);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Request failed",
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("API fetch error", {
      module: "api",
      action: "fetch",
      userId: user.uid,
      metadata: { endpoint },
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(endpoint, { ...options, method: "DELETE" });
}

/**
 * Hook-based API fetcher (for components that use hooks)
 */
export function useApi() {
  const { user } = useAuth();

  const fetcher = async <T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (!user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const token = await user.getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (options && options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }

    const authOptions: ApiRequestInit = {
      ...options,
      headers: headers as any,
    };

    try {
      const response = await fetch(endpoint, authOptions as RequestInit);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Request failed",
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Network error",
      };
    }
  };

  return {
    post: <T = any>(endpoint: string, data?: any) =>
      fetcher<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
    get: <T = any>(endpoint: string) =>
      fetcher<T>(endpoint, { method: "GET" }),
    put: <T = any>(endpoint: string, data?: any) =>
      fetcher<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
    del: <T = any>(endpoint: string) =>
      fetcher<T>(endpoint, { method: "DELETE" }),
  };
}
