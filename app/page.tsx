import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingAnalytics } from "@/components/landing/LandingAnalytics";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
    title: "Self-Hosted AI CRM - Your Data, Your Server, Your Domain",
    description: siteConfig.description,
    keywords: siteConfig.seo.keywords,
    openGraph: {
        title: `${siteConfig.name} - Self-Hosted AI CRM`,
        description: siteConfig.description,
        url: "/",
    },
    twitter: {
        title: `${siteConfig.name} - Self-Hosted AI CRM`,
        description: siteConfig.description,
    },
};

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-background overflow-x-hidden">
            <LandingNavbar />
            <LandingHero />
            <LandingFeatures />
            <LandingAnalytics />
            <LandingCTA />
            <LandingAbout />
            <LandingContact />
            <LandingFooter />
        </main>
    );
}
