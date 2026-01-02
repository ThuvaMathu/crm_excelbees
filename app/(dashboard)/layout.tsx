"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useUIStore } from "@/store/ui";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { CopilotWidget } from "@/components/ai/CopilotWidget";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { sidebarCollapsed } = useUIStore();

    // Redirect to login if not authenticated
    // Note: RBACGuard handles this now

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

            {/* Copilot Widget */}
            <CopilotWidget />
        </div>
    );
}
