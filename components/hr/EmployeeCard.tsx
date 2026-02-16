"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building, Briefcase, Mail, Phone, MapPin } from "lucide-react";
import type { EmployeeProfile } from "@/types/crm";
import { format } from "date-fns";

interface EmployeeCardProps {
  employee: EmployeeProfile;
  onClick?: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getEmploymentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Full-Time": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "Part-Time": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Contract: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Intern: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return colors[type] || "";
  };

  return (
    <Card
      className={`p-4 transition-all hover:shadow-md cursor-pointer ${onClick ? "hover:border-primary" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={employee.photoURL} />
          <AvatarFallback className="text-lg">
            {getInitials(employee.firstName, employee.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold truncate">{employee.displayName}</h3>
              <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
            </div>
            <Badge variant="secondary" className={getEmploymentTypeColor(employee.employmentType)}>
              {employee.employmentType}
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{employee.jobTitle}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{employee.department}</span>
            </div>

            {employee.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{employee.phone}</span>
              </div>
            )}

            {employee.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{employee.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Started: {employee.startDate ? format(employee.startDate.toDate(), "MMM d, yyyy") : "N/A"}
        </span>
        <Badge variant="outline" className="text-xs">
          {employee.onboardingStatus}
        </Badge>
      </div>
    </Card>
  );
}
