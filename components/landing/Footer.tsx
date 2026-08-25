"use client";

import { Linkedin, Twitter, Facebook, ArrowRight } from "lucide-react";
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
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter / X" },
  { icon: Facebook, href: "#", label: "Facebook" },
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
              Custom CRM solutions built for Australian businesses that want more
              control, less complexity, and transparent pricing.
            </p>
            {/* Social */}
            <div className="mt-5 flex gap-2">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-enterprise-border text-muted-foreground transition-all hover:border-enterprise-amber/50 hover:text-enterprise-amber"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
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

            {/* Mini CTA */}
            <div className="rounded-xl border border-enterprise-amber/20 bg-enterprise-amber/5 p-4">
              <p className="text-xs font-semibold text-white mb-2">Ready to start?</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs font-semibold text-enterprise-amber hover:text-amber-400 transition-colors"
              >
                Book a free demo
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-enterprise-border py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ExcelBees. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Proudly built in Brisbane, Australia
          </p>
        </div>
      </div>
    </footer>
  );
}
