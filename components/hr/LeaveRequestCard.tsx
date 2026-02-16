"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Calendar, Clock, AlertCircle } from "lucide-react";
import type { LeaveRequest, LeaveStatus } from "@/types/crm";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveRequestCardProps {
    request: LeaveRequest;
    isManagerView?: boolean;
    onApprove?: (id: string) => Promise<void>;
    onReject?: (id: string) => Promise<void>;
    onCancel?: (id: string) => Promise<void>;
    loading?: boolean;
}

export function LeaveRequestCard({
    request,
    isManagerView = false,
    onApprove,
    onReject,
    onCancel,
    loading = false,
}: LeaveRequestCardProps) {
    const getStatusColor = (status: LeaveStatus) => {
        switch (status) {
            case "Approved": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
            case "Rejected": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
            case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
            case "Cancelled": return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
            default: return "";
        }
    };

    return (
        <Card className={cn("border-l-4",
            request.status === "Approved" ? "border-l-green-500" :
                request.status === "Rejected" ? "border-l-red-500" :
                    request.status === "Pending" ? "border-l-yellow-500" : "border-l-gray-500"
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {isManagerView && (
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                {isManagerView ? request.userName : request.type}
                                {!isManagerView && <span className="text-xs font-normal text-muted-foreground">({request.daysCount} days)</span>}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(request.startDate), "MMM d, yyyy")} - {format(parseISO(request.endDate), "MMM d, yyyy")}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className={cn("capitalize border", getStatusColor(request.status))}>
                        {request.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm">
                {isManagerView && (
                    <div className="mb-2">
                        <span className="font-semibold text-muted-foreground">Type: </span>
                        {request.type} ({request.daysCount} days)
                    </div>
                )}
                <div className="bg-muted/50 p-2 rounded-md italic text-muted-foreground">
                    "{request.reason}"
                </div>
                {request.rejectionReason && (
                    <div className="mt-2 text-red-600 dark:text-red-400 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <div>
                            <span className="font-semibold">Rejected:</span> {request.rejectionReason}
                        </div>
                    </div>
                )}
                {request.status === "Approved" && request.managerName && (
                    <div className="mt-2 text-green-600 dark:text-green-400 text-xs flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Approved by {request.managerName}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 justify-end gap-2">
                {isManagerView && request.status === "Pending" && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/20"
                            onClick={() => onReject?.(request.id)}
                            disabled={loading}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onApprove?.(request.id)}
                            disabled={loading}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                        </Button>
                    </>
                )}
                {!isManagerView && request.status === "Pending" && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel?.(request.id)}
                        disabled={loading}
                    >
                        Cancel Request
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
