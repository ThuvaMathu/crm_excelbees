"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Calendar } from "lucide-react";
import type { LeaveType } from "@/types/crm";

interface LeaveBalanceCardProps {
  type: LeaveType;
  available: number;
  used: number;
  label: string;
}

const LEAVE_COLORS: Record<LeaveType, string> = {
  Vacation: "text-blue-600 dark:text-blue-400",
  Sick: "text-red-600 dark:text-red-400",
  Personal: "text-purple-600 dark:text-purple-400",
  Unpaid: "text-gray-600 dark:text-gray-400",
};

export function LeaveBalanceCard({ type, available, used, label }: LeaveBalanceCardProps) {
  const total = available + used;
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const remaining = total - used;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`font-semibold ${LEAVE_COLORS[type]}`}>{label}</span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="text-2xl font-bold mb-1">
        {remaining} <span className="text-sm font-normal text-muted-foreground">/ {total}</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage > 80 ? "bg-red-500" : percentage > 50 ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{used} days used</span>
        <Badge variant="outline" className="text-xs">
          {total > 0 ? Math.round(percentage) : 0}% used
        </Badge>
      </div>
    </Card>
  );
}
