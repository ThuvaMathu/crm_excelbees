"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { team } from "@/lib/constants/team";
import { TeamCard } from "./TeamCard";
import { ArrowRight } from "lucide-react";

export function AboutSection() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="about" className="relative bg-enterprise-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-start">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              About ExcelBees
            </p>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Built by a Team That Got Frustrated Too
            </h2>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              ExcelBees is a Brisbane-based digital marketing and web design agency.
              We help Queensland SMBs grow online through SEO and content marketing.
              RCRM is our internal CRM — built because every platform we tried was
              too expensive, too complex, or missing Australian-specific features.
              We decided to share it — and make it permanently free for all ExcelBees clients.
            </p>

            {/* Story quote */}
            <div className="mb-8 rounded-xl border-l-4 border-enterprise-amber bg-enterprise-midnight/60 p-5">
              <p className="text-sm leading-relaxed text-foreground italic">
                "We built RCRM for ourselves as a digital marketing agency managing dozens of
                client relationships. When it worked, we made it free for all our clients
                — and opened it to everyone else."
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => scrollTo("#contact")}
              className="border-enterprise-amber text-enterprise-amber hover:bg-enterprise-amber/10 hover:text-enterprise-amber group"
            >
              Claim Your Free Access
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          {/* Right: Team grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <p className="mb-6 text-sm font-semibold text-muted-foreground">Our Team</p>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
