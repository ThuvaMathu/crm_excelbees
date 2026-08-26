"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger/client";

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength validation
    const passwordRequirements = {
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    const isPasswordStrong = Object.values(passwordRequirements).every(Boolean);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("You must be logged in to change your password");
            return;
        }

        if (!isPasswordStrong) {
            toast.error("Password does not meet security requirements");
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(
                user.email!,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser!, credential);

            // Update password
            await updatePassword(auth.currentUser!, newPassword);

            // Update Firestore profile
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                isFirstLogin: false,
                passwordChangedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success("Password changed successfully!");

            router.push("/org");
        } catch (error: any) {
            logger.error("Password change error", { module: "auth", action: "change-password", userId: user.uid, error });

            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Current password is incorrect");
            } else if (error.code === "auth/weak-password") {
                toast.error("New password is too weak");
            } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many attempts. Please try again later.");
            } else if (error.code === "auth/requires-recent-login") {
                toast.error("Session expired. Please log in again and retry.");
            } else {
                toast.error("Failed to change password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Redirect if not first login
    useEffect(() => {
        if (user && !user.isFirstLogin && !loading) {
            router.push("/org");
        }
    }, [user, loading, router]);

    if (user && !user.isFirstLogin) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            {/*
                Password managers / browser autofill can set an input's DOM
                value directly without firing a React-visible "input" event,
                leaving component state (and therefore the match/strength
                checks below) out of sync with what's actually on screen.
                This keyframe fires `onAnimationStart` the instant WebKit/
                Blink/Gecko flags an input as autofilled, which we use above
                to resync state to the real DOM value.
            */}
            <style jsx global>{`
                @keyframes onAutoFillStart { from {} to {} }
                .autofill-detect:-webkit-autofill { animation-name: onAutoFillStart; animation-duration: 0.001s; }
            `}</style>
            <div className="w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Change Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {user?.isFirstLogin
                            ? "Please set a new password to activate your account."
                            : "Update your password to keep your account secure."}
                    </p>
                </div>

                <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        {/* Optional: Add a lock icon header? */}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        name="current-password"
                                        autoComplete="current-password"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        onAnimationStart={(e) => {
                                            if (e.animationName === "onAutoFillStart") setCurrentPassword(e.currentTarget.value);
                                        }}
                                        required
                                        disabled={loading}
                                        className="pr-10 autofill-detect"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        name="new-password"
                                        autoComplete="new-password"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onAnimationStart={(e) => {
                                            if (e.animationName === "onAutoFillStart") setNewPassword(e.currentTarget.value);
                                        }}
                                        required
                                        disabled={loading}
                                        className="pr-10 autofill-detect"
                                        placeholder="Min. 8 chars, 1 uppercase, 1 special"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* Validation Progress Bar / Indicators */}
                                <div className="pt-2">
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <RequirementItem met={passwordRequirements.minLength} text="8+ Characters" />
                                        <RequirementItem met={passwordRequirements.hasUpperCase} text="Uppercase Letter" />
                                        <RequirementItem met={passwordRequirements.hasLowerCase} text="Lowercase Letter" />
                                        <RequirementItem met={passwordRequirements.hasNumber} text="Number" />
                                        <RequirementItem met={passwordRequirements.hasSpecial} text="Special Char" />
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirm-new-password"
                                        autoComplete="new-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onAnimationStart={(e) => {
                                            if (e.animationName === "onAutoFillStart") setConfirmPassword(e.currentTarget.value);
                                        }}
                                        required
                                        disabled={loading}
                                        className="pr-10 autofill-detect"
                                        placeholder="Re-enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && !newPassword && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                                        <XCircle className="h-3 w-3" /> Enter your new password above first
                                    </p>
                                )}
                                {confirmPassword && newPassword && !passwordsMatch && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <XCircle className="h-3 w-3" /> Passwords do not match
                                    </p>
                                )}
                                {confirmPassword && passwordsMatch && (
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 transition-all shadow-md"
                                disabled={loading || !isPasswordStrong || !passwordsMatch}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 transition-colors duration-200 ${met ? "text-green-600 font-medium" : "text-gray-400"}`}>
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />
            )}
            <span>{text}</span>
        </div>
    );
}
