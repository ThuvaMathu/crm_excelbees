// Analytics logging utility for tracking user events

type EventType = 
  | "auth_login_success"
  | "auth_login_failed"
  | "auth_register_success"
  | "auth_register_failed"
  | "auth_google_login_success"
  | "auth_google_login_failed"
  | "auth_password_reset_requested"
  | "auth_password_reset_failed"
  | "auth_logout";

interface EventData {
  userId?: string;
  email?: string;
  error?: string;
  method?: "email" | "google";
  timestamp: string;
}

export function logEvent(eventType: EventType, data: Partial<EventData> = {}) {
  const eventData: EventData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventType}:`, eventData);
  }

  // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
  // Example:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', eventType, eventData);
  // }

  // Store in localStorage for debugging (optional)
  try {
    const logs = JSON.parse(localStorage.getItem("analytics_logs") || "[]");
    logs.push({ event: eventType, data: eventData });
    // Keep only last 100 events
    if (logs.length > 100) logs.shift();
    localStorage.setItem("analytics_logs", JSON.stringify(logs));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

// Helper functions for common events
export const analytics = {
  loginSuccess: (userId: string, email: string, method: "email" | "google" = "email") => {
    logEvent("auth_login_success", { userId, email, method });
  },

  loginFailed: (email: string, error: string, method: "email" | "google" = "email") => {
    logEvent("auth_login_failed", { email, error, method });
  },

  registerSuccess: (userId: string, email: string) => {
    logEvent("auth_register_success", { userId, email });
  },

  registerFailed: (email: string, error: string) => {
    logEvent("auth_register_failed", { email, error });
  },

  passwordResetRequested: (email: string) => {
    logEvent("auth_password_reset_requested", { email });
  },

  passwordResetFailed: (email: string, error: string) => {
    logEvent("auth_password_reset_failed", { email, error });
  },

  logout: (userId: string) => {
    logEvent("auth_logout", { userId });
  },
};
