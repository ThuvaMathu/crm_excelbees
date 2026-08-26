"use client";

import { Linkedin, Twitter, Facebook, Instagram, ArrowRight, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Sign In", href: "/login" },
];

const featureLinks = [
  { label: "Contacts & Companies", href: "/#features" },
  { label: "Lead & Deal Pipeline", href: "/#features" },
  { label: "Projects & Tasks", href: "/#features" },
  { label: "Quotes & Invoices", href: "/#features" },
  { label: "Email Campaigns", href: "/#features" },
  { label: "Analytics & Reports", href: "/#features" },
  { label: "AI Assistant", href: "/#features" },
  { label: "Integrations", href: "/#features" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/company/excelbees/", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/excelbees", label: "Twitter / X" },
  { icon: Facebook, href: "https://www.facebook.com/Excelbees/", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/excel_bees", label: "Instagram" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-enterprise-border bg-enterprise-midnight"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" aria-label="RCRM by ExcelBees — home">
              <Logo width={140} height={32} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              RCRM is a product of{" "}
              <a
                href="https://excelbees.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-enterprise-amber hover:text-amber-400 transition-colors inline-flex items-center gap-0.5"
                aria-label="ExcelBees digital marketing agency"
              >
                ExcelBees
                <ExternalLink className="h-3 w-3 ml-0.5" aria-hidden="true" />
              </a>
              {" "}— a Brisbane digital marketing &amp; web design agency. It's our internal
              CRM, made available free to all ExcelBees clients.
            </p>

            {/* ABN */}
            <p className="mt-3 text-xs text-muted-foreground/50">
              ABN: 39 950 664 967 &middot; Redbank, QLD 4301, Australia
            </p>

            {/* Social */}
            <div className="mt-4 flex gap-2">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-enterprise-border text-muted-foreground transition-all hover:border-enterprise-amber/50 hover:text-enterprise-amber"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>

            {/* Contact */}
            <div className="mt-4 space-y-1">
              <a
                href="mailto:info@excelbees.com.au"
                className="block text-xs text-muted-foreground hover:text-enterprise-amber transition-colors"
              >
                info@excelbees.com.au
              </a>
              <a
                href="tel:+61431668645"
                className="block text-xs text-muted-foreground hover:text-enterprise-amber transition-colors"
              >
                +61 431 668 645
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Navigation
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://excelbees.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-enterprise-amber"
                >
                  ExcelBees Agency
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>

          {/* Features */}
          <nav aria-label="Features list">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Features
            </p>
            <ul className="space-y-2">
              {featureLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal + CTA */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <nav aria-label="Legal links">
              <ul className="mb-6 space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ExcelBees customer CTA */}
            <div className="rounded-xl border border-enterprise-amber/20 bg-enterprise-amber/5 p-4">
              <p className="text-xs font-semibold text-enterprise-amber mb-1">
                🐝 ExcelBees Client?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                RCRM is always free for all ExcelBees customers.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs font-semibold text-enterprise-amber hover:text-amber-400 transition-colors"
              >
                Claim your free access
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-enterprise-border py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ExcelBees Australia. All rights reserved.
            <span className="ml-2 text-muted-foreground/40">ABN 39 950 664 967</span>
          </p>
          <p className="text-xs text-muted-foreground/50">
            Proudly built in Redbank, Queensland, Australia &middot;{" "}
            <a
              href="https://excelbees.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-enterprise-amber transition-colors"
            >
              excelbees.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
