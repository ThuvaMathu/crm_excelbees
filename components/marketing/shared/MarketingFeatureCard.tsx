import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MarketingFeatureCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    stats?: string;
    status?: "active" | "beta" | "coming_soon";
    className?: string;
}

export function MarketingFeatureCard({
    title,
    description,
    href,
    icon: Icon,
    stats,
    status = "active",
    className
}: MarketingFeatureCardProps) {
    const isLocked = status === "coming_soon";

    return (
        <Link
            href={isLocked ? "#" : href}
            className={cn(
                "block transition-all hover:scale-[1.02]",
                isLocked && "opacity-75 cursor-not-allowed pointer-events-none"
            )}
        >
            <Card className={cn("h-full border-muted/60 hover:border-primary/50 hover:shadow-md", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats || "-"}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                    {status !== "active" && (
                        <div className="mt-3">
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                                status === "beta" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            )}>
                                {status.replace("_", " ")}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
