import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingAnalytics } from "@/components/landing/LandingAnalytics";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-background overflow-x-hidden">
            <LandingNavbar />
            <LandingHero />
            <LandingFeatures />
            <LandingAnalytics />
            <LandingCTA />
            <LandingFooter />
        </main>
    );
}
