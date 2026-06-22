"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/constants/features";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-enterprise-surface py-24 sm:py-32">
      {/* Subtle radial background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
            Why RCRM
          </p>
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Everything You Need.{" "}
            <span className="text-muted-foreground font-normal">Nothing You Don't.</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Don't waste money on unwanted features. Pay only for what you need.
            Every module is optional — build the CRM your business actually uses.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
