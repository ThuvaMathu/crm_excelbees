"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  businessType: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
  index: number;
}

export function TestimonialCard({
  name,
  businessType,
  role,
  quote,
  rating,
  initials,
  index,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-80px" }}
      className="group relative flex flex-col rounded-2xl border border-enterprise-border bg-enterprise-surface p-6 transition-all duration-300 hover:border-enterprise-amber/30 hover:shadow-lg hover:shadow-enterprise-amber/5"
    >
      {/* Top row: rating + quote icon */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-enterprise-amber text-enterprise-amber" />
          ))}
        </div>
        <Quote className="h-6 w-6 text-enterprise-amber/20 group-hover:text-enterprise-amber/40 transition-colors" />
      </div>

      {/* Quote */}
      <p className="mb-6 flex-grow text-sm leading-relaxed text-muted-foreground">
        "{quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-enterprise-border/50 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-enterprise-amber/30 to-enterprise-amber/10 text-xs font-bold text-enterprise-amber ring-2 ring-enterprise-amber/20">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {role} · {businessType}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
