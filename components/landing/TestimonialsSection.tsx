"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { testimonials } from "@/lib/constants/testimonials";
import { TestimonialCard } from "./TestimonialCard";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative bg-enterprise-midnight py-24 sm:py-32 overflow-hidden">
      {/* Dim radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245,158,11,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-enterprise-border bg-enterprise-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3 text-enterprise-amber" />
            Local Brisbane Businesses
          </div>
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Trusted by Brisbane Businesses
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Real results from real businesses. No generic case studies — these are our neighbours.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard
              key={t.id}
              name={t.name}
              businessType={t.businessType}
              role={t.role}
              quote={t.quote}
              rating={t.rating}
              initials={t.initials}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
