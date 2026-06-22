import { AuthProvider } from "@/components/auth/AuthProvider";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 p-4">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </AuthProvider>
    );
}
