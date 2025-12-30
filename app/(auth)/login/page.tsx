"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/auth-service";
import { createUserProfile } from "@/lib/firestore/users";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { auth } from "@/lib/firebase";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Chrome } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);


    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    // Convert Firebase error to user-friendly message
    const getErrorMessage = (error: string): string => {
        if (error.includes("user-not-found") || error.includes("wrong-password") || error.includes("invalid-credential")) {
            return "Invalid email or password. Please try again.";
        }
        if (error.includes("too-many-requests")) {
            return "Too many failed attempts. Please try again later.";
        }
        if (error.includes("network-request-failed")) {
            return "Network error. Please check your connection.";
        }
        if (error.includes("invalid-email")) {
            return "Please enter a valid email address.";
        }
        return "Login failed. Please try again.";
    };

    const onSubmit = async (data: LoginFormData) => {
        console.log("🔐 Starting email login for:", data.email);
        setLoading(true);

        try {
            const { user, error: authError } = await signInWithEmail(
                data.email,
                data.password
            );

            if (authError) {
                console.error("❌ Email login error:", authError);
                analytics.loginFailed(data.email, authError, "email");
                toast.error(getErrorMessage(authError));
                setLoading(false);
                return;
            }

            if (!user) {
                console.error("❌ No user returned from email login");
                toast.error("Login failed. Please try again.");
                setLoading(false);
                return;
            }

            console.log("✅ Email login successful, user:", user.uid);
            console.log("📝 Creating user profile in Firestore...");

            // Ensure user profile exists in Firestore
            try {
                await createUserProfile(user.uid, {
                    email: user.email!,
                    displayName: user.displayName || user.email!.split("@")[0],
                    photoURL: user.photoURL || undefined,
                });
                console.log("✅ User profile created/updated");
            } catch (profileError: any) {
                console.error("⚠️ Failed to create user profile:", profileError);
                // Continue anyway - profile creation is not critical for login
            }

            analytics.loginSuccess(user.uid, user.email!, "email");
            toast.success("Welcome back!");

            console.log("🔄 Redirecting to dashboard...");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("❌ Unexpected error in email login:", error);
            toast.error("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        console.log("🔐 Starting Google login flow");
        setLoading(true);

        try {
            const { user, error: authError } = await signInWithGoogle();

            if (authError) {
                console.error("❌ Google login error:", authError);
                analytics.loginFailed("", authError, "google");
                toast.error(getErrorMessage(authError));
                setLoading(false);
                return;
            }

            if (!user) {
                console.error("❌ No user returned from Google login");
                toast.error("Login failed. Please try again.");
                setLoading(false);
                return;
            }

            console.log("✅ Google login successful, user:", user.uid);
            console.log("📝 Creating user profile in Firestore...");

            // Ensure user profile exists in Firestore
            try {
                await createUserProfile(user.uid, {
                    email: user.email!,
                    displayName: user.displayName || "User",
                    photoURL: user.photoURL || undefined,
                });
                console.log("✅ User profile created/updated");
            } catch (profileError: any) {
                console.error("⚠️ Failed to create user profile:", profileError);
                // Continue anyway - profile creation is not critical for login
            }

            analytics.loginSuccess(user.uid, user.email!, "google");
            toast.success("Welcome back!");

            console.log("🔄 Redirecting to dashboard...");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("❌ Unexpected error in Google login:", error);
            toast.error("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-4 text-center pb-6">
                <div className="flex justify-center">
                    <Logo width={180} height={48} />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to your CRM account</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                placeholder="you@company.com"
                                                className="pl-10"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between text-sm">
                            <Link
                                href="/forgot-password"
                                className="text-primary hover:underline font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" className="mx-auto" />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                        href="/register"
                        className="text-primary hover:underline font-medium"
                    >
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
