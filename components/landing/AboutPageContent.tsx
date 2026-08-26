"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { team } from "@/lib/constants/team";
import { TeamCard } from "./TeamCard";
import Link from "next/link";
import {
  ArrowRight,
  Target,
  Heart,
  Lightbulb,
  Shield,
  Users,
  TrendingUp,
  MapPin,
  CheckCircle,
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Purposeful Simplicity",
    description:
      "We believe software should do exactly what you need and nothing more. Every feature in RCRM was added because a real Australian business asked for it.",
  },
  {
    icon: Heart,
    title: "Local Commitment",
    description:
      "We're Brisbane-based and built for the Australian market — EOFY calendars, GST workflows, Australian phone formats, and AUD pricing. No conversions, no workarounds.",
  },
  {
    icon: Lightbulb,
    title: "AI That Works for You",
    description:
      "AI should save you time, not create new problems. RCRM's AI assistant automates the tasks your team hates so they can focus on the work that actually matters.",
  },
  {
    icon: Shield,
    title: "Transparent Pricing",
    description:
      "No hidden fees, no per-module add-on traps. You see exactly what you're paying for, and you only pay for what you activate. Cancel any time, no lock-in.",
  },
];

const milestones = [
  {
    year: "2022",
    title: "The Frustration",
    description:
      "ExcelBees was running its own sales pipeline through every major CRM. We kept hitting the same walls: too expensive, too complicated, too slow to customise.",
  },
  {
    year: "2023",
    title: "The Build Begins",
    description:
      "We started building RCRM for our own use — a lean, modular CRM that did exactly what we needed without the enterprise tax. Within months, clients started asking about it.",
  },
  {
    year: "2024",
    title: "Launched to Australian SMBs",
    description:
      "RCRM launched publicly to Australian small and medium businesses. The reception confirmed what we suspected: there's a massive gap between Salesforce-scale and spreadsheets.",
  },
  {
    year: "2025",
    title: "AI Integration & Growth",
    description:
      "We integrated a purpose-built AI assistant that saves teams 2+ hours daily. RCRM expanded to serve businesses across Queensland and Australia managing thousands of relationships.",
  },
  {
    year: "2026",
    title: "The Complete Platform",
    description:
      "Projects, Tasks, Quotes, Email Campaigns, and Analytics ship. RCRM is now a full end-to-end business platform — from first contact to closed invoice, everything in one place.",
  },
];

const stats = [
  { value: "Redbank QLD", label: "Proudly built here", icon: MapPin },
  { value: "60%+", label: "Cheaper than enterprise CRMs", icon: TrendingUp },
  { value: "< 1 day", label: "Average setup time", icon: CheckCircle },
  { value: "Free", label: "Always for ExcelBees clients", icon: Shield },
];

export function AboutPageContent() {
  return (
    <div className="bg-enterprise-midnight">
      {/* Hero */}
      <section
        aria-labelledby="about-hero-heading"
        className="relative overflow-hidden py-24 sm:py-32"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.2) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              About ExcelBees
            </p>
            <h1
              id="about-hero-heading"
              className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl"
            >
              Built by a Team That Got{" "}
              <span className="text-enterprise-amber">Frustrated Too</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              ExcelBees is a Brisbane-based digital marketing and web design agency.
              We help Queensland SMBs grow online through SEO, local SEO, and content
              marketing — and we needed a CRM to manage our own client relationships.
              After trying every major platform, we built RCRM for ourselves. Now we're
              sharing it with everyone, and it's{" "}
              <span className="text-enterprise-amber font-medium">always free for ExcelBees clients</span>.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/contact">
                <Button className="h-12 bg-enterprise-amber px-6 text-sm font-semibold text-black shadow-lg shadow-enterprise-amber/25 transition-all hover:bg-amber-500 hover:-translate-y-0.5 hover:shadow-enterprise-amber/40">
                  Get Your Free Access
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button
                  variant="ghost"
                  className="h-12 border border-enterprise-border px-6 text-sm text-muted-foreground hover:border-enterprise-amber/40 hover:bg-enterprise-amber/5 hover:text-foreground"
                >
                  Read Our Blog
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        aria-label="Company highlights"
        className="border-y border-enterprise-border bg-enterprise-surface/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-enterprise-border lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center px-6 py-8 text-center">
                <stat.icon className="mb-2 h-5 w-5 text-enterprise-amber" aria-hidden="true" />
                <span className="text-2xl font-bold text-enterprise-amber">{stat.value}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section
        aria-labelledby="story-heading"
        className="relative bg-enterprise-surface py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
                Our Story
              </p>
              <h2
                id="story-heading"
                className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl"
              >
                Why We Built RCRM
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  It started with frustration. As a Brisbane-based development agency, ExcelBees
                  needed a CRM to manage our own client relationships. We tried Salesforce — too
                  expensive and too complex for a small team. We tried HubSpot — better, but still
                  felt like we were paying for a hundred features to use five. We tried simpler tools
                  — and found ourselves compromising on the things that mattered most.
                </p>
                <p>
                  So we built our own. RCRM started as an internal tool — a lean, modular CRM
                  designed around the way Australian businesses actually work, not the way US
                  enterprise software vendors think they do. EOFY planning windows, Australian
                  phone formats, GST-inclusive invoicing, and AUD pricing. No conversions,
                  no workarounds, no unnecessary complexity.
                </p>
                <p>
                  When clients started asking about the platform we were using, we realised we
                  weren't alone in our frustration. In 2024, we launched RCRM publicly — and
                  the response confirmed what we suspected: there's a significant gap in the
                  market between enterprise-grade CRM (expensive, complex) and basic contact
                  management tools (too simple). RCRM fills that gap.
                </p>
              </div>

              <blockquote className="mt-8 rounded-xl border-l-4 border-enterprise-amber bg-enterprise-midnight/60 p-5">
                <p className="text-sm leading-relaxed text-foreground italic">
                  "We're a digital marketing agency — we manage client relationships every day.
                  We built RCRM because every CRM we tried was either too expensive, too complex,
                  or missing features Australian businesses actually need. Now our clients use it for free."
                </p>
                <footer className="mt-3 text-xs font-semibold text-enterprise-amber">
                  — ExcelBees Team, Redbank QLD &middot;{" "}
                  <a
                    href="https://excelbees.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                  >
                    excelbees.com
                  </a>
                </footer>
              </blockquote>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <p className="mb-6 text-sm font-semibold text-muted-foreground">Our Journey</p>
              <ol className="space-y-6" aria-label="Company timeline">
                {milestones.map((m, i) => (
                  <li key={m.year} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-enterprise-amber bg-enterprise-amber/10 text-xs font-bold text-enterprise-amber">
                        {m.year.slice(2)}
                      </div>
                      {i < milestones.length - 1 && (
                        <div className="mt-2 h-full w-px bg-enterprise-border" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-enterprise-amber">
                        {m.year}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{m.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        aria-labelledby="values-heading"
        className="bg-enterprise-midnight py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              What We Stand For
            </p>
            <h2
              id="values-heading"
              className="text-4xl font-bold text-white sm:text-5xl"
            >
              Our Values
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              These aren't aspirational statements — they're the principles behind every product
              decision we make at ExcelBees.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <motion.article
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-enterprise-border bg-enterprise-surface p-6 transition-all hover:border-enterprise-amber/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-enterprise-amber/10">
                  <value.icon className="h-5 w-5 text-enterprise-amber" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{value.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{value.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section
        aria-labelledby="team-heading"
        className="bg-enterprise-surface py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              The People Behind RCRM
            </p>
            <h2
              id="team-heading"
              className="text-4xl font-bold text-white sm:text-5xl"
            >
              Meet Our Team
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              A small, focused team of developers, designers, and business strategists — all based
              in Brisbane, all committed to building the CRM platform Australian businesses
              actually deserve.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, index) => (
              <TeamCard
                key={member.id}
                name={member.name}
                role={member.role}
                bio={member.bio}
                initials={member.initials}
                socialLinks={member.socialLinks}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Commitment to Australia */}
      <section
        aria-labelledby="commitment-heading"
        className="bg-enterprise-midnight py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-enterprise-amber/20 bg-enterprise-surface p-8 sm:p-12 lg:p-16">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
                  Our Commitment
                </p>
                <h2
                  id="commitment-heading"
                  className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl"
                >
                  Built for Australia. Backed by Locals.
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    RCRM is not a US platform adapted for Australia — it was conceived, designed,
                    and built here. That means the Australian Privacy Act compliance, EOFY workflow
                    support, GST-inclusive invoicing, Australian Business Number (ABN) fields, and
                    AUD pricing are native features, not afterthoughts.
                  </p>
                  <p>
                    We understand Australian business culture: the relationship-first approach of
                    trades businesses, the compliance demands on professional services firms, the
                    loyalty challenges facing independent retailers. These insights come from working
                    directly with local businesses, not from reading market research reports.
                  </p>
                  <p>
                    When you contact ExcelBees, you're talking to the team that built the platform.
                    No support ticketing queues, no offshore call centres. If something doesn't work
                    the way your business needs it to, we want to hear about it — and we'll fix it.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                {[
                  {
                    icon: MapPin,
                    title: "Redbank, QLD 4301 — Australia",
                    desc: "Every developer, designer, and support person is based right here in Queensland.",
                  },
                  {
                    icon: Shield,
                    title: "Australian Privacy Act Compliant",
                    desc: "Built from the ground up to meet APP requirements — not retrofitted for compliance.",
                  },
                  {
                    icon: Users,
                    title: "Direct Access to the Team",
                    desc: "When you email or call, you speak with the people who built the platform. info@excelbees.com.au",
                  },
                  {
                    icon: TrendingUp,
                    title: "Free for ExcelBees Clients",
                    desc: "RCRM is always free for all ExcelBees digital marketing and web design clients. No exceptions.",
                  },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-xl border border-enterprise-border bg-enterprise-midnight/50 p-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-enterprise-amber/10">
                      <item.icon className="h-4 w-4 text-enterprise-amber" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        aria-labelledby="about-cta-heading"
        className="relative border-t border-enterprise-border bg-enterprise-surface py-20"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-enterprise-amber/20 to-transparent" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2
              id="about-cta-heading"
              className="mb-4 text-3xl font-bold text-white sm:text-4xl"
            >
              Ready to Work With Us?
            </h2>
            <p className="mb-8 text-base text-muted-foreground">
              Book a free, personalised demo. We'll show you exactly how RCRM fits your workflow —
              no generic slides, no sales pressure, no lock-in.
            </p>
            <Link href="/contact">
              <Button className="h-12 bg-enterprise-amber px-8 text-sm font-semibold text-black shadow-lg shadow-enterprise-amber/25 transition-all hover:bg-amber-500 hover:-translate-y-0.5 hover:shadow-enterprise-amber/40">
                Book a Free Demo
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
