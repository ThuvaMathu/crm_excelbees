"use client";

import { useAuth } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Initialize auth listener
    useAuth();

    return <>{children}</>;
}
