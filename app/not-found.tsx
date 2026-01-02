import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-6 p-4 text-center">
            <div className="bg-muted p-6 rounded-full">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
            <p className="text-muted-foreground max-w-md text-lg">
                The page you are looking for does not exist or has been moved.
            </p>
            <div className="flex gap-4">
                <Link href="/dashboard">
                    <Button size="lg">Go to Dashboard</Button>
                </Link>
                <Link href="/">
                    <Button variant="outline" size="lg">
                        Go Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
