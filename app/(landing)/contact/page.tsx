import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ContactPageContent } from "@/components/landing/ContactPageContent";

export const metadata: Metadata = {
  title: "Contact ExcelBees — Book a Free RCRM Demo",
  description:
    "Get in touch with the ExcelBees team to book a free, personalised RCRM demo. We'll show you exactly how our CRM fits your Australian business — no generic slides, no sales pressure.",
  keywords: [
    "contact ExcelBees",
    "book CRM demo Australia",
    "RCRM demo request",
    "CRM consultation Brisbane",
    "custom CRM quote Australia",
    "get in touch ExcelBees",
    "CRM demo for Australian business",
  ],
  authors: [{ name: "ExcelBees", url: "https://excelbees.com.au" }],
  alternates: { canonical: "https://excelbees.com.au/contact" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://excelbees.com.au/contact",
    siteName: "RCRM by ExcelBees",
    title: "Contact ExcelBees — Book a Free RCRM Demo",
    description:
      "Book a personalised RCRM demo. We'll show you how the platform fits your workflow — no pressure, no generic slides.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact ExcelBees" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ExcelBees — Book a Free RCRM Demo",
    description: "Book a free, personalised CRM demo for your Australian business.",
    images: ["/og-image.png"],
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": "https://excelbees.com.au/contact",
  url: "https://excelbees.com.au/contact",
  name: "Contact ExcelBees",
  description:
    "Contact the ExcelBees team to book a free RCRM demo or ask questions about our CRM solutions for Australian businesses.",
  inLanguage: "en-AU",
  isPartOf: { "@type": "WebSite", url: "https://excelbees.com.au", name: "RCRM by ExcelBees" },
  mainEntity: {
    "@type": "Organization",
    "@id": "https://excelbees.com.au/#organization",
    name: "ExcelBees",
    email: "excelbees2024@gmail.com",
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
      availableLanguage: "en-AU",
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <div className="min-h-screen bg-enterprise-midnight">
        <Navbar />
        <main id="main-content">
          <ContactPageContent />
        </main>
        <Footer />
      </div>
    </>
  );
}
