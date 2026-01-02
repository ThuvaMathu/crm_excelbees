import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardLoading() {
    return (
        <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
