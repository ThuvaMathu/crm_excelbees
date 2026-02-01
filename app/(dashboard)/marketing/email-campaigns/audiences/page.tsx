"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Audience } from "@/types/email-campaigns";
import { Plus, Users, Search, Loader2, Edit, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AudiencesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user) {
            loadAudiences();
        }
    }, [user]);

    const loadAudiences = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/marketing/campaigns/audiences?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch audiences");

            const data = await response.json();
            setAudiences(data.audiences);
        } catch (error) {
            console.error("Error loading audiences:", error);
            toast.error("Failed to load audiences");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (audienceId: string) => {
        if (!confirm("Are you sure you want to delete this audience?")) return;

        try {
            const response = await fetch(
                `/api/marketing/campaigns/audiences/${audienceId}?userId=${user?.uid}`,
                { method: "DELETE" }
            );

            if (!response.ok) throw new Error("Failed to delete audience");

            toast.success("Audience deleted");
            loadAudiences();
        } catch (error) {
            console.error("Error deleting audience:", error);
            toast.error("Failed to delete audience");
        }
    };

    const filteredAudiences = audiences.filter((audience) =>
        audience.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: audiences.length,
        static: audiences.filter((a) => a.type === "static").length,
        dynamic: audiences.filter((a) => a.type === "dynamic").length,
        totalContacts: audiences.reduce((sum, a) => sum + a.contactCount, 0),
    };

    return (
        <MarketingLayout
            title="Audiences"
            description="Manage your email lists and segments"
            actions={
                <Button onClick={() => router.push("/marketing/email-campaigns/audiences/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Audience
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Audiences</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Static Lists</CardTitle>
                            <Upload className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.static}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dynamic Segments</CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.dynamic}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search audiences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Audience List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredAudiences.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground mb-4">
                                {searchQuery ? "No audiences found" : "No audiences yet"}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => router.push("/marketing/email-campaigns/audiences/new")}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Audience
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredAudiences.map((audience) => (
                            <Card key={audience.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{audience.name}</h3>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${audience.type === "static"
                                                            ? "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900"
                                                            : "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900"
                                                        }`}
                                                >
                                                    {audience.type === "static" ? "Static List" : "Dynamic Segment"}
                                                </span>
                                            </div>

                                            {audience.description && (
                                                <p className="text-sm text-muted-foreground mb-3">{audience.description}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {audience.contactCount.toLocaleString()} contacts
                                                </span>
                                                <span>Source: {audience.source}</span>
                                                {audience.stats && (
                                                    <span className="text-green-600">
                                                        {audience.stats.avgEngagement}% avg engagement
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(`/marketing/email-campaigns/audiences/${audience.id}`)
                                                }
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(audience.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
