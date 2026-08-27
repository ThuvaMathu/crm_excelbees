"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firestore/users";
import { signInWithGoogle } from "@/lib/auth/auth-service";
import { checkAuthAvailability } from "@/app/actions/check-auth-availability";
import { isMaintenanceClient } from "@/lib/env";
import { Mail, Lock, Eye, EyeOff, User, ChevronLeft, Zap, Users2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z.object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
type SignupFormData = z.infer<typeof signupSchema>;

const HIGHLIGHTS = [
    { icon: Zap, label: "Up and running in minutes", sub: "No setup fees. No IT required." },
    { icon: Users2, label: "Built for teams of all sizes", sub: "From solo founders to 500+ reps." },
    { icon: BarChart3, label: "AI-powered pipeline clarity", sub: "Spot risks before they cost you." },
];

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
    });

    const onSubmit = async (data: SignupFormData) => {
        setLoading(true);
        const { allowed } = await checkAuthAvailability();
        if (!allowed) {
            toast.error("Sign-up is temporarily unavailable while we perform maintenance.");
            setLoading(false);
            return;
        }
        try {
            const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(credential.user, { displayName: data.displayName });
            await createUserProfile(credential.user.uid, {
                email: data.email,
                displayName: data.displayName,
                role: "admin",
                provider: "password",
                isFirstLogin: false, // self-signup — user chose their own password
            });
            toast.success("Account created! Let's set up your workspace.");
            router.push("/onboarding");
        } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
                toast.error("An account with this email already exists.");
            } else {
                toast.error("Failed to create account. Please try again.");
            }
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        const { allowed } = await checkAuthAvailability();
        if (!allowed) {
            toast.error("Sign-up is temporarily unavailable while we perform maintenance.");
            setGoogleLoading(false);
            return;
        }
        const { user, isNewUser, error } = await signInWithGoogle();
        if (error) { toast.error("Google sign-up failed. Please try again."); setGoogleLoading(false); return; }
        if (!user) { setGoogleLoading(false); return; }

        await createUserProfile(user.uid, {
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "",
            photoURL: user.photoURL || "",
            role: "admin",
            provider: "google.com",
            isFirstLogin: false,
        });

        if (isNewUser) {
            toast.success("Account created! Let's set up your workspace.");
            router.push("/onboarding");
        } else {
            toast.success("Welcome back!");
            router.push("/org");
        }
        setGoogleLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left: Form Panel ── */}
            <div className="w-full lg:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 bg-white dark:bg-[hsl(215,25%,9%)] overflow-y-auto">
                {/* Back link */}
                <div className="mb-8">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        Back to Login
                    </Link>
                </div>

                {/* Logo */}
                <div className="mb-8">
                    <Logo width={160} height={42} />
                </div>

                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
                    <p className="mt-1.5 text-muted-foreground">Sign up and get 30 days free</p>
                </div>

                {isMaintenanceClient ? (
                    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        Sign-up is temporarily unavailable while we perform maintenance. Please check back shortly.
                    </div>
                ) : (
                    <>
                        {/* Google Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 gap-3 font-medium border-border hover:bg-muted/50 mb-6"
                            onClick={handleGoogle}
                            disabled={googleLoading || loading}
                        >
                            {googleLoading ? <LoadingSpinner size="sm" /> : <GoogleIcon />}
                            Continue with Google
                        </Button>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white dark:bg-[hsl(215,25%,9%)] px-3 text-muted-foreground">
                                    or sign up with email
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="John Smith" className="pl-10 h-11" disabled={loading} {...field} />
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
                                                    <Input type="email" placeholder="you@company.com" className="pl-10 h-11" disabled={loading} {...field} />
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
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Min. 8 characters"
                                                        className="pl-10 pr-10 h-11"
                                                        disabled={loading}
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
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
                                            <FormLabel>Confirm password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" placeholder="Repeat your password" className="pl-10 h-11" disabled={loading} {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
                                    disabled={loading || googleLoading}
                                >
                                    {loading ? <LoadingSpinner size="sm" className="mx-auto" /> : "Create Account"}
                                </Button>
                            </form>
                        </Form>
                    </>
                )}

                <p className="mt-4 text-center text-xs text-muted-foreground">
                    By creating an account you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                    {" & "}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>

            {/* ── Right: Image Panel ── */}
            <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
                <Image
                    src="/images/auth-signup-illustration.jpg"
                    alt="CRM sales funnel and growth metrics illustration"
                    fill
                    className="object-cover object-top"
                    priority
                />
                {/* Gradient overlay — stronger for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(215,25%,5%)] via-[hsl(215,25%,9%)]/50 to-[hsl(215,25%,9%)]/10" />

                {/* Top badge */}
                <div className="absolute top-10 left-10 z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        30-day free trial · No credit card required
                    </div>
                </div>

                {/* Bottom content */}
                <div className="relative z-10 flex flex-col justify-end p-12 pb-16 w-full">
                    <div className="max-w-md">
                        <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                            Start closing deals faster<br />
                            <span className="text-primary">from day one</span>
                        </h2>
                        <p className="text-white/70 text-sm mb-8">
                            Join hundreds of growing businesses using Excelbees CRM to manage their pipeline and grow revenue.
                        </p>
                        <div className="space-y-4">
                            {HIGHLIGHTS.map(({ icon: Icon, label, sub }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{label}</p>
                                        <p className="text-xs text-white/60">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}
