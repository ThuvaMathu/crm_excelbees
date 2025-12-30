"use client";

import { useState } from "react";
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
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth/auth-service";
import { createUserProfile } from "@/lib/firestore/users";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { analytics } from "@/lib/analytics";
import { User, Mail, Lock, Chrome } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        console.log("📝 Starting registration for:", data.email);
        setLoading(true);

        try {
            const { user, error: authError } = await signUpWithEmail(
                data.email,
                data.password,
                data.name
            );

            if (authError) {
                console.error("❌ Registration auth error:", authError);
                analytics.registerFailed(data.email, authError);
                toast.error(authError);
                setLoading(false);
                return;
            }

            if (!user) {
                console.error("❌ No user returned from registration");
                toast.error("Registration failed. Please try again.");
                setLoading(false);
                return;
            }

            console.log("✅ User registered in Firebase Auth:", user.uid);
            console.log("📝 Creating user profile in Firestore...");

            // Create user profile in Firestore
            const profileResult = await createUserProfile(user.uid, {
                email: user.email!,
                displayName: data.name,
                photoURL: user.photoURL || undefined,
            });

            if (!profileResult.success) {
                console.error("⚠️ Failed to create user profile:", profileResult.error);
                toast.error("Account created but profile setup failed. Please contact support.");
            } else {
                console.log("✅ User profile created successfully");
            }

            analytics.registerSuccess(user.uid, user.email!);
            toast.success("Account created successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("❌ Unexpected registration error:", error);
            toast.error("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);

        const { user, error: authError } = await signInWithGoogle();

        if (authError) {
            analytics.registerFailed("", authError);
            toast.error(authError);
            setLoading(false);
        } else if (user) {
            // Create user profile in Firestore if new user
            await createUserProfile(user.uid, {
                email: user.email!,
                displayName: user.displayName || "User",
                photoURL: user.photoURL || undefined,
            });

            analytics.registerSuccess(user.uid, user.email!);
            toast.success("Account created successfully!");
            router.push("/dashboard");
        }
    };

    return (
        <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-4 text-center pb-6">
                <div className="flex justify-center">
                    <Logo width={180} height={48} />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Get started with Excel Bees CRM</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="John Doe"
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

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
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

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" className="mx-auto" />
                            ) : (
                                "Create Account"
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
                    onClick={handleGoogleSignup}
                    disabled={loading}
                >
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primary hover:underline font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
