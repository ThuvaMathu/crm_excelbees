"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "@/lib/firestore/notifications";
import type { Notification } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;

        const [notifResult, countResult] = await Promise.all([
            getNotifications(user.uid),
            getUnreadCount(user.uid),
        ]);

        if (!notifResult.error) {
            setNotifications(notifResult.notifications);
        }

        if (!countResult.error) {
            setUnreadCount(countResult.count);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const { success } = await markAsRead(notificationId);
        if (success) {
            fetchNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;

        setLoading(true);
        const { success } = await markAllAsRead(user.uid);

        if (success) {
            toast.success("All notifications marked as read");
            fetchNotifications();
        } else {
            toast.error("Failed to mark all as read");
        }

        setLoading(false);
    };

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const { success } = await deleteNotification(notificationId);
        if (success) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Navigate to entity
        const routes: Record<string, string> = {
            lead: "/leads",
            contact: "/contacts",
            company: "/companies",
            deal: "/deals",
            project: "/projects",
            task: "/tasks",
            invoice: "/invoices",
        };

        const basePath = routes[notification.entityType];
        if (basePath) {
            router.push(`${basePath}/${notification.entityId}`);
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, string> = {
            deal_won: "🎉",
            deal_lost: "😞",
            task_assigned: "📋",
            task_due: "⏰",
            invoice_paid: "💰",
            invoice_overdue: "⚠️",
            project_completed: "✅",
            mention: "💬",
        };
        return icons[type] || "🔔";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                            className="h-auto py-1 px-2 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? "bg-primary/5" : ""
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                            <p className="font-medium text-sm">{notification.title}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={(e) => handleDelete(notification.id, e)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
