"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getAllPayrollRecords,
  createPayrollRecord,
  updatePayrollStatus,
} from "@/lib/firestore/hr";
import { getAllEmployees } from "@/lib/firestore/hr";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { RBACGuard } from "@/components/auth/RBACGuard";
import {
  DollarSign,
  Download,
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PayrollRecord, EmployeeProfile, PayrollStatus } from "@/types/crm";

export default function PayrollPage() {
  const { user } = useAuth();
  const { isAdmin } = usePermission();

  const [allPayroll, setAllPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [additions, setAdditions] = useState<{ description: string; amount: string }[]>([]);
  const [deductions, setDeductions] = useState<{ description: string; amount: string }[]>([]);
  const [netSalary, setNetSalary] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchAllPayroll = async () => {
    setLoading(true);
    try {
      const result = await getAllPayrollRecords();
      if (result.error) {
        toast.error("Failed to load payroll records");
      } else {
        setAllPayroll(result.payrolls || []);
      }
    } catch (err) {
      toast.error("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const result = await getAllEmployees();
      if (result.employees) {
        setEmployees(result.employees);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAllPayroll();
      fetchEmployees();
    }
  }, [isAdmin()]);

  // Auto-calculate net salary
  useEffect(() => {
    const base = parseFloat(baseSalary) || 0;
    const adds = additions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const subs = deductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setNetSalary(base + adds - subs);
  }, [baseSalary, additions, deductions]);

  const handleAddField = (type: "add" | "ded") => {
    if (type === "add") {
      setAdditions([...additions, { description: "", amount: "" }]);
    } else {
      setDeductions([...deductions, { description: "", amount: "" }]);
    }
  };

  const handleRemoveField = (type: "add" | "ded", index: number) => {
    if (type === "add") {
      setAdditions(additions.filter((_, i) => i !== index));
    } else {
      setDeductions(deductions.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (
    type: "add" | "ded",
    index: number,
    field: "description" | "amount",
    value: string
  ) => {
    if (type === "add") {
      const newAdditions = [...additions];
      newAdditions[index][field] = value;
      setAdditions(newAdditions);
    } else {
      const newDeductions = [...deductions];
      newDeductions[index][field] = value;
      setDeductions(newDeductions);
    }
  };

  const handleCreatePayroll = async () => {
    if (!selectedEmployee || !periodStart || !periodEnd || !baseSalary) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const employee = employees.find((e) => e.id === selectedEmployee);
      if (!employee) {
        toast.error("Employee not found");
        return;
      }

      const salaryBase = parseFloat(baseSalary);
      const result = await createPayrollRecord({
        userId: selectedEmployee,
        userName: employee.displayName,
        periodStart,
        periodEnd,
        payoutDate: periodEnd,
        baseSalary: salaryBase,
        additions: additions
          .filter((a) => a.description && a.amount)
          .map((a) => ({ description: a.description, amount: parseFloat(a.amount) })),
        deductions: deductions
          .filter((d) => d.description && d.amount)
          .map((d) => ({ description: d.description, amount: parseFloat(d.amount) })),
        currency: "USD",
        netSalary: netSalary,
        status: "Draft",
      });

      if (result.success) {
        toast.success("Payroll record created");
        setCreateDialogOpen(false);
        // Reset form
        setSelectedEmployee("");
        setPeriodStart("");
        setPeriodEnd("");
        setBaseSalary("");
        setAdditions([]);
        setDeductions([]);
        fetchAllPayroll();
      } else {
        toast.error("Failed to create: " + result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (payrollId: string, newStatus: PayrollStatus) => {
    const result = await updatePayrollStatus(payrollId, newStatus);
    if (result.success) {
      toast.success(`Status updated to ${newStatus}`);
      fetchAllPayroll();
    } else {
      toast.error("Failed to update status: " + result.error);
    }
  };

  const openViewDialog = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Paid</Badge>;
      case "Processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Processing</Badge>;
      case "Draft":
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const calculateTotalPayroll = () => {
    return allPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  };

  return (
    <RBACGuard>
      <div className="space-y-6">
        <PageHeader
          title="Payroll Management"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "HR", href: "/hr" },
            { label: "Payroll" },
          ]}
          description="Admin-only payroll and salary records"
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Payroll
            </Button>
          }
        />

        {/* Summary Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Payroll (All Time)</p>
              <p className="text-3xl font-bold">${calculateTotalPayroll().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Records</p>
              <p className="text-2xl font-semibold">{allPayroll.length}</p>
            </div>
          </div>
        </Card>

        {/* Payroll Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : allPayroll.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payroll records found</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                Create First Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(record.periodStart), "MMM yyyy")}</div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(record.periodStart), "MMM d")} - {format(new Date(record.periodEnd), "MMM d")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${record.baseSalary.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${record.netSalary.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{format(new Date(record.payoutDate), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(record)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {record.status === "Draft" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(record.id, "Processing")}>
                                <Clock className="h-4 w-4 mr-2" />
                                Mark Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(record.id, "Paid")}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Paid
                              </DropdownMenuItem>
                            </>
                          )}
                          {record.status === "Processing" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record.id, "Paid")}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Paid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create Payroll Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Payroll Record</DialogTitle>
              <DialogDescription>
                Create a new payroll record for an employee.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Employee */}
              <div className="space-y-2">
                <Label>Employee</Label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    // Pre-fill with employee's salary if available
                    const emp = employees.find((emp) => emp.id === e.target.value);
                    if (emp?.salary) {
                      setBaseSalary(emp.salary.baseSalary.toString());
                    }
                  }}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.displayName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start *</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End *</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Base Salary */}
              <div className="space-y-2">
                <Label>Base Salary *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Additions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-green-600">Additions (Bonus, etc.)</Label>
                  <Button variant="ghost" size="sm" onClick={() => handleAddField("add")} className="h-7 px-2">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {additions.map((add, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={add.description}
                      onChange={(e) => handleFieldChange("add", i, "description", e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">$</span>
                      <Input
                        type="number"
                        placeholder="Amt"
                        value={add.amount}
                        onChange={(e) => handleFieldChange("add", i, "amount", e.target.value)}
                        className="pl-5 h-8 text-xs text-right"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveField("add", i)} className="h-8 w-8 text-red-500">
                      <X className="h-3.3 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-red-600">Deductions (Tax, etc.)</Label>
                  <Button variant="ghost" size="sm" onClick={() => handleAddField("ded")} className="h-7 px-2">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {deductions.map((ded, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={ded.description}
                      onChange={(e) => handleFieldChange("ded", i, "description", e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">$</span>
                      <Input
                        type="number"
                        placeholder="Amt"
                        value={ded.amount}
                        onChange={(e) => handleFieldChange("ded", i, "amount", e.target.value)}
                        className="pl-5 h-8 text-xs text-right"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveField("ded", i)} className="h-8 w-8 text-red-500">
                      <X className="h-3.3 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Net Salary Summary */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center font-bold text-lg">
                <span>Net Salary:</span>
                <span className="text-primary">${netSalary.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayroll} disabled={submitting}>
                {submitting && <LoadingSpinner size="sm" className="mr-2" />}
                Create Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Payroll Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Payslip Details</DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employee</p>
                    <p className="font-medium">{selectedPayroll.userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Period</p>
                    <p className="font-medium">
                      {format(new Date(selectedPayroll.periodStart), "MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Salary</span>
                    <span>${selectedPayroll.baseSalary.toLocaleString()}</span>
                  </div>

                  {selectedPayroll.additions && selectedPayroll.additions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600">Additions</p>
                      {selectedPayroll.additions.map((add, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{add.description}</span>
                          <span className="text-green-600">+${add.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPayroll.deductions && selectedPayroll.deductions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">Deductions</p>
                      {selectedPayroll.deductions.map((ded, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{ded.description}</span>
                          <span className="text-red-600">-${ded.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Net Salary</span>
                    <span>${selectedPayroll.netSalary.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Status</span>
                  {getStatusBadge(selectedPayroll.status)}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RBACGuard>
  );
}
