import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    metadataBase: new URL("https://excelbees.com.au"),
    title: {
        default: "RCRM by ExcelBees — Custom CRM for Australian Businesses",
        template: "%s | RCRM by ExcelBees",
    },
    description:
        "Affordable, modular CRM built for Australian SMBs. Role-based access, integrated AI assistant, invoice management, and transparent pricing.",
    icons: {
        icon: "/favicon.ico",
        apple: "/logo.png",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#0A1628" },
        { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en-AU" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
