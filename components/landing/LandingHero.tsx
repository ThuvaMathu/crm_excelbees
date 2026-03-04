"use client";

import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import {
    Shield,
    Server,
    Lock,
    Database,
    ChevronRight,
    Activity
} from "lucide-react";

// Animation variants for enterprise-level smoothness
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

export function LandingHero() {
    const scrollToContact = () => {
        document.getElementById('enterprise-contact')?.scrollIntoView({
            behavior: 'smooth'
        });
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-enterprise-midnight">
            {/* Enterprise Technical Background */}
            <div className="absolute inset-0 z-0">
                {/* Deep gradient base */}
                <div className="absolute inset-0 bg-gradient-to-br from-enterprise-midnight via-enterprise-slate to-enterprise-midnight" />

                {/* Subtle grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

                {/* Data flow lines - top to bottom */}
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-[15%] w-px h-1/3 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
                />
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-0 left-[35%] w-px h-1/4 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
                />
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-0 right-[25%] w-px h-1/3 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
                />
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-0 right-[40%] w-px h-1/5 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
                />

                {/* Subtle node glow effects */}
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-primary/40"
                />
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute top-[40%] right-[30%] w-2 h-2 rounded-full bg-primary/30"
                />
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                    className="absolute bottom-[30%] left-[30%] w-2 h-2 rounded-full bg-primary/40"
                />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/10 to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center py-20">
                {/* Text Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 text-center lg:text-left"
                >
                    {/* Premium Badge */}
                    <motion.div variants={itemVariants} className="inline-flex">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                                Self-Hosted & Private
                            </span>
                        </div>
                    </motion.div>

                    {/* Enterprise Headline */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]"
                    >
                        Your Data.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                            Your Server.
                        </span><br />
                        Your Domain.
                    </motion.h1>

                    {/* Value Proposition */}
                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
                    >
                        A personalized AI-powered CRM deployed entirely within your infrastructure.
                        <span className="text-primary font-medium"> Zero data leakage.</span>
                        Complete sovereignty.
                    </motion.p>

                    {/* Trust Indicators */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-400"
                    >
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span>SOC 2 Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            <span>GDPR Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-primary" />
                            <span>On-Premise</span>
                        </div>
                    </motion.div>

                    {/* Single Premium CTA */}
                    <motion.div variants={itemVariants} className="pt-4">
                        <Button
                            size="lg"
                            onClick={scrollToContact}
                            className="group relative w-full sm:w-auto text-base h-14 px-10 bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-primary text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-105"
                        >
                            Contact Us
                            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <p className="mt-4 text-sm text-slate-500">
                            Enterprise deployment with dedicated support
                        </p>
                    </motion.div>
                </motion.div>

                {/* Visual Content - Server/AI Visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="relative h-[650px] w-full hidden lg:block"
                >
                    {/* Main Server Infrastructure Card */}
                    <motion.div
                        animate={{ y: [-8, 8, -8] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 z-10"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%] bg-enterprise-slate/90 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Card Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-enterprise-midnight/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">crm.yourdomain.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-slate-400">Connected</span>
                                </div>
                            </div>

                            {/* Server Rack Visualization */}
                            <div className="p-6 space-y-4">
                                {/* Server Units */}
                                <div className="grid grid-cols-4 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.05) }}
                                            className="h-20 rounded-lg bg-enterprise-midnight/80 border border-white/5 p-3 flex flex-col items-center justify-center gap-2"
                                        >
                                            <Database className="h-5 w-5 text-primary/60" />
                                            <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${60 + Math.random() * 35}%` }}
                                                    transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Data Flow Lines */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-3 text-xs">
                                        <Activity className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-slate-400">AI Model Processing</span>
                                        <span className="ml-auto text-primary font-mono">Active</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <Server className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-slate-400">API Integration</span>
                                        <span className="ml-auto text-blue-400 font-mono">REST</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <Shield className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-slate-400">Private Deployment</span>
                                        <span className="ml-auto text-green-500 font-mono">On-Prem</span>
                                    </div>
                                </div>

                                {/* Activity Graph */}
                                <div className="pt-3">
                                    <div className="flex items-end gap-1 h-12">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${20 + Math.random() * 80}%` }}
                                                transition={{ delay: 1 + (i * 0.02), duration: 0.5 }}
                                                className="flex-1 bg-primary/30 rounded-sm hover:bg-primary/50 transition-colors"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Feature Cards */}
                    <motion.div
                        animate={{ y: [-8, 8, -8] }}
                        transition={{ duration: 7, ease: "easeInOut", delay: 0.5 }}
                        className="absolute -right-4 top-24 bg-enterprise-slate/95 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-primary/20 max-w-[180px]"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Security</p>
                                <p className="text-sm font-semibold text-white">Enterprise</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <div className="h-1 flex-1 bg-primary rounded-full" />
                            <div className="h-1 flex-1 bg-primary rounded-full" />
                            <div className="h-1 flex-1 bg-primary rounded-full" />
                            <div className="h-1 flex-1 bg-primary/30 rounded-full" />
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 8, ease: "easeInOut", delay: 1 }}
                        className="absolute -left-4 bottom-32 bg-enterprise-slate/95 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-primary/20 max-w-[180px]"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Lock className="h-4 w-4 text-green-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Data</p>
                                <p className="text-sm font-semibold text-white">100% Private</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">Your servers, your rules</p>
                    </motion.div>

                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 6.5, ease: "easeInOut", delay: 1.5 }}
                        className="absolute right-8 bottom-20 bg-enterprise-slate/95 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-primary/20 max-w-[180px]"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Server className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Deploy</p>
                                <p className="text-sm font-semibold text-white">Anywhere</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">AWS · Azure · GCP · On-Prem</p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2 text-slate-500"
                >
                    <span className="text-xs uppercase tracking-widest">Scroll</span>
                    <ChevronRight className="h-4 w-4 rotate-90" />
                </motion.div>
            </motion.div>
        </section>
    );
}
