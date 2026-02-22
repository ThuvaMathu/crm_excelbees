"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MarketingLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumb?: React.ReactNode;
}

import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

interface MarketingLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumb?: React.ReactNode;
}

const SEGMENT_LABELS: Record<string, string> = {
    "marketing": "Marketing",
    "email-campaigns": "Email Campaigns",
    "templates": "Templates",
    "audiences": "Audiences",
    "new": "New",
    "calendar": "Calendar",
    "analytics": "Analytics",
    "build": "Build",
    "review": "Review",
    "competitors": "Competitors",
    "keyword": "Keyword Research",
    "blog": "Blog Writer",
};

export function MarketingLayout({
    children,
    title,
    description,
    actions,
    breadcrumb
}: MarketingLayoutProps) {
    const pathname = usePathname();

    // Auto-generate breadcrumbs if not provided
    const renderBreadcrumb = () => {
        if (breadcrumb) return breadcrumb;

        const segments = pathname?.split("/").filter(Boolean) || [];
        // Skip if on root marketing page or dashboard
        if (segments.length <= 1) return null;

        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/marketing">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />

                    {segments.map((segment, index) => {
                        // Skip 'marketing' as we handled it with Home or it's redundant
                        if (segment === "marketing") return null;

                        // Skip ID segments (long strings that aren't in the labels map)
                        if (!SEGMENT_LABELS[segment] && segment.length > 10) {
                            return null;
                        }

                        // Skip intermediate route segments that don't have their own pages
                        const skipSegments = ["plan", "seo", "preview", "edit"];
                        if (skipSegments.includes(segment)) return null;

                        const isLast = index === segments.length - 1;
                        const href = `/${segments.slice(0, index + 1).join("/")}`;

                        // Format label
                        let label = SEGMENT_LABELS[segment] || segment;

                        // Capitalize first letter if not in map
                        if (!SEGMENT_LABELS[segment]) {
                            label = segment.charAt(0).toUpperCase() + segment.slice(1);
                        }

                        return (
                            <Fragment key={href}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>{label}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        );
    };

    return (
        <div className="flex flex-col h-full w-full">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    <div className="flex flex-col">
                        {renderBreadcrumb()}
                        {/* Only show title if breadcrumb wasn't explicitly passed as a replacement or if we want both */}
                        <div className="mt-1">
                            <h1 className="text-lg font-semibold leading-none">{title}</h1>
                            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {children}
            </main>
        </div>
    );
}
