"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
    return (
        <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="bg-gradient-to-br from-secondary via-slate-900 to-slate-950 rounded-3xl p-12 md:p-24 text-center shadow-2xl overflow-hidden relative">

                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-primary/20 blur-[120px] pointer-events-none rounded-full" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 max-w-3xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                            Ready to transform your business?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                            Join thousands of companies using ExcelBees to streamline their sales, support, and marketing teams.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                                asChild
                            >
                                <Link href="/login">
                                    Get a Free Demo
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="w-full sm:w-auto text-lg h-14 px-8 text-white hover:bg-white/10"
                            >
                                Contact Sales
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
