"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGate>
                {children}
            </AuthGate>
        </AuthProvider>
    );
}
