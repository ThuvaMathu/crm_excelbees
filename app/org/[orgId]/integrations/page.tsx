"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Mail,
    Calendar,
    MessageSquare,
    Webhook,
    Plug,
    ArrowRight,
    Slack,
    Globe,
    BarChart3,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface Integration {
    name: string;
    description: string;
    icon: React.ElementType;
    category: string;
    status: "available" | "coming_soon";
}

const INTEGRATIONS: Integration[] = [
    {
        name: "Email (SMTP)",
        description: "Connect your email provider to send campaigns and transactional emails.",
        icon: Mail,
        category: "Communication",
        status: "available",
    },
    {
        name: "Google Calendar",
        description: "Sync meetings, follow-ups, and task deadlines with Google Calendar.",
        icon: Calendar,
        category: "Productivity",
        status: "coming_soon",
    },
    {
        name: "Slack",
        description: "Receive real-time notifications for leads, deals, and tasks in Slack.",
        icon: Slack,
        category: "Communication",
        status: "coming_soon",
    },
    {
        name: "Webhooks",
        description: "Push CRM events to any external system using configurable webhooks.",
        icon: Webhook,
        category: "Developer",
        status: "coming_soon",
    },
    {
        name: "Google Analytics",
        description: "Track website visitor-to-lead conversion and campaign performance.",
        icon: BarChart3,
        category: "Analytics",
        status: "coming_soon",
    },
    {
        name: "Custom API",
        description: "Use the Excelbees REST API to build custom integrations.",
        icon: Globe,
        category: "Developer",
        status: "coming_soon",
    },
    {
        name: "WhatsApp Business",
        description: "Message leads and contacts directly from the CRM via WhatsApp.",
        icon: MessageSquare,
        category: "Communication",
        status: "coming_soon",
    },
];

const CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

export default function IntegrationsPage() {
    const router = useRouter();
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plug className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
                </div>
                <p className="text-muted-foreground">
                    Connect Excelbees CRM with the tools your team already uses.
                </p>
            </div>

            {/* Category sections */}
            {CATEGORIES.map((category) => {
                const items = INTEGRATIONS.filter((i) => i.category === category);
                return (
                    <div key={category} className="mb-10">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            {category}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((integration) => {
                                const Icon = integration.icon;
                                const available = integration.status === "available";
                                return (
                                    <Card
                                        key={integration.name}
                                        className={available ? "hover:shadow-md transition-shadow cursor-pointer" : "opacity-70"}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                </div>
                                                <Badge
                                                    variant={available ? "default" : "secondary"}
                                                    className="text-[10px]"
                                                >
                                                    {available ? "Available" : "Coming soon"}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-sm mt-3">{integration.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <CardDescription className="text-xs leading-relaxed mb-4">
                                                {integration.description}
                                            </CardDescription>
                                            {available ? (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="w-full gap-1.5 text-xs h-8"
                                                    onClick={() => {
                                                        if (integration.name === "Email (SMTP)") {
                                                            router.push(`/org/${orgId}/integrations/smtp`);
                                                        }
                                                    }}
                                                >
                                                    Configure
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled className="w-full text-xs h-8">
                                                    Notify me
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
