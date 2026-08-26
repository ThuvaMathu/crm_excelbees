"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth/auth-service";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
    Search,
    User,
    Settings,
    LogOut,
    Sun,
    Moon,
    Monitor,
} from "lucide-react";

import { useUIStore } from "@/store/ui";

export function Header() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const { setSearchOpen } = useUIStore();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    const handleSearchClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setSearchOpen(true);
    };

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground pl-10 font-normal"
                    onClick={() => setSearchOpen(true)}
                >
                    Search... (Cmd+K)
                </Button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Theme Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Monitor className="mr-2 h-4 w-4" />
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 px-3 py-2 h-auto hover:bg-accent">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback className="bg-primary text-white text-sm">
                                    {user?.displayName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden md:block text-sm font-medium">
                                {user?.displayName || "User"}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.displayName || "User"}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/settings")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
