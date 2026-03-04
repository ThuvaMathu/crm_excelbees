import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.seo.keywords,
    icons: {
        icon: "/favicon.ico",
        apple: "/logo.png",
    },
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://excelbees.com"),
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "/",
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.seo.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: siteConfig.seo.twitterCard,
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.seo.ogImage],
    },
    verification: {
        // Add your verification codes here when available
        // google: "verification_code",
        // yandex: "verification_code",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* JSON-LD Structured Data for Organization */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: siteConfig.name,
                            description: siteConfig.description,
                            url: process.env.NEXT_PUBLIC_APP_URL || "https://excelbees.com",
                            contactPoint: {
                                "@type": "ContactPoint",
                                email: siteConfig.contact.email,
                                telephone: siteConfig.contact.phone,
                                contactType: "sales",
                                availableLanguage: "English",
                            },
                            sameAs: [
                                siteConfig.social.twitter,
                                siteConfig.social.linkedin,
                            ].filter(Boolean),
                        }),
                    }}
                />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <AuthGate>
                            {children}
                        </AuthGate>
                    </AuthProvider>
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
