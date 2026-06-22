import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AboutPageContent } from "@/components/landing/AboutPageContent";

export const metadata: Metadata = {
  title: "About ExcelBees — The Brisbane Team Behind RCRM",
  description:
    "Meet the ExcelBees team. We're a Brisbane-based software studio that built RCRM after getting frustrated with expensive, bloated CRM solutions. Learn our story, our values, and why we're committed to Australian SMBs.",
  keywords: [
    "ExcelBees Brisbane",
    "about RCRM",
    "CRM software company Australia",
    "Brisbane software development team",
    "Australian CRM developers",
    "ExcelBees team",
    "RCRM about us",
    "custom CRM Brisbane Queensland",
  ],
  authors: [{ name: "ExcelBees", url: "https://excelbees.com.au" }],
  alternates: { canonical: "https://excelbees.com.au/about" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://excelbees.com.au/about",
    siteName: "RCRM by ExcelBees",
    title: "About ExcelBees — The Brisbane Team Behind RCRM",
    description:
      "A Brisbane-based software studio frustrated with expensive CRMs. So we built one that actually works for Australian SMBs.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ExcelBees Team" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About ExcelBees — The Brisbane Team Behind RCRM",
    description: "Meet the team that built a CRM for Australian businesses, not for enterprise consultants.",
    images: ["/og-image.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://excelbees.com.au/about",
  url: "https://excelbees.com.au/about",
  name: "About ExcelBees",
  description:
    "ExcelBees is a Brisbane-based software development studio specialising in custom CRM solutions for Australian small and medium businesses.",
  inLanguage: "en-AU",
  isPartOf: { "@type": "WebSite", url: "https://excelbees.com.au", name: "RCRM by ExcelBees" },
  about: {
    "@type": "Organization",
    "@id": "https://excelbees.com.au/#organization",
    name: "ExcelBees",
    url: "https://excelbees.com.au",
    foundingDate: "2023",
    foundingLocation: {
      "@type": "Place",
      name: "Brisbane, Queensland, Australia",
    },
    numberOfEmployees: { "@type": "QuantitativeValue", value: 4 },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Brisbane",
      addressRegion: "QLD",
      addressCountry: "AU",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "excelbees2024@gmail.com",
    },
    description:
      "ExcelBees builds affordable, modular CRM solutions for Australian businesses. Our flagship product RCRM helps SMBs manage leads, deals, contacts, and invoices without enterprise complexity or pricing.",
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="min-h-screen bg-enterprise-midnight">
        <Navbar />
        <main id="main-content">
          <AboutPageContent />
        </main>
        <Footer />
      </div>
    </>
  );
}
