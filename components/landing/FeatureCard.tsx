"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-80px" }}
      className="group relative rounded-2xl border border-enterprise-border bg-card p-6 transition-all duration-300 hover:border-enterprise-amber/40 hover:shadow-xl hover:shadow-enterprise-amber/5 hover:-translate-y-1"
    >
      {/* Subtle top-glow on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-enterprise-amber/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Icon */}
      <div className="mb-4 inline-flex rounded-xl bg-enterprise-amber/10 p-3 ring-1 ring-enterprise-amber/20 transition-colors duration-300 group-hover:bg-enterprise-amber/20 group-hover:ring-enterprise-amber/40">
        <Icon className="h-5 w-5 text-enterprise-amber" />
      </div>

      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}
