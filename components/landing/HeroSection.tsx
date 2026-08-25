"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowDown, TrendingUp, Users, Zap } from "lucide-react";

const stats = [
  { value: "60%", label: "Less than Salesforce" },
  { value: "2hrs", label: "Saved daily with AI" },
  { value: "< 1 day", label: "Setup time" },
  { value: "14+", label: "Modules, one platform" },
];

const chips = [
  "Contacts, Deals & Projects",
  "Quotes & Invoicing (AUD)",
  "AI Assistant Built-In",
];

export function HeroSection() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="relative min-h-dvh overflow-hidden bg-enterprise-midnight flex flex-col"
    >
      {/* Layered background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(245,158,11,0.25) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -right-32 top-0 h-[400px] w-[400px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute -left-32 bottom-0 h-[300px] w-[300px] rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, rgba(29,78,216,0.3) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            {/* ── LEFT COLUMN ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col gap-8"
            >
              {/* Label pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-enterprise-amber/30 bg-enterprise-amber/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-enterprise-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-enterprise-amber animate-pulse" />
                  Brisbane-Built CRM
                </span>
              </motion.div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  CRM Built for{" "}
                  <span className="relative inline-block text-enterprise-amber">
                    Custom
                    <svg
                      className="absolute -bottom-1 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5.5C47 2 100 1 199 5.5"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                    </svg>
                  </span>{" "}
                  Business Needs
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Stop paying for bloated CRMs. RCRM gives you exactly what
                  your business needs — no more, no less — at a fraction of
                  enterprise pricing.
                </p>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Badge
                    key={chip}
                    variant="secondary"
                    className="rounded-full border border-enterprise-border bg-enterprise-slate/80 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => scrollTo("#contact")}
                  className="group h-12 bg-enterprise-amber px-6 text-sm font-semibold text-black shadow-lg shadow-enterprise-amber/25 transition-all hover:bg-amber-500 hover:-translate-y-0.5 hover:shadow-enterprise-amber/40"
                >
                  Get Your Custom Demo
                  <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => scrollTo("#features")}
                  className="h-12 border border-enterprise-border px-6 text-sm text-muted-foreground hover:border-enterprise-amber/40 hover:bg-enterprise-amber/5 hover:text-foreground"
                >
                  See How It Works
                  <ArrowDown className="ml-1.5 h-4 w-4" />
                </Button>
              </div>

              {/* Trust line */}
              <p className="text-xs text-muted-foreground/60">
                No credit card required &middot; Setup in under a day &middot; Cancel anytime
              </p>
            </motion.div>

            {/* ── RIGHT COLUMN — Dashboard Mockup ── */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              {/* Glow behind the card */}
              <div className="absolute -inset-4 rounded-2xl bg-enterprise-amber/5 blur-xl" />

              {/* Main dashboard card */}
              <div className="relative rounded-2xl border border-enterprise-border bg-enterprise-slate shadow-2xl shadow-black/60 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 border-b border-enterprise-border bg-enterprise-midnight/60 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <div className="ml-3 flex-1 rounded bg-enterprise-border/50 px-3 py-1 text-xs text-muted-foreground/50">
                    rcrm.excelbees.com.au/dashboard
                  </div>
                </div>

                {/* Dashboard UI mockup */}
                <div className="p-4 space-y-4">
                  {/* Stat row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Active Leads", value: "248", delta: "+12%", icon: TrendingUp, color: "text-emerald-400" },
                      { label: "Open Quotes", value: "$62K", delta: "11 pending", icon: Zap, color: "text-enterprise-amber" },
                      { label: "Active Projects", value: "9", delta: "On track", icon: Users, color: "text-blue-400" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-enterprise-border bg-enterprise-midnight/50 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                          <stat.icon className={`h-3 w-3 ${stat.color}`} />
                        </div>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                        <p className={`text-[10px] font-medium ${stat.color}`}>{stat.delta}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline */}
                  <div className="rounded-lg border border-enterprise-border bg-enterprise-midnight/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Sales Pipeline</p>
                    <div className="space-y-2">
                      {[
                        { stage: "New Lead", count: 58, pct: 90, color: "bg-blue-500" },
                        { stage: "Quoted", count: 24, pct: 65, color: "bg-enterprise-amber" },
                        { stage: "Negotiation", count: 11, pct: 38, color: "bg-emerald-500" },
                        { stage: "Closed Won", count: 7, pct: 22, color: "bg-purple-500" },
                      ].map((row) => (
                        <div key={row.stage} className="flex items-center gap-3">
                          <p className="w-24 text-[10px] text-muted-foreground shrink-0">{row.stage}</p>
                          <div className="flex-1 h-1.5 rounded-full bg-enterprise-border">
                            <div
                              className={`h-full rounded-full ${row.color}`}
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                          <p className="w-4 text-[10px] text-right text-white">{row.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-lg border border-enterprise-border bg-enterprise-midnight/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Recent Activity</p>
                    <div className="space-y-2">
                      {[
                        { name: "James M.", action: "Quote accepted — $14,200", time: "1m ago", dot: "bg-emerald-400" },
                        { name: "AI Assistant", action: "Enriched 12 contacts", time: "4m ago", dot: "bg-enterprise-amber" },
                        { name: "Sarah C.", action: "Project milestone marked done", time: "9m ago", dot: "bg-blue-400" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${item.dot} shrink-0`} />
                          <p className="text-[10px] text-white font-medium shrink-0">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.action}</p>
                          <p className="text-[10px] text-muted-foreground/50 shrink-0 ml-auto">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge — AI */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-16 z-10 hidden sm:block"
              >
                <div className="rounded-xl border border-enterprise-amber/30 bg-enterprise-slate/95 backdrop-blur px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-enterprise-amber/20">
                      <Zap className="h-3.5 w-3.5 text-enterprise-amber" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Quote sent in 28s</p>
                      <p className="text-[10px] text-emerald-400">AI-drafted & branded</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge — savings */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -left-4 bottom-16 z-10 hidden sm:block"
              >
                <div className="rounded-xl border border-emerald-500/30 bg-enterprise-slate/95 backdrop-blur px-4 py-3 shadow-xl">
                  <p className="text-xs font-semibold text-white">14 modules. One price.</p>
                  <p className="text-[10px] text-emerald-400">No per-feature add-ons</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="relative border-t border-enterprise-border bg-enterprise-surface/60 backdrop-blur"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-enterprise-border lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center px-6 py-5 text-center">
                <span className="text-2xl font-bold text-enterprise-amber">{s.value}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
