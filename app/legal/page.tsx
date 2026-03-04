import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
    title: `Legal - ${siteConfig.name}`,
    description: "Privacy Policy and Terms of Service",
};

export default function LegalPage() {
    return (
        <main className="min-h-screen bg-enterprise-midnight overflow-x-hidden flex flex-col relative">
            {/* Enterprise Technical Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-enterprise-midnight via-enterprise-slate to-enterprise-midnight" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* We must wrap LandingNavbar with a higher z-index (z-50) so it overlays correctly over the z-10 content below */}
            <div className="relative z-[100]">
                <LandingNavbar />
            </div>

            <div className="relative z-10 flex-grow text-slate-300 pt-28 md:pt-36 pb-24">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Legal Documentation</h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Comprehensive information regarding our privacy practices and terms of use for the {siteConfig.name} website.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12">
                        {/* Mobile Collapsible TOC */}
                        <div className="md:hidden block w-full shrink-0">
                            <details className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-lg">
                                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold tracking-widest text-slate-400 uppercase">
                                    Table of Contents
                                    <span className="transition-transform duration-300 group-open:-rotate-180">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </span>
                                </summary>
                                <nav className="flex flex-col gap-4 mt-5 pt-4 border-t border-slate-800/50">
                                    <a href="#privacy-policy" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors flex items-center gap-2 group/link">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover/link:bg-primary transition-colors" />
                                        Privacy Policy
                                    </a>
                                    <a href="#terms-of-service" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors flex items-center gap-2 group/link">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover/link:bg-primary transition-colors" />
                                        Terms of Service
                                    </a>
                                </nav>
                            </details>
                        </div>

                        {/* Desktop Sidebar / Table of Contents */}
                        <aside className="hidden md:block w-64 shrink-0">
                            <div className="sticky top-32 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                                <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-5">Table of Contents</h3>
                                <nav className="flex flex-col gap-4">
                                    <a href="#privacy-policy" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors flex items-center gap-2 group">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-colors" />
                                        Privacy Policy
                                    </a>
                                    <a href="#terms-of-service" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors flex items-center gap-2 group">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-colors" />
                                        Terms of Service
                                    </a>
                                </nav>
                            </div>
                        </aside>

                        {/* Legal Content Scope */}
                        <div className="flex-grow max-w-3xl leading-relaxed 
                                        [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-8 [&_h2]:pb-4 [&_h2]:border-b [&_h2]:border-slate-800 
                                        [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-4 [&_h3]:mt-10 
                                        [&_p]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_li]:mb-2 [&_li]:text-slate-300 [&_strong]:text-slate-200">

                            {/* Privacy Policy */}
                            <section id="privacy-policy" className="mb-24 scroll-mt-32">
                                <h2>Privacy Policy</h2>
                                <p className="text-sm text-slate-400 mb-8 border-l-2 border-primary pl-4 py-1 bg-slate-900/40 rounded-r-md block">
                                    Effective Date: {new Date().toLocaleDateString()}
                                </p>

                                <h3>1. Introduction</h3>
                                <p>Welcome to {siteConfig.name}. We respect your privacy and are committed to protecting your personal data globally. This Privacy Policy explains how we collect, use, disclose, and safeguard your information exclusively when you visit our public marketing website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</p>

                                <h3>2. Data Collection Methods</h3>
                                <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                                <ul>
                                    <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, corporate email address, and telephone number, that you voluntarily give to us when you fill out contact forms or express interest in our enterprise services.</li>
                                    <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, and the web pages you have viewed directly before and after accessing the Site directly utilized for analytics cookies.</li>
                                </ul>

                                <h3>3. Usage of Data</h3>
                                <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized web experience. Specifically, we may use information collected about you via the Site to:</p>
                                <ul>
                                    <li>Compile aggregate statistical data and analysis to improve our website architecture and visitor engagement.</li>
                                    <li>Deliver informational communications regarding our enterprise offerings and respond to inquiries from potential partners or clients.</li>
                                    <li>Fulfill administrative requests, such as sending proposals or setting up consultation meetings.</li>
                                    <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                                </ul>

                                <h3>4. Third-Party Sharing</h3>
                                <p>We maintain strict data sovereignty principles and only share website visitor information in the following highly restricted scenarios:</p>
                                <ul>
                                    <li><strong>Compliance with Legal Obligations:</strong> If we believe that the release of information about you is legally required to respond to valid subpoenas, court orders, or similar domestic and international legal processes.</li>
                                    <li><strong>Essential Service Providers:</strong> We may share necessary, anonymized, or strictly secured data with trusted operational vendors (such as our corporate email relay providers or enterprise analytics hosts), heavily bound by standard contractual clauses ensuring your data is not monetized.</li>
                                </ul>

                                <h3>5. User Rights (GDPR, CCPA & Global Equivalents)</h3>
                                <p>We support recognized international privacy protections (including GDPR in the EU/UK, CCPA in California, and similar frameworks). You maintain the right to: request access to the personal data we collected, request a rectification to inaccurate data, or request the erasure of your data. To exercise these rights independently, kindly direct your formal inquiries to {siteConfig.contact.supportEmail}.</p>

                                <h3>6. Security Measures</h3>
                                <p>We deploy robust administrative, technical, and physical security measures to help safeguard your personal information against unauthorized access, theft, or misuse. However, please recognize that no digital transmission protocol across public networks is entirely invulnerable, and transmission of information through our website remains at your own risk.</p>
                            </section>

                            {/* Terms of Service */}
                            <section id="terms-of-service" className="scroll-mt-32">
                                <h2>Terms of Service</h2>
                                <p className="text-sm text-slate-400 mb-8 border-l-2 border-primary pl-4 py-1 bg-slate-900/40 rounded-r-md block">
                                    Effective Date: {new Date().toLocaleDateString()}
                                </p>

                                <h3>1. Acceptance of Terms</h3>
                                <p>These Website Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an enterprise entity ("you") and {siteConfig.name} ("we", "us", or "our"), governing strictly your access to and use of this public informational website. These terms absolutely do not govern or license our deployable enterprise software, which requires an independent Software License Agreement (SLA).</p>

                                <h3>2. Intellectual Property Rights</h3>
                                <p>The overarching structure, content, and thematic assets of the Site are protected intellectual properties. All source code, databases, interface designs, audio, video, text, photographs, and logos contained strictly on this public website (the "Content") are owned, controlled, or licensed to us. These materials are protected under comprehensive international copyright treaties and trademark laws prohibiting unauthorized reproduction or scraping.</p>

                                <h3>3. User Representations</h3>
                                <p>By navigating and utilizing the Site, you represent and warrant that: (1) any preliminary contact information you submit will be factually correct and current; (2) you possess the legal capacity to comply with these foundational Terms of Service; and (3) you are not accessing the Site via automated or non-human means (e.g., destructive bots or unauthorized scrapers).</p>

                                <h3>4. Limitation of Liability</h3>
                                <p>In no judicial forum or geographic jurisdiction will we or our corporate directors, employees, or authorized agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, or prevailing punitive damages arising from your preliminary use of—or inability to use—this informational website. This includes alleged damages such as lost operational profit, disrupted revenue streams, or speculative losses.</p>

                                <h3>5. Prohibited Activities</h3>
                                <p>You may not access or use the Site for any commercial endeavors except those we have explicitly endorsed through formal partnership. Banned website interactions include, but are not limited to: systematic retrieval of data to assemble competitor databases, unauthorized circumvention of security features, reverse-engineering the site's codebase, or overburdening our hosting infrastructure maliciously.</p>

                                <h3>6. Governing Law</h3>
                                <p>These general Website Terms shall be governed by broadly recognized standards of international corporate law. Both {siteConfig.name} and the navigating user conditionally consent that formally recognized jurisdictions relevant to our enterprise registration shall maintain the exclusive authority to arbitrate any irreconcilable dispute stemming specifically from these stated rules of general website use.</p>

                                <h3>7. Disclaimer of Warranties</h3>
                                <p>The public website is provided strictly on an "as-is" and "as-available" foundation for informational exploration. To the exhaustive absolute extent permitted by contemporary law, we completely disclaim all warranties, express or implied—including the implied fitness for a particular commercial strategy, uninterrupted hosting availability, and absolute protection against pervasive third-party malicious code.</p>

                                <h3>8. Termination of Access</h3>
                                <p>We securely and unconditionally reserve the right to restrict, block, or permanently terminate your IP address's access to the Site at our sole operational discretion, without prior alert, if we detect clear violations of these Terms of Service or a threat to our broader infrastructural security.</p>

                                <h3>9. Contact Information</h3>
                                <p>To address complex interpretations of these terms, or to file a formal request concerning overarching policy clarifications, you can reach our administrative desk via:</p>
                                <p className="font-semibold text-white mt-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded inline-block">
                                    {siteConfig.contact.supportEmail}
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-[100]">
                <LandingFooter />
            </div>
        </main>
    );
}
