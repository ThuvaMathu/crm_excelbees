import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";

const TestimonialsSection = dynamic(
  () => import("@/components/landing/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: true }
);
const AboutSection = dynamic(
  () => import("@/components/landing/AboutSection").then((m) => ({ default: m.AboutSection })),
  { ssr: true }
);
const BlogSection = dynamic(
  () => import("@/components/landing/BlogSection").then((m) => ({ default: m.BlogSection })),
  { ssr: true }
);
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "RCRM by ExcelBees — Complete CRM Platform for Australian Businesses",
  description:
    "Contacts, deals, projects, quotes, invoices, email campaigns & analytics — all in one platform. Affordable, modular CRM built for Australian SMBs. Role-based access, integrated AI, and transparent AUD pricing. Save up to 60% vs Salesforce.",
  keywords: [
    "CRM software Australia",
    "custom CRM Brisbane",
    "affordable CRM for small business",
    "AI CRM Australia",
    "CRM for trades business",
    "CRM with project management",
    "CRM with quoting",
    "CRM with invoicing Australia",
    "email campaign CRM Australia",
    "CRM analytics Australia",
    "RCRM ExcelBees",
    "role-based CRM",
    "modular CRM",
    "Brisbane CRM software",
  ],
  authors: [{ name: "ExcelBees", url: "https://excelbees.com.au" }],
  creator: "ExcelBees",
  publisher: "ExcelBees",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://excelbees.com.au",
    siteName: "RCRM by ExcelBees",
    title: "RCRM — Complete CRM Platform for Australian Businesses",
    description:
      "Contacts, deals, projects, quotes, invoices, email campaigns & analytics in one modular platform. Built for Australian SMBs. Integrated AI, role-based access, transparent AUD pricing.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RCRM by ExcelBees — Complete CRM Platform for Australian Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RCRM — Complete CRM Platform for Australian Businesses",
    description:
      "Contacts, projects, quotes, invoices & AI — one modular platform for Australian SMBs. Save up to 60% vs Salesforce.",
    images: ["/og-image.png"],
    creator: "@excelbees",
  },
  alternates: {
    canonical: "https://excelbees.com.au",
  },
};

export default function Home() {
  return (
    <>
      {/* JSON-LD structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://excelbees.com.au/#organization",
                name: "ExcelBees",
                url: "https://excelbees.com.au",
                logo: {
                  "@type": "ImageObject",
                  url: "https://excelbees.com.au/logo.png",
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Brisbane",
                  addressRegion: "QLD",
                  addressCountry: "AU",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "sales",
                  email: "excelbees2024@gmail.com",
                },
                sameAs: [],
              },
              {
                "@type": "SoftwareApplication",
                "@id": "https://excelbees.com.au/#product",
                name: "RCRM",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: {
                  "@type": "Offer",
                  priceCurrency: "AUD",
                  availability: "https://schema.org/InStock",
                },
                description:
                  "Affordable, modular CRM with integrated AI assistant, role-based access control, contact & company management, project & task tracking, quote & invoice management, email campaign tools, and analytics dashboards. Built for Australian SMBs.",
                publisher: {
                  "@id": "https://excelbees.com.au/#organization",
                },
                featureList: [
                  "Role-Based Access Control (Admin / Manager / Team / Scanner)",
                  "AI-Powered Data Entry & Automation",
                  "Contact & Company Management",
                  "Lead & Deal Pipeline (Kanban)",
                  "Project & Task Management",
                  "Notes & Activity Log",
                  "Quote Builder (AUD, GST-inclusive)",
                  "Invoice & Billing Management",
                  "Email Campaign Tracking",
                  "Analytics Dashboards & Reports",
                  "SMTP & Calendar Integrations",
                  "Modular Feature Selection",
                  "Australian Privacy Act Compliant",
                  "Transparent AUD Pricing",
                ],
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "5",
                  reviewCount: "3",
                  bestRating: "5",
                  worstRating: "1",
                },
              },
              {
                "@type": "WebPage",
                "@id": "https://excelbees.com.au/",
                url: "https://excelbees.com.au/",
                name: "RCRM by ExcelBees — Custom CRM for Australian Businesses",
                isPartOf: {
                  "@type": "WebSite",
                  url: "https://excelbees.com.au",
                  name: "ExcelBees",
                },
                about: { "@id": "https://excelbees.com.au/#product" },
                description:
                  "Affordable, modular CRM with integrated AI. Save up to 60% vs Salesforce. Built for Australian SMBs.",
                inLanguage: "en-AU",
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How much does RCRM cost?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "RCRM uses modular, transparent AUD pricing. You pay only for the features you activate. Pricing is significantly lower than enterprise CRMs like Salesforce — businesses typically save 40–60% monthly.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How long does it take to set up RCRM?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Most businesses are fully operational within a single business day. No consultant required — our onboarding guides your team step by step.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does RCRM have AI features?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. RCRM includes an integrated AI assistant that auto-fills contact data, enriches leads, drafts follow-up emails, and generates insights — saving teams an average of 2+ hours per day.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does RCRM manage projects and tasks?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. RCRM includes a full Projects & Tasks module — create projects linked to deals, assign tasks to team members, track milestones, and attach notes. Everything connected to the right client record.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Can I send quotes and invoices from RCRM?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. RCRM has native Quote and Invoice modules with AUD pricing and GST support. Create a quote, send it as a branded PDF, and convert it to an invoice in one click.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is RCRM suitable for small Australian businesses?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Absolutely. RCRM was built specifically for Australian SMBs in trades, retail, professional services, and technology — businesses that need a powerful, complete CRM without enterprise complexity or pricing.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-enterprise-midnight">
        <Navbar />
        <main id="main-content">
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
          <AboutSection />
          <BlogSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
