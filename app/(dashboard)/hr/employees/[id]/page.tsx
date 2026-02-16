"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building,
    Briefcase,
    User,
    Clock,
    Shield,
    ArrowLeft,
    KeyRound,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getEmployeeProfile } from "@/lib/firestore/hr";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { GrantAccessDialog } from "@/components/hr";
import type { EmployeeProfile } from "@/types/crm";

// Detail Page Integration
import { DocumentUpload } from "@/components/hr/DocumentUpload";
import { DocumentList } from "@/components/hr/DocumentList";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { isAdmin, isManager, can } = usePermission();

    const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [grantAccessOpen, setGrantAccessOpen] = useState(false);

    const fetchEmployee = async () => {
        if (!params.id) return;

        setLoading(true);
        try {
            const { employee, error } = await getEmployeeProfile(params.id as string);
            if (error) {
                toast.error(error);
                router.push("/hr/employees");
            } else {
                setEmployee(employee);
            }
        } catch (err) {
            toast.error("Failed to load employee profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployee();
    }, [params.id, router]);

    const getInitials = (firstName?: string, lastName?: string) => {
        const first = firstName?.charAt(0) || "";
        const last = lastName?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-xl font-semibold">Employee not found</h2>
                <Button variant="link" onClick={() => router.push("/hr/employees")}>
                    Return to directory
                </Button>
            </div>
        );
    }

    return (
        <RBACGuard>
            <div className="space-y-6">
                <PageHeader
                    title="Employee Profile"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "HR", href: "/hr" },
                        { label: "Employees", href: "/hr/employees" },
                        { label: employee.displayName || "Profile" },
                    ]}
                    action={
                        <Button variant="outline" onClick={() => router.push("/hr/employees")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Directory
                        </Button>
                    }
                />

                {/* Profile Header Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
                                <AvatarImage src={employee.photoURL} />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(employee.firstName, employee.lastName)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <div>
                                    <h2 className="text-2xl font-bold">{employee.displayName}</h2>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <Building className="h-3.5 w-3.5" />
                                        {employee.department} • {employee.jobTitle}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Badge variant="secondary">{employee.employmentType}</Badge>
                                    <Badge variant={employee.onboardingStatus === "Completed" ? "default" : "secondary"}>
                                        {employee.onboardingStatus}
                                    </Badge>
                                    <Badge variant={employee.hasCRMAccess ? "default" : "outline"} className={employee.hasCRMAccess ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : ""}>
                                        {employee.hasCRMAccess ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Has CRM Access
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="h-3 w-3 mr-1" />
                                                No CRM Access
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isAdmin() && !employee.hasCRMAccess && (
                                    <Button onClick={() => setGrantAccessOpen(true)} variant="default">
                                        <KeyRound className="h-4 w-4 mr-2" />
                                        Grant CRM Access
                                    </Button>
                                )}
                                {isAdmin() && (
                                    <Button onClick={() => { /* Edit logic would go here */ }} variant="outline">
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="personal">Personal Info</TabsTrigger>
                        <TabsTrigger value="employment">Employment</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Email</p>
                                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Phone</p>
                                            <p className="text-sm text-muted-foreground">{employee.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Address</p>
                                            <p className="text-sm text-muted-foreground">{employee.address || "N/A"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Work Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Department</p>
                                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Job Title</p>
                                            <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Reports To</p>
                                            <p className="text-sm text-muted-foreground">{employee.reportsTo || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Start Date</p>
                                            <p className="text-sm text-muted-foreground">
                                                {employee.startDate
                                                    ? format(employee.startDate.toDate(), "MMM d, yyyy")
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* PERSONAL INFO TAB */}
                    <TabsContent value="personal" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                        <p>{employee.firstName} {employee.lastName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                                        <p>{employee.emergencyContact?.name || "N/A"} ({employee.emergencyContact?.relationship || "N/A"})</p>
                                        <p className="text-sm text-muted-foreground">{employee.emergencyContact?.phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* EMPLOYMENT TAB */}
                    <TabsContent value="employment" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                                        <p>{employee.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Work Email</p>
                                        <p>{employee.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                                        <p>{employee.employmentType}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Salary</p>
                                        <p>
                                            {isAdmin()
                                                ? `${employee.salary?.currency || "USD"} ${employee.salary?.baseSalary?.toLocaleString() || "0"} (${employee.salary?.payFrequency || "Yearly"})`
                                                : "********"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {/* DOCUMENTS TAB */}
                    <TabsContent value="documents" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isAdmin() && (
                                    <DocumentUpload
                                        userId={employee.id}
                                        onSuccess={fetchEmployee}
                                    />
                                )}

                                <DocumentList
                                    userId={employee.id}
                                    documents={employee.documents || []}
                                    onRefresh={fetchEmployee}
                                    canDelete={isAdmin()}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Grant CRM Access Dialog */}
                {employee && (
                    <GrantAccessDialog
                        open={grantAccessOpen}
                        onOpenChange={setGrantAccessOpen}
                        employee={{
                            id: employee.id,
                            displayName: employee.displayName,
                            email: employee.email,
                            firstName: employee.firstName,
                            lastName: employee.lastName,
                        }}
                        onAccessGranted={fetchEmployee}
                    />
                )}
            </div>
        </RBACGuard>
    );
}
