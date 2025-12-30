"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Building2,
    Handshake,
    TrendingUp,
    ArrowRight,
    Sparkles
} from "lucide-react";
import Link from "next/link";

const quickStats = [
    {
        title: "Total Leads",
        value: "0",
        change: "+0%",
        icon: Users,
        href: "/leads",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
        title: "Active Deals",
        value: "0",
        change: "+0%",
        icon: Handshake,
        href: "/deals",
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    {
        title: "Companies",
        value: "0",
        change: "+0%",
        icon: Building2,
        href: "/companies",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
        title: "Revenue",
        value: "$0",
        change: "+0%",
        icon: TrendingUp,
        href: "/reports",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/20",
    },
];

const quickActions = [
    { label: "Add Lead", href: "/leads?action=create", icon: Users },
    { label: "Create Deal", href: "/deals?action=create", icon: Handshake },
    { label: "New Company", href: "/companies?action=create", icon: Building2 },
];

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.displayName?.split(" ")[0] || "there"}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here's what's happening with your business today.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickStats.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-green-600">{stat.change}</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Quick Actions
                    </CardTitle>
                    <CardDescription>
                        Get started with common tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                        {quickActions.map((action) => (
                            <Link key={action.label} href={action.href}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                                >
                                    <action.icon className="h-5 w-5 text-primary" />
                                    <span>{action.label}</span>
                                    <ArrowRight className="h-4 w-4 ml-auto" />
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-secondary-900 dark:to-secondary-800 border-2 border-primary/30">
                <CardHeader>
                    <CardTitle className="text-2xl">🚀 Phase 1 Complete!</CardTitle>
                    <CardDescription className="text-base">
                        Your CRM is ready to use
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">Authentication System</p>
                                <p className="text-muted-foreground">Email/Password & Google Sign-In working perfectly</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">Dashboard Layout</p>
                                <p className="text-muted-foreground">Responsive sidebar, header, and mobile navigation</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">Excel Bees Branding</p>
                                <p className="text-muted-foreground">Amber/Orange & Deep Blue-Gray color scheme applied</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Next Steps:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Phase 2: Build Leads, Contacts & Companies modules</li>
                            <li>• Phase 3: Create Deals & Pipeline Kanban board</li>
                            <li>• Phase 4: Add Projects & Tasks management</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
