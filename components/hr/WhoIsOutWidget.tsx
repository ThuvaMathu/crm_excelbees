"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import { getUserLeaveRequests, getTeamLeaveRequests, getTeamEmployees } from "@/lib/firestore/hr";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { parseISO } from "date-fns";
import type { LeaveRequest } from "@/types/crm";

export function WhoIsOutWidget() {
  const { user } = useAuth();
  const { isManager, isAdmin } = usePermission();
  const [awayToday, setAwayToday] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAwayToday = async () => {
      if (!user?.uid) return;

      setLoading(true);
      const today = new Date();

      try {
        let leaves: LeaveRequest[] = [];

        if (isAdmin()) {
          // Admin - get all pending/approved leaves
          // For simplicity, showing only approved leaves for today
          // In production, you'd have a proper API for this
        } else if (isManager()) {
          // Manager - get team leaves
          const teamResult = await getTeamEmployees(user.uid);
          const teamIds = (teamResult.employees || []).map((e) => e.id);
          if (teamIds.length > 0) {
            const leavesResult = await getTeamLeaveRequests(teamIds);
            leaves = leavesResult.leaves || [];
          }
        } else {
          // Regular user - get own leaves
          const result = await getUserLeaveRequests(user.uid);
          leaves = result.leaves || [];
        }

        // Filter for today's approved leaves
        const away = leaves.filter((leave) => {
          if (leave.status !== "Approved") return false;

          const start = parseISO(leave.startDate);
          const end = parseISO(leave.endDate);

          return today >= start && today <= end;
        });

        setAwayToday(away);
      } finally {
        setLoading(false);
      }
    };

    fetchAwayToday();
  }, [user]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Who's Out Today</h3>
      </div>

      {awayToday.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Everyone is present today
        </div>
      ) : (
        <ul className="space-y-2">
          {awayToday.map((leave) => (
            <li key={leave.id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {leave.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate flex-1">{leave.userName}</span>
              <span className="text-xs text-muted-foreground">{leave.type}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
