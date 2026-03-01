"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Users,
    Building2,
    Handshake,
    DollarSign,
    Briefcase,
    CheckCircle2,
    FileText,
    TrendingUp,
    ArrowRight,
    Lock,
} from "lucide-react";
import Link from "next/link";
import { getCachedDashboardStats } from "@/app/actions/dashboard";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default function DashboardPage() {
    console.log("🟢 Dashboard component is rendering!");
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLeads: 0,
        activeDeals: 0,
        totalCompanies: 0,
        totalRevenue: 0,
        activeProjects: 0,
        pendingTasks: 0,
    });
    const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            console.log("📈 Dashboard: Starting data fetch...");
            try {
                // Fetch all dashboard stats from our cached server action
                const data = await getCachedDashboardStats(user?.uid || "");

                if (data) {
                    console.log("✅ Dashboard: Data fetched successfully");

                    setStats({
                        totalLeads: data.totalLeads,
                        activeDeals: data.activeDeals,
                        totalCompanies: data.totalCompanies,
                        totalRevenue: data.totalRevenue,
                        activeProjects: data.activeProjects,
                        pendingTasks: data.pendingTasks,
                    });

                    // Parse dates back to Date objects for the UI helpers if needed, 
                    // or helpers will need adjustment. 
                    // Let's adjust helper usage or map them back.
                    // The 'isOverdue' and 'isDueToday' helpers assume .toDate() exists or it's a date.
                    // Server action returns strings for dates.
                    const upcoming = data.upcomingTasks.map((t: any) => ({
                        ...t,
                        dueDate: t.dueDate ? { toDate: () => new Date(t.dueDate) } : null
                    }));

                    setUpcomingTasks(upcoming);
                }
            } catch (error) {
                console.error("❌ Dashboard: Error fetching data:", error);
            } finally {
                console.log("🏁 Dashboard: Setting loading to false");
                setLoading(false);
            }
        };

        if (user) {
            console.log("👤 Dashboard: User detected, fetching data for:", user.email);
            fetchDashboardData();
        } else {
            console.log("⚠️ Dashboard: No user, skipping data fetch");
        }
    }, [user]);

    // Role-based access - only admin/manager can see financial data
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    const quickStats = [
        {
            title: "Total Leads",
            value: stats.totalLeads.toString(),
            icon: Users,
            href: "/leads",
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Active Deals",
            value: stats.activeDeals.toString(),
            icon: Handshake,
            href: "/deals",
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            title: "Companies",
            value: stats.totalCompanies.toString(),
            icon: Building2,
            href: "/companies",
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
            title: "Revenue",
            value: canViewFinancials ? `$${stats.totalRevenue.toLocaleString()}` : "$•••",
            icon: canViewFinancials ? DollarSign : Lock,
            href: "/invoices",
            color: canViewFinancials ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
            bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
            title: "Active Projects",
            value: stats.activeProjects.toString(),
            icon: Briefcase,
            href: "/projects",
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-100 dark:bg-orange-900/20",
        },
        {
            title: "Pending Tasks",
            value: stats.pendingTasks.toString(),
            icon: CheckCircle2,
            href: "/tasks",
            color: "text-indigo-600 dark:text-indigo-400",
            bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
        },
    ];

    const isOverdue = (dueDate: any) => {
        if (!dueDate) return false;
        return isBefore(dueDate.toDate(), new Date());
    };

    const isDueToday = (dueDate: any) => {
        if (!dueDate) return false;
        const today = new Date();
        const due = dueDate.toDate();
        return (
            due.getDate() === today.getDate() &&
            due.getMonth() === today.getMonth() &&
            due.getFullYear() === today.getFullYear()
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming Tasks Widget */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            My Upcoming Tasks
                        </CardTitle>
                        <CardDescription>
                            Your next {upcomingTasks.length} tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No upcoming tasks</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{task.title}</p>
                                            {task.dueDate && (
                                                <p
                                                    className={`text-xs mt-1 ${isOverdue(task.dueDate)
                                                        ? "text-red-600 font-semibold"
                                                        : isDueToday(task.dueDate)
                                                            ? "text-orange-600 font-semibold"
                                                            : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {isOverdue(task.dueDate)
                                                        ? "Overdue"
                                                        : isDueToday(task.dueDate)
                                                            ? "Due Today"
                                                            : `Due ${format(task.dueDate.toDate(), "MMM d")}`}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${task.priority === "Urgent"
                                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                                : task.priority === "High"
                                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                                <Link href="/tasks">
                                    <Button variant="ghost" className="w-full gap-2">
                                        View All Tasks
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>
                            Get started with common tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <Link href="/leads">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                                >
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>Add Lead</span>
                                    <ArrowRight className="h-4 w-4 ml-auto" />
                                </Button>
                            </Link>
                            <Link href="/deals">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                                >
                                    <Handshake className="h-5 w-5 text-primary" />
                                    <span>Create Deal</span>
                                    <ArrowRight className="h-4 w-4 ml-auto" />
                                </Button>
                            </Link>
                            <Link href="/projects">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                                >
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    <span>New Project</span>
                                    <ArrowRight className="h-4 w-4 ml-auto" />
                                </Button>
                            </Link>
                            {canViewFinancials && (
                                <Link href="/invoices">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                                    >
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span>Create Invoice</span>
                                        <ArrowRight className="h-4 w-4 ml-auto" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
