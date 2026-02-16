"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getAllEmployees,
  getEmployeesByDepartment,
  getTeamEmployees,
  deleteEmployeeProfile,
} from "@/lib/firestore/hr";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { RBACGuard } from "@/components/auth/RBACGuard";
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Eye,
  UserPlus,
  Building,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmployeeProfile } from "@/types/crm";
import { CreateEmployeeDialog } from "@/components/hr/CreateEmployeeDialog";
import { createAuditLog } from "@/lib/firestore/audit-logs";

const DEPARTMENTS = [
  "All Departments",
  "Sales",
  "Engineering",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Customer Support",
];

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const { isAdmin, isManager, can } = usePermission();

  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeProfile | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let result;
      // Managers only see their team, Admin sees all
      if (!isAdmin() && isManager()) {
        result = await getTeamEmployees(currentUser?.uid || "");
      } else {
        result = await getAllEmployees();
      }

      if (result.error) {
        toast.error("Failed to load employees: " + result.error);
      } else {
        setEmployees(result.employees || []);
        setFilteredEmployees(result.employees || []);
      }
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = [...employees];

    // Filter by department
    if (selectedDepartment !== "All Departments") {
      filtered = filtered.filter((emp) => emp.department === selectedDepartment);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.firstName?.toLowerCase().includes(query) ||
          emp.lastName?.toLowerCase().includes(query) ||
          emp.displayName?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          emp.jobTitle?.toLowerCase().includes(query)
      );
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, selectedDepartment, employees]);

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    console.log("Deleting employee:", employeeToDelete);
    console.log("Employee ID to delete:", employeeToDelete.id);

    // Guard against missing ID
    if (!employeeToDelete.id) {
      toast.error("Error: Employee ID is missing");
      return;
    }

    const { success, error } = await deleteEmployeeProfile(employeeToDelete.id);
    console.log("Delete result:", { success, error });

    if (success) {
      toast.success("Employee profile deleted");
      // ... log audit ...
      await createAuditLog({
        action: "user_deleted",
        performedBy: currentUser?.uid || "",
        performedByName: currentUser?.displayName || currentUser?.email || "",
        targetUserId: employeeToDelete.userId || employeeToDelete.id,
        targetUserName: employeeToDelete.displayName,
        details: { department: employeeToDelete.department },
      });
      setEmployees(employees.filter((e) => e.id !== employeeToDelete.id));
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } else {
      toast.error("Failed to delete: " + error);
    }
  };

  const openDeleteDialog = (employee: EmployeeProfile) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

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
    <RBACGuard>
      <div className="space-y-6">
        <PageHeader
          title="Employee Directory"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "HR", href: "/hr" },
            { label: "Employees" },
          ]}
          description="Manage your team and employee information"
          action={
            isAdmin() ? (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            ) : undefined
          }
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-muted-foreground">
            <span>Total: {filteredEmployees.length} employees</span>
            {selectedDepartment !== "All Departments" && (
              <span>Department: {selectedDepartment}</span>
            )}
          </div>
        </Card>

        {/* Employee Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedDepartment !== "All Departments"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first employee"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.photoURL} />
                            <AvatarFallback>
                              {getInitials(employee.firstName, employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.displayName || `${employee.firstName} ${employee.lastName}`}
                            </div>
                            <div className="text-xs text-muted-foreground">{employee.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          {employee.department}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {employee.jobTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getEmploymentTypeColor(employee.employmentType)}>
                          {employee.employmentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {employee.startDate
                            ? format(employee.startDate.toDate(), "MMM d, yyyy")
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {employee.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </div>
                          )}
                          {employee.address && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{employee.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/hr/employees/${employee.id}`} className="flex items-center cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </a>
                            </DropdownMenuItem>
                            {isAdmin() && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(employee)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Profile
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the employee profile for{" "}
              <strong>{employeeToDelete?.displayName}</strong>? This action cannot be undone.
              The user account will remain active, but all HR data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Employee Dialog */}
      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEmployeeCreated={() => {
          setCreateDialogOpen(false);
          fetchEmployees();
        }}
      />
    </RBACGuard>
  );
}
