"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createEmployeeProfile } from "@/lib/firestore/hr";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Timestamp } from "firebase/firestore";
import type { EmployeeProfileInput } from "@/types/crm";

interface CreateEmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmployeeCreated: () => void;
}

const DEPARTMENTS = [
    "Sales",
    "Engineering",
    "Marketing",
    "HR",
    "Finance",
    "Operations",
    "Customer Support",
];

const EMPLOYMENT_TYPES = [
    "Full-Time",
    "Part-Time",
    "Contract",
    "Intern",
];

export function CreateEmployeeDialog({ open, onOpenChange, onEmployeeCreated }: CreateEmployeeDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        department: "",
        jobTitle: "",
        employmentType: "Full-Time",
        startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setLoading(true);

        // 1. Validate Phone
        let formattedPhone = formData.phone.trim();
        if (formattedPhone) {
            formattedPhone = formattedPhone.replace(/[\s\-\(\)]/g, "");
            if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
                toast.error("Phone number must be in international format (e.g., +61412345678)");
                setLoading(false);
                return;
            }
        }

        try {
            // 2. Create Employee Profile ONLY (no user account)
            const employeeData: EmployeeProfileInput = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: formattedPhone || undefined,
                department: formData.department,
                jobTitle: formData.jobTitle,
                employmentType: formData.employmentType as any,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                onboardingStatus: "Pending",
                hasCRMAccess: false, // Explicitly set to false - no CRM access yet
                userId: null, // No user account linked
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const result = await createEmployeeProfile(employeeData);

            if (result.success) {
                toast.success("Employee created successfully! No CRM access granted yet.");
                setShowSuccess(true);
                onEmployeeCreated();
            } else {
                toast.error("Failed to create employee: " + (result.error || "Unknown error"));
            }
        } catch (error: any) {
            console.error("Error creating employee:", error);
            toast.error(error.message || "Failed to create employee");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after transition
        setTimeout(() => {
            setShowSuccess(false);
            setFormData({
                email: "",
                firstName: "",
                lastName: "",
                phone: "",
                department: "",
                jobTitle: "",
                employmentType: "Full-Time",
                startDate: new Date().toISOString().split('T')[0],
            });
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Create an employee profile in the HR system. CRM access can be granted separately.
                    </DialogDescription>
                </DialogHeader>

                {showSuccess ? (
                    // Success State - No credentials shown since no user was created
                    <div className="space-y-4 py-4">
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                Employee profile created successfully!
                            </AlertDescription>
                        </Alert>

                        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                            <p className="text-sm font-medium">Employee Information:</p>
                            <p className="text-sm">{formData.firstName} {formData.lastName}</p>
                            <p className="text-sm text-muted-foreground">{formData.email}</p>
                            <p className="text-sm text-muted-foreground">{formData.department} - {formData.jobTitle}</p>
                        </div>

                        <Alert>
                            <AlertDescription className="text-sm">
                                <strong>Note:</strong> This employee does not have CRM access yet.
                                To grant login access, go to the employee profile and click "Grant CRM Access"
                                or create a user account and link it to this employee.
                            </AlertDescription>
                        </Alert>

                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    // Form State
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+61..."
                                    disabled={loading}
                                />
                                <p className="text-[0.7rem] text-muted-foreground">E.164 format (e.g. +61412345678)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Department *</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                                    disabled={loading}
                                    required
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title *</Label>
                                <Input
                                    id="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employmentType">Employment Type *</Label>
                                <Select
                                    value={formData.employmentType}
                                    onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
                                    disabled={loading}
                                >
                                    <SelectTrigger id="employmentType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMPLOYMENT_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription className="text-sm">
                                <strong>Heads up:</strong> Creating this employee will <strong>not</strong> create a CRM login account.
                                You can grant CRM access later from the employee profile page.
                            </AlertDescription>
                        </Alert>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Employee Profile"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
