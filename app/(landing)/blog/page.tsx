import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BlogPageContent } from "@/components/landing/BlogPageContent";

export const metadata: Metadata = {
  title: "CRM Blog for Australian Businesses — ExcelBees Insights",
  description:
    "Expert CRM strategies, AI automation tips, and business growth insights tailored to Australian SMBs. Practical advice for trades, retail, professional services, and more.",
  keywords: [
    "CRM tips Australia",
    "Australian business blog",
    "CRM strategies for SMB",
    "AI automation Australian business",
    "business growth tips Australia",
    "CRM for trades Australia",
    "Brisbane business insights",
    "RCRM blog",
    "ExcelBees blog",
    "customer relationship management tips",
  ],
  authors: [{ name: "ExcelBees", url: "https://excelbees.com.au" }],
  alternates: { canonical: "https://excelbees.com.au/blog" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://excelbees.com.au/blog",
    siteName: "RCRM by ExcelBees",
    title: "CRM Blog for Australian Businesses — ExcelBees Insights",
    description:
      "Practical CRM strategies, AI tips, and growth insights for Australian SMBs. No fluff — just what your team can use tomorrow.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ExcelBees Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM Blog for Australian Businesses — ExcelBees",
    description: "Practical CRM and AI tips for Australian SMBs.",
    images: ["/og-image.png"],
  },
};

const blogListSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://excelbees.com.au/blog",
  url: "https://excelbees.com.au/blog",
  name: "ExcelBees CRM Blog",
  description:
    "CRM strategies, AI automation tips, and business growth insights for Australian small and medium businesses.",
  inLanguage: "en-AU",
  publisher: {
    "@type": "Organization",
    "@id": "https://excelbees.com.au/#organization",
    name: "ExcelBees",
    url: "https://excelbees.com.au",
  },
  isPartOf: { "@type": "WebSite", url: "https://excelbees.com.au", name: "RCRM by ExcelBees" },
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <div className="min-h-screen bg-enterprise-midnight">
        <Navbar />
        <main id="main-content">
          <BlogPageContent />
        </main>
        <Footer />
      </div>
    </>
  );
}
