"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { UserRole } from "@/types/crm";

interface GrantAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  onAccessGranted: () => void;
}

export function GrantAccessDialog({
  open,
  onOpenChange,
  employee,
  onAccessGranted,
}: GrantAccessDialogProps) {
  const [email, setEmail] = useState(employee.email);
  const [role, setRole] = useState<UserRole>("team");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/hr/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          email,
          role,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("CRM access granted successfully");
        onAccessGranted();
        onOpenChange(false);
        // Reset form
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to grant access");
      }
    } catch (error) {
      toast.error("Failed to grant access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Grant CRM Access</DialogTitle>
          <DialogDescription>
            Create a CRM account for <strong>{employee.displayName}</strong>.
            They will be able to log in and access the system based on their role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Employee Info (Read-only) */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">{employee.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {employee.firstName && employee.lastName
                ? `${employee.firstName} ${employee.lastName}`
                : employee.displayName}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              CRM Login Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              User Role <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full Access</SelectItem>
                <SelectItem value="manager">Manager - Team Management</SelectItem>
                <SelectItem value="team">Team Member - Basic Access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "admin" && "Full access to all modules including user management."}
              {role === "manager" && "Can manage team members and view team data."}
              {role === "team" && "Basic access to assigned tasks and own data."}
            </p>
          </div>

          {/* Password (Optional - will be generated if not provided) */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {password && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to auto-generate"
            />
          </div>

          {/* Confirm Password */}
          {password && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Grant Access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
