import { AuthProvider } from "@/components/auth/AuthProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen">
                {children}
            </div>
        </AuthProvider>
    );
}
