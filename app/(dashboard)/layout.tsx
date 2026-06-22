"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AuthGate>
                <DashboardShell>{children}</DashboardShell>
            </AuthGate>
        </AuthProvider>
    );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background">
            {/* Global Command Palette */}
            <CommandPalette />
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div
                className={cn(
                    "min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "md:pl-16" : "md:pl-64"
                )}
            >
                {/* Header with Mobile Nav */}
                <div className="sticky top-0 z-30 flex items-center gap-2 px-4 md:px-0">
                    <div className="md:hidden">
                        <MobileNav />
                    </div>
                    <div className="flex-1">
                        <Header />
                    </div>
                </div>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
