"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Shield } from "lucide-react";

export function LandingHero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-secondary pt-20">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-secondary to-secondary z-0" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8 text-center lg:text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-foreground/5 border border-white/10 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                        <span className="text-sm font-medium text-white/90">v2.0 is now live</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        The ultimate sales assistant,{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                            always ready.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Supercharge your sales process with AI-driven insights, automated workflows,
                        and real-time analytics. Finally, a CRM that works for you, not against you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105"
                            asChild
                        >
                            <Link href="/login">
                                Get Started Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                        >
                            View Live Demo
                        </Button>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {/* Simple Logos or Placeholders */}
                        <span className="text-sm font-semibold tracking-wider uppercase">Trusted by industry leaders</span>
                    </div>
                </motion.div>

                {/* Visual Content */}
                <div className="relative h-[600px] w-full hidden lg:block">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute inset-0 z-10"
                    >
                        {/* Main Dashboard Card */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[70%] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
                                <div className="h-32 rounded-xl bg-white/5 animate-pulse delay-75" />
                                <div className="h-32 rounded-xl bg-white/5 animate-pulse delay-150" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-8 w-3/4 rounded-lg bg-white/5" />
                                <div className="h-8 w-full rounded-lg bg-white/5" />
                                <div className="h-8 w-5/6 rounded-lg bg-white/5" />
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -right-8 top-20 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-border max-w-[200px]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Revenue</p>
                                        <p className="text-sm font-bold text-foreground">+$12,450</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [10, -10, 10] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -left-8 bottom-20 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-border max-w-[200px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">New Leads</p>
                                        <p className="text-sm font-bold text-foreground">142 Active</p>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
