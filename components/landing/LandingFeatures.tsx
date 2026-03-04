"use client";

import { motion, Variants } from "framer-motion";
import {
    Shield,
    Server,
    Brain,
    CheckCircle,
    Zap,
    Building2,
    Globe,
    Code
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const enterpriseFeatures = [
    {
        icon: Server,
        id: undefined,
        title: "Private Deployment",
        description: "Deploy on your servers, your VPC, or your private cloud. Your infrastructure, your control.",
        accent: "from-blue-500/20 to-blue-600/10"
    },
    {
        icon: Shield,
        id: undefined,
        title: "Data Sovereignty",
        description: "Your data never leaves your infrastructure. Complete ownership with zero external dependencies.",
        accent: "from-green-500/20 to-green-600/10"
    },
    {
        icon: Brain,
        id: undefined,
        title: "Custom AI Training",
        description: "AI models trained exclusively on your proprietary data. Intelligence that understands your business.",
        accent: "from-primary/20 to-primary/10"
    },
    {
        icon: CheckCircle,
        id: undefined,
        title: "SOC 2 & GDPR Ready",
        description: "Enterprise compliance built-in. Audit logs, role-based access, and security controls pre-configured.",
        accent: "from-purple-500/20 to-purple-600/10"
    },
    {
        icon: Zap,
        id: undefined,
        title: "On-Premise Performance",
        description: "No external API latency. Lightning-fast responses with direct local processing.",
        accent: "from-amber-500/20 to-amber-600/10"
    },
    {
        icon: Building2,
        id: undefined,
        title: "White-Label Solution",
        description: "Your domain, your brand, your CRM. Complete customization to match your enterprise identity.",
        accent: "from-slate-500/20 to-slate-600/10"
    },
    {
        icon: Globe,
        id: undefined,
        title: "Hybrid Architecture",
        description: "Flexibility to deploy on-premise, in the cloud, or in a hybrid configuration that suits your needs.",
        accent: "from-cyan-500/20 to-cyan-600/10"
    },
    {
        icon: Code,
        id: "integration",
        title: "RESTful API Access",
        description: "Full programmatic control. Integrate with your existing systems and automate workflows.",
        accent: "from-orange-500/20 to-orange-600/10"
    }
];

// Enhanced animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

export function LandingFeatures() {
    return (
        <section id="features" className="py-32 bg-enterprise-midnight relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-enterprise-slate via-enterprise-midnight to-enterprise-midnight" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

            {/* Corner glow */}
            <div className="absolute top-1/2 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                    >
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                            Enterprise Grade
                        </span>
                    </motion.div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                        Built for organizations that demand{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                            complete control
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
                        Stop compromising on data privacy. Our self-hosted platform gives you enterprise AI capabilities
                        without ever sending your data outside your infrastructure.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {enterpriseFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -8 }}
                            transition={{ duration: 0.3 }}
                            id={feature.id || undefined}
                        >
                            <Card className={`h-full border border-white/5 bg-gradient-to-br ${feature.accent} backdrop-blur-sm hover:border-primary/30 transition-all duration-500 group overflow-hidden relative`}>
                                {/* Subtle gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/0 transition-all duration-500" />

                                <CardContent className="p-8 relative z-10">
                                    {/* Icon */}
                                    <div className="h-14 w-14 rounded-xl bg-enterprise-midnight/80 border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
                                        <feature.icon className="h-7 w-7" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors duration-300">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-slate-400 leading-relaxed text-sm">
                                        {feature.description}
                                    </p>
                                </CardContent>

                                {/* Bottom accent line */}
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-amber-600 group-hover:w-full transition-all duration-500" />
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Trust Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-24 text-center"
                >
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-8">
                        Trusted by enterprises with the highest security requirements
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
                        {["Financial Services", "Healthcare", "Government", "Legal"].map((industry) => (
                            <div key={industry} className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                <span className="text-sm font-semibold text-slate-400">{industry}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
