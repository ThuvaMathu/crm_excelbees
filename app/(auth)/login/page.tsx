"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/auth-service";
import { checkLoginRateLimit } from "@/app/actions/login-rate-limit";
import { createUserProfile } from "@/lib/firestore/users";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
    "Unified lead & deal pipeline",
    "Real-time team collaboration",
    "AI-powered sales insights",
    "Automated invoices & quotes",
];

export default function LoginPage() {
    const router = useRouter();
    const { user, hydrated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    // Redirect already-authenticated users away from the login page.
    // AuthGate (on /org) is the single source of truth for the onboarding check.
    useEffect(() => {
        if (!hydrated || !user) return;
        router.replace("/org");
    }, [user, hydrated, router]);

    // Avoid flashing the login form for a moment before the redirect above
    // fires: show a spinner until auth state has hydrated, and keep
    // showing it if a redirect is about to happen (user already logged in).
    if (!hydrated || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[hsl(215,25%,9%)]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const getErrorMessage = (error: string) => {
        if (error.includes("user-not-found") || error.includes("wrong-password") || error.includes("invalid-credential"))
            return "Invalid email or password. Please try again.";
        if (error.includes("too-many-requests")) return "Too many attempts. Try again later.";
        if (error.includes("network-request-failed")) return "Network error. Check your connection.";
        if (error.includes("invalid-email")) return "Please enter a valid email address.";
        return "Login failed. Please try again.";
    };

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        const { allowed, resetIn } = await checkLoginRateLimit(data.email);
        if (!allowed) {
            const minutes = Math.max(1, Math.ceil(resetIn / 60));
            toast.error(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
            setLoading(false);
            return;
        }
        const { user: authUser, error } = await signInWithEmail(data.email, data.password);
        if (error) {
            analytics.loginFailed(data.email, error, "email");
            toast.error(getErrorMessage(error));
            setLoading(false);
            return;
        }
        if (!authUser) { toast.error("Login failed. Please try again."); setLoading(false); return; }
        analytics.loginSuccess(authUser.uid, authUser.email!, "email");
        toast.success("Welcome back!");
        router.push("/org");
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        const { user: authUser, isNewUser, error } = await signInWithGoogle();
        if (error) { toast.error("Google sign-in failed. Please try again."); setGoogleLoading(false); return; }
        if (!authUser) { setGoogleLoading(false); return; }

        if (isNewUser) {
            await createUserProfile(authUser.uid, {
                email: authUser.email || "",
                displayName: authUser.displayName || authUser.email?.split("@")[0] || "",
                photoURL: authUser.photoURL || "",
                role: "admin",
                provider: "google.com",
                isFirstLogin: false,
            });
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
            <div className="w-full lg:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 bg-white dark:bg-[hsl(215,25%,9%)]">
                {/* Back link */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        Back to Home
                    </Link>
                </div>

                {/* Logo */}
                <div className="mb-8">
                    <Logo width={160} height={42} />
                </div>

                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
                    <p className="mt-1.5 text-muted-foreground">Sign in to your CRM account</p>
                </div>

                {/* Google Button */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 gap-3 font-medium border-border hover:bg-muted/50 mb-6"
                    onClick={handleGoogle}
                    disabled={googleLoading || loading}
                >
                    {googleLoading ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white dark:bg-[hsl(215,25%,9%)] px-3 text-muted-foreground">
                            or sign in with email
                        </span>
                    </div>
                </div>

                {/* Email / Password Form */}
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
                                                className="pl-10 h-11"
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 pr-10 h-11"
                                                disabled={loading}
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
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
                            {loading ? <LoadingSpinner size="sm" className="mx-auto" /> : "Sign In"}
                        </Button>
                    </form>
                </Form>

                {/* Sign up link */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline font-semibold">
                        Create account
                    </Link>
                </p>
            </div>

            {/* ── Right: Image Panel ── */}
            <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
                <Image
                    src="/images/auth-login-illustration.jpg"
                    alt="CRM pipeline and team collaboration illustration"
                    fill
                    className="object-cover object-top"
                    priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(215,25%,6%)] via-[hsl(215,25%,9%)]/40 to-transparent" />
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-end p-12 pb-16 w-full">
                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            Trusted by 500+ businesses
                        </div>
                        <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                            Your entire sales pipeline,<br />
                            <span className="text-primary">in one place</span>
                        </h2>
                        <p className="text-white/70 text-sm mb-6">
                            Excelbees CRM brings your leads, deals, and team together — with AI insights built right in.
                        </p>
                        <ul className="space-y-2.5">
                            {FEATURES.map((f) => (
                                <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
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
