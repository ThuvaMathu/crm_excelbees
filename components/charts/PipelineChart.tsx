"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { DealStage } from "@/types/crm";

interface PipelineDataPoint {
    stage: DealStage;
    count: number;
    value: number;
}

interface PipelineChartProps {
    data: PipelineDataPoint[];
    title?: string;
    description?: string;
}

const STAGE_COLORS: Record<DealStage, string> = {
    Pipeline: "hsl(var(--chart-1))",
    "Follow Up": "hsl(var(--chart-2))",
    "Schedule Service": "hsl(var(--chart-3))",
    Conversation: "hsl(var(--chart-4))",
    Won: "hsl(142, 76%, 36%)", // Green
    Lost: "hsl(0, 84%, 60%)", // Red
};

export function PipelineChart({
    data,
    title = "Sales Pipeline",
    description = "Deals by stage",
}: PipelineChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="stage"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Total Deals</p>
                        <p className="text-2xl font-bold">
                            {data.reduce((sum, item) => sum + item.count, 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">
                            ${data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
