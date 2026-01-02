"use client";

import { motion } from "framer-motion";
import {
    Users,
    BarChart2,
    Workflow,
    ShieldCheck,
    Zap,
    MessageSquare,
    Globe,
    Smartphone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
    {
        icon: Users,
        title: "Available Global Source",
        description: "Access your data from anywhere in the world with our distributed cloud infrastructure."
    },
    {
        icon: Smartphone,
        title: "Mobile-First Design",
        description: "Built for teams on the move. Manage deals, contacts, and tasks directly from your phone."
    },
    {
        icon: Workflow,
        title: "Built for Teamwork",
        description: "Collaborate in real-time with shared views, comments, and automated assignments."
    },
    {
        icon: ShieldCheck,
        title: "Enterprise Security",
        description: "Bank-grade encryption and role-based access control to keep your sensitive data safe."
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Optimized for speed with localized caching and instant UI updates."
    },
    {
        icon: MessageSquare,
        title: "AI Integrations",
        description: "Smart suggestions and automated email drafting powered by advanced LLMs."
    }
];

export function LandingFeatures() {
    return (
        <section id="features" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6"
                    >
                        Finally, a CRM designed to seamlessly adapt to your <span className="text-primary">needs</span>.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Stop fighting with clunky software. Our intuitive platform streamlines your workflow, creates automation, and helps you close deals faster.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="h-full border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
