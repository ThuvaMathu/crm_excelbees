"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getDeals } from "@/lib/firestore/deals";
import { getProjects } from "@/lib/firestore/projects";
import { useOrgStore } from "@/store/org";
import type { Deal, Project } from "@/types/crm";
import { Briefcase, FolderKanban } from "lucide-react";

interface DealProjectLinkerProps {
    companyId?: string;
    onDealSelect: (dealId?: string, dealName?: string) => void;
    onProjectSelect: (projectId?: string, projectName?: string) => void;
    selectedDealId?: string;
    selectedProjectId?: string;
}

export function DealProjectLinker({
    companyId,
    onDealSelect,
    onProjectSelect,
    selectedDealId,
    selectedProjectId,
}: DealProjectLinkerProps) {
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [deals, setDeals] = useState<Deal[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companyId) {
            fetchData();
        }
    }, [companyId]);

    const fetchData = async () => {
        setLoading(true);
        const [dealsResult, projectsResult] = await Promise.all([
            getDeals(organizationId),
            getProjects(organizationId),
        ]);

        if (!dealsResult.error) {
            const companyDeals = dealsResult.deals.filter(
                (d) => d.companyId === companyId
            );
            setDeals(companyDeals);
        }

        if (!projectsResult.error) {
            const companyProjects = projectsResult.projects.filter(
                (p) => p.companyId === companyId
            );
            setProjects(companyProjects);
        }
        setLoading(false);
    };

    if (!companyId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Link to Deal/Project</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Select a company first to link deals or projects
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Link to Deal/Project (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Deal Selector */}
                <div className="space-y-2">
                    <Label htmlFor="deal">Related Deal</Label>
                    <Select
                        value={selectedDealId || "none"}
                        onValueChange={(value) => {
                            if (value === "none") {
                                onDealSelect(undefined, undefined);
                            } else {
                                const deal = deals.find((d) => d.id === value);
                                if (deal) onDealSelect(deal.id, deal.title);
                            }
                        }}
                        disabled={loading}
                    >
                        <SelectTrigger id="deal">
                            <SelectValue placeholder="Select a deal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground">None</span>
                            </SelectItem>
                            {deals.map((deal) => (
                                <SelectItem key={deal.id} value={deal.id}>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        {deal.title} - ${deal.value.toLocaleString()}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Project Selector */}
                <div className="space-y-2">
                    <Label htmlFor="project">Related Project</Label>
                    <Select
                        value={selectedProjectId || "none"}
                        onValueChange={(value) => {
                            if (value === "none") {
                                onProjectSelect(undefined, undefined);
                            } else {
                                const project = projects.find((p) => p.id === value);
                                if (project) onProjectSelect(project.id, project.name);
                            }
                        }}
                        disabled={loading}
                    >
                        <SelectTrigger id="project">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground">None</span>
                            </SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4" />
                                        {project.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {deals.length === 0 && projects.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground">
                        No deals or projects found for this company
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
