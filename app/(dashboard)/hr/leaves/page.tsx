"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RequestLeaveDialog } from "@/components/hr/RequestLeaveDialog";
import { LeaveRequestCard } from "@/components/hr/LeaveRequestCard";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import {
  getUserLeaveRequests,
  getTeamLeaveRequests,
  getPendingLeaveRequests,
  updateLeaveStatus,
  cancelLeaveRequest,
  getTeamEmployees
} from "@/lib/firestore/hr";
import { toast } from "sonner";
import type { LeaveRequest } from "@/types/crm";

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const { isManager, isAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState("my-leaves");
  const [loading, setLoading] = useState(true);

  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMyLeaves = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const result = await getUserLeaveRequests(user.uid);
      if (result.error) toast.error(result.error);
      else setMyLeaves(result.leaves || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaves = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // Logic: If Admin, get ALL pending (or all). If Manager, get team's.
      // For this implementation:
      // Manager -> getTeamLeaveRequests
      // Admin -> getPendingLeaveRequests (for "All Requests" tab if we had it, but re-using Team tab for simplicity or adding a new one)

      let result;
      if (isAdmin() && activeTab === "all-requests") {
        result = await getPendingLeaveRequests(); // Or a function to get ALL leaves if needed
      } else {
        // Get team members first to pass IDs
        const team = await getTeamEmployees(user.uid);
        const teamIds = (team.employees || []).map(e => e.id);
        if (teamIds.length > 0) {
          result = await getTeamLeaveRequests(teamIds);
        } else {
          result = { leaves: [], error: null };
        }
      }

      if (result?.error) toast.error(result.error);
      else setTeamLeaves(result?.leaves || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-leaves") {
      fetchMyLeaves();
    } else {
      fetchTeamLeaves();
    }
  }, [activeTab, user]);

  const handleApprove = async (leaveId: string) => {
    if (!user) return;
    setActionLoading(leaveId);
    try {
      const result = await updateLeaveStatus(
        leaveId,
        "Approved",
        user.uid,
        user.displayName || "Manager"
      );
      if (result.success) {
        toast.success("Leave approved");
        fetchTeamLeaves(); // Refresh
      } else {
        toast.error(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!user) return;
    // Simple prompt for reason
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return; // Cancelled

    setActionLoading(leaveId);
    try {
      const result = await updateLeaveStatus(
        leaveId,
        "Rejected",
        user.uid,
        user.displayName || "Manager",
        reason
      );
      if (result.success) {
        toast.success("Leave rejected");
        fetchTeamLeaves();
      } else {
        toast.error(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    setActionLoading(leaveId);
    try {
      const result = await cancelLeaveRequest(leaveId);
      if (result.success) {
        toast.success("Request cancelled");
        fetchMyLeaves();
      } else {
        toast.error(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <RBACGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Leave Management"
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "HR", href: "/hr" },
              { label: "Leaves" },
            ]}
            description="Manage your leave requests and approvals"
          />
          <RequestLeaveDialog onSuccess={fetchMyLeaves} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
            {(isManager() || isAdmin()) && (
              <TabsTrigger value="team-requests">Team Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-leaves" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Leave History</CardTitle>
                <CardDescription>
                  View the status of your leave requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : myLeaves.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myLeaves.map((leave) => (
                      <LeaveRequestCard
                        key={leave.id}
                        request={leave}
                        onCancel={handleCancel}
                        loading={actionLoading === leave.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(isManager() || isAdmin()) && (
            <TabsContent value="team-requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Leave Requests</CardTitle>
                  <CardDescription>
                    Manage leave requests from your team members.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : teamLeaves.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No team requests found.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teamLeaves.map((leave) => (
                        <LeaveRequestCard
                          key={leave.id}
                          request={leave}
                          isManagerView
                          onApprove={handleApprove}
                          onReject={handleReject}
                          loading={actionLoading === leave.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </RBACGuard>
  );
}
