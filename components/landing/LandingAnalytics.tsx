"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PieChart, TrendingUp, Activity, Users } from "lucide-react";

export function LandingAnalytics() {
    return (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
            {/* Dark theme background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Text Content */}
                    <div className="order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="h-1 w-20 bg-primary mb-8" />
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                                Monitor and analyze global user <span className="text-primary">engagement in real time</span>.
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 max-w-xl">
                                Get real-time insights into your sales pipeline, team performance, and customer behavior.
                                Our advanced analytics engine processes millions of data points to give you actionable intelligence instantly.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-8 mb-10">
                                <div>
                                    <h4 className="text-4xl font-bold text-white mb-2">2.5x</h4>
                                    <p className="text-sm text-slate-500 uppercase tracking-widest">Revenue Growth</p>
                                </div>
                                <div className="w-px bg-slate-800 hidden sm:block" />
                                <div>
                                    <h4 className="text-4xl font-bold text-white mb-2">120+</h4>
                                    <p className="text-sm text-slate-500 uppercase tracking-widest">Countries Supported</p>
                                </div>
                                <div className="w-px bg-slate-800 hidden sm:block" />
                                <div>
                                    <h4 className="text-4xl font-bold text-white mb-2">99%</h4>
                                    <p className="text-sm text-slate-500 uppercase tracking-widest">Customer Satisfaction</p>
                                </div>
                            </div>

                            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800" size="lg">
                                Explore Analytics <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    </div>

                    {/* Visuals */}
                    <div className="order-1 lg:order-2">
                        <div className="relative">
                            {/* Central Hub */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative z-10 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold">Global Sales</h3>
                                        <p className="text-sm text-slate-500">Last 30 days</p>
                                    </div>
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <TrendingUp className="text-primary h-6 w-6" />
                                    </div>
                                </div>

                                {/* Mock Chart */}
                                <div className="h-64 w-full flex items-end justify-between gap-2">
                                    {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-sm relative group cursor-pointer"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                ${h}k
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Floating Orbits */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-800/50 rounded-full -z-10"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-slate-800 p-2 rounded-full border border-slate-700">
                                    <PieChart className="h-4 w-4 text-purple-400" />
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 bg-slate-800 p-2 rounded-full border border-slate-700">
                                    <Activity className="h-4 w-4 text-green-400" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-slate-800/50 rounded-full -z-10"
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-slate-800 p-2 rounded-full border border-slate-700">
                                    <Users className="h-4 w-4 text-blue-400" />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
