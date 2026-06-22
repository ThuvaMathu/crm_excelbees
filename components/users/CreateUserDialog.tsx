"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { createUserAction } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

import { Loader2, UserPlus, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";

interface CreateUserDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated, open: controlledOpen, onOpenChange }: CreateUserDialogProps) {
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [createdUser, setCreatedUser] = useState<{
        email: string;
        tempPassword: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        displayName: "",
        phoneNumber: "",
        role: "team" as "admin" | "manager" | "team",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setLoading(true);

        // Validate and clean phone number
        let formattedPhone = formData.phoneNumber.trim();

        if (formattedPhone) {
            // Remove spaces, dashes, parentheses
            formattedPhone = formattedPhone.replace(/[\s\-\(\)]/g, "");

            // Basic E.164 check: must start with + and contain digits
            if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
                toast.error("Phone number must be in international format (e.g., +61412345678)");
                setLoading(false);
                return;
            }
        }

        try {
            const callerToken = await auth.currentUser?.getIdToken(true);
            if (!callerToken) {
                toast.error("Session expired. Please sign in again.");
                setLoading(false);
                return;
            }

            const result = await createUserAction({
                ...formData,
                phoneNumber: formattedPhone || undefined,
                callerToken,
            });

            if (result.success && result.tempPassword) {
                setCreatedUser({
                    email: formData.email,
                    tempPassword: result.tempPassword,
                });
                toast.success("User created successfully!");

                // Reset form
                setFormData({
                    email: "",
                    displayName: "",
                    phoneNumber: "",
                    role: "team",
                });

                // Trigger refresh in parent
                if (onUserCreated) {
                    onUserCreated();
                }
            } else {
                toast.error(result.error || "Failed to create user");
            }
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast.error("Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPassword = () => {
        if (createdUser) {
            navigator.clipboard.writeText(createdUser.tempPassword);
            setCopied(true);
            toast.success("Password copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setCreatedUser(null);
        setCopied(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Create a new user account. They will receive login credentials and must change their password on first login.
                    </DialogDescription>
                </DialogHeader>

                {createdUser ? (
                    // Success state - show credentials
                    <div className="space-y-4">
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                User created successfully! Share these credentials securely.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium">Email</Label>
                                <p className="text-sm text-muted-foreground mt-1">{createdUser.email}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Temporary Password</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                                        {createdUser.tempPassword}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCopyPassword}
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Alert>
                                <AlertDescription className="text-sm">
                                    ⚠️ Make sure to save this password. It won't be shown again. The user must change it on first login.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    // Form state
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Full Name *</Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({ ...formData, displayName: e.target.value })
                                }
                                required
                                disabled={loading}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                required
                                disabled={loading}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                disabled={loading}
                                placeholder="+61412345678"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Must include country code (e.g., +61 for Australia)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: "admin" | "manager" | "team") =>
                                    setFormData({ ...formData, role: value })
                                }
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="team">Team</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create User"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
