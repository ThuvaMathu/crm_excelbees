"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function LandingCTA() {
    const scrollToContact = () => {
        document.getElementById('enterprise-contact')?.scrollIntoView({
            behavior: 'smooth'
        });
    };

    return (
        <section className="py-20 bg-enterprise-midnight relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-enterprise-slate to-enterprise-midnight" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Subtle pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
                        Ready to take control of your CRM data?
                    </h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Join enterprises worldwide who trust us with their most critical customer data.
                    </p>

                    <Button
                        size="lg"
                        onClick={scrollToContact}
                        className="group h-14 px-10 bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-primary text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-105"
                    >
                        Start Your Enterprise Journey
                        <ChevronDown className="ml-2 h-5 w-5 transition-transform group-hover:translate-y-1" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
