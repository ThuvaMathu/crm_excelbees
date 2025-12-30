"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className, width = 150, height = 40 }: LogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("relative", className)} style={{ width, height }} />;
    }

    const isDark = resolvedTheme === "dark";
    const logoSrc = isDark ? "/logo-dark.png" : "/logo.png";

    return (
        <div className={cn("relative", className)}>
            <Image
                src={logoSrc}
                alt="Excel Bees CRM"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
        </div>
    );
}
