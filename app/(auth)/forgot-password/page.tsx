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
import { sendPasswordReset } from "@/lib/auth/auth-service";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setLoading(true);

        const { error } = await sendPasswordReset(data.email);

        setLoading(false);

        if (error) {
            toast.error(error);
        } else {
            setEmailSent(true);
            toast.success("Password reset email sent!");
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-secondary dark:via-secondary/90 dark:to-secondary p-4">
            <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                        <CardDescription className="mt-2">
                            We've sent a password reset link to{" "}
                            <span className="font-medium text-foreground">
                                {form.getValues("email")}
                            </span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p className="font-medium">Next steps:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Check your email inbox</li>
                            <li>Click the password reset link</li>
                            <li>Create a new password</li>
                            <li>Sign in with your new password</li>
                        </ol>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Didn't receive the email? Check your spam folder or{" "}
                        <button
                            onClick={() => setEmailSent(false)}
                            className="text-primary hover:underline font-medium"
                        >
                            try again
                        </button>
                    </p>
                </CardContent>

                <CardFooter className="flex justify-center border-t pt-6">
                    <Link href="/login">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
            </div></div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-secondary dark:via-secondary/90 dark:to-secondary p-4">
        <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-4 text-center pb-6">
                <div className="flex justify-center">
                    <Logo width={180} height={48} />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a reset link
                    </CardDescription>
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

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" className="mx-auto" />
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-6">
                <Link href="/login">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign In
                    </Button>
                </Link>
            </CardFooter>
        </Card>
        </div></div>
    );
}
