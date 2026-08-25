"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger/client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Global error boundary caught error", { module: "error-boundary", error });
    }, [error]);

    return (
        <html>
            <body className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-4 space-y-6">
                <h2 className="text-3xl font-bold">Critical Error</h2>
                <p className="max-w-md text-center text-gray-600">
                    A critical system error occurred. Please try refreshing the page.
                </p>
                <Button onClick={() => reset()}>Try again</Button>
            </body>
        </html>
    );
}
