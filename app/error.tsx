"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger/client";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Error boundary caught error", { module: "error-boundary", error });
    }, [error]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-6 p-4 text-center">
            <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Something went wrong!</h1>
            <p className="text-muted-foreground max-w-md">
                We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} size="lg">
                    Try Again
                </Button>
            </div>
        </div>
    );
}
