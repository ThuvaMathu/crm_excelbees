"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { LayoutDashboard } from "lucide-react";

export function LandingNavbar() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <motion.nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-background/80 backdrop-blur-md border-b border-border py-4 shadow-sm"
                    : "bg-transparent py-6"
            )}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
                        <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <span className={cn(
                        "text-xl font-bold tracking-tight transition-colors",
                        isScrolled ? "text-foreground" : "text-white"
                    )}>
                        ExcelBees
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {["Features", "Solutions", "Resources", "Pricing"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                isScrolled ? "text-muted-foreground" : "text-white/80 hover:text-white"
                            )}
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary hidden sm:block",
                            isScrolled ? "text-muted-foreground" : "text-white"
                        )}
                    >
                        Sign In
                    </Link>
                    <Button
                        asChild
                        className={cn(
                            "font-semibold shadow-lg transition-all hover:scale-105",
                            isScrolled
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-white text-secondary hover:bg-white/90"
                        )}
                    >
                        <Link href="/login">Get Started</Link>
                    </Button>
                </div>
            </div>
        </motion.nav>
    );
}
