"use client";

import { MarketingFeatureCard } from "@/components/marketing/shared/MarketingFeatureCard";
import {
    Search,
    BarChart,
    Mail,
    PenTool,
    Share2,
    Megaphone,
    Calendar,
    Layout,
    LineChart,
    Key,
    Globe
} from "lucide-react";

export default function MarketingDashboardPage() {
    const features = [
        {
            title: "Competitor Analysis",
            description: "Analyze competitors' strategies, traffic, and content to find opportunities.",
            href: "/marketing/competitors",
            icon: Globe,
            status: "active" as const,
            stats: "3 Tracked"
        },
        {
            title: "SEO Analyzer",
            description: "Audit your site and get AI-powered optimization recommendations.",
            href: "/marketing/seo",
            icon: Search,
            status: "active" as const,
            stats: "92 Score"
        },
        {
            title: "Keyword Research",
            description: "Discover high-potential keywords and track your rankings.",
            href: "/marketing/keywords",
            icon: Key,
            status: "active" as const,
            stats: "150 Keywords"
        },
        // ... (omitting middle items) ...
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {features.map((feature) => (
                    <MarketingFeatureCard
                        key={feature.title}
                        {...feature}
                    />
                ))}
            </div>
        </div>
    );
}
