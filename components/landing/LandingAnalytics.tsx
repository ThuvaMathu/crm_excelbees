"use client";

import { motion } from "framer-motion";
import { Database, Shield, TrendingUp, Server, CheckCircle2, Code } from "lucide-react";

export function LandingAnalytics() {
    const stats = [
        {
            value: "100%",
            label: "Data Ownership",
            description: "Your data, your infrastructure",
            icon: Shield
        },
        {
            value: "RESTful",
            label: "API Access",
            description: "Full programmatic control",
            icon: Code
        },
        {
            value: "<100ms",
            label: "Response Time",
            description: "Local processing power",
            icon: Server
        },
        {
            value: "99.99%",
            label: "Uptime SLA",
            description: "Enterprise reliability",
            icon: CheckCircle2
        }
    ];

    return (
        <section className="py-32 bg-enterprise-slate relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-enterprise-midnight via-enterprise-slate to-enterprise-midnight" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Subtle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                        >
                            <Database className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                                Performance & Security
                            </span>
                        </motion.div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                            Enterprise infrastructure without the{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                                enterprise complexity
                            </span>
                        </h2>

                        <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            Deploy on your terms. Whether on-premise, in your private cloud, or in a hybrid environment—
                            get enterprise-grade AI capabilities with complete data sovereignty.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group relative"
                            >
                                <div className="h-full bg-enterprise-midnight/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                                    {/* Icon */}
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <stat.icon className="h-7 w-7" />
                                    </div>

                                    {/* Value */}
                                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">
                                        {stat.value}
                                    </h3>

                                    {/* Label */}
                                    <p className="text-lg font-semibold text-primary mb-2">
                                        {stat.label}
                                    </p>

                                    {/* Description */}
                                    <p className="text-sm text-slate-400">
                                        {stat.description}
                                    </p>

                                    {/* Bottom accent */}
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-amber-600 group-hover:w-full transition-all duration-500 rounded-full" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Deployment Options */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-20 text-center"
                    >
                        <p className="text-sm text-slate-500 uppercase tracking-widest mb-6">
                            Deploy Anywhere
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                            {["AWS", "Azure", "Google Cloud", "On-Premise", "Private Cloud", "Hybrid"].map((option) => (
                                <div key={option} className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-slate-300">{option}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
