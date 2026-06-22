"use client";

import { motion } from "framer-motion";
import { Linkedin, Twitter } from "lucide-react";

interface TeamCardProps {
  name: string;
  role: string;
  bio: string;
  initials: string;
  index: number;
}

export function TeamCard({ name, role, bio, initials, index }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      viewport={{ once: true, margin: "-80px" }}
      className="group rounded-2xl border border-enterprise-border bg-card p-5 transition-all duration-300 hover:border-enterprise-amber/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-enterprise-amber/5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-enterprise-amber/25 to-enterprise-amber/10 text-sm font-bold text-enterprise-amber ring-2 ring-enterprise-amber/20">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs font-medium text-enterprise-amber">{role}</p>
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{bio}</p>
      <div className="flex gap-2">
        <button
          aria-label={`${name} on LinkedIn`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-enterprise-amber transition-colors"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label={`${name} on Twitter`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-enterprise-amber transition-colors"
        >
          <Twitter className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
