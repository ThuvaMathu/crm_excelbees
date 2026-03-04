"use client";

import { motion, Variants } from "framer-motion";
import { Code, Megaphone, Lightbulb, ArrowRight, ExternalLink, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// About Us data - three pillars of Excelbees
const pillars = [
    {
        icon: Code,
        title: "Web Development & Design",
        description: "Functional, user-friendly sites & e-commerce platforms. The foundation of your digital identity.",
        color: "from-blue-500/20 to-blue-600/10",
        iconColor: "text-blue-400",
        borderColor: "hover:border-blue-500/30"
    },
    {
        icon: Megaphone,
        title: "Digital Marketing",
        description: "SEO, social media strategy, and PPC. Growth-focused visibility for your brand.",
        color: "from-primary/20 to-amber-600/10",
        iconColor: "text-primary",
        borderColor: "hover:border-primary/30"
    },
    {
        icon: Lightbulb,
        title: "Strategy & Branding",
        description: "Defining brand voice and digital strategies for maximum engagement and conversion.",
        color: "from-purple-500/20 to-purple-600/10",
        iconColor: "text-purple-400",
        borderColor: "hover:border-purple-500/30"
    }
];

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
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

const floatVariants: Variants = {
    animate: {
        y: [-10, 10, -10],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export function LandingAbout() {
    const scrollToContact = () => {
        document.getElementById('enterprise-contact')?.scrollIntoView({
            behavior: 'smooth'
        });
    };

    return (
        <section id="about-us" className="py-32 bg-enterprise-slate relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-enterprise-midnight via-enterprise-slate to-enterprise-midnight" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />

            {/* Ambient glow */}
            <div className="absolute top-1/2 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
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
                        <Globe2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                            About Excelbees
                        </span>
                    </motion.div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                        Your Partner in{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                            Digital Growth
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
                        A full-service digital solutions agency. Your one-stop shop for technical and creative services.
                    </p>
                </motion.div>

                {/* Three Pillars Infographic */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20"
                >
                    {pillars.map((pillar, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -12 }}
                            transition={{ duration: 0.4 }}
                            className="relative"
                        >
                            {/* Floating number badge */}
                            <motion.div
                                {...floatVariants}
                                transition={{ delay: index * 0.5 }}
                                className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30 z-10"
                            >
                                {index + 1}
                            </motion.div>

                            {/* Card */}
                            <div className={`relative h-full bg-gradient-to-br ${pillar.color} backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-500 ${pillar.borderColor} group overflow-hidden`}>
                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Icon */}
                                <div className="relative z-10 h-16 w-16 rounded-xl bg-enterprise-midnight/80 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <pillar.icon className={`h-8 w-8 ${pillar.iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors duration-300">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        {pillar.description}
                                    </p>
                                </div>

                                {/* Bottom accent line */}
                                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary to-amber-600 group-hover:w-full transition-all duration-500 rounded-full" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mission Statement - Prominent Block */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="max-w-4xl mx-auto mb-16"
                >
                    <div className="bg-enterprise-midnight/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 mb-6">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent" />
                                <span className="text-primary font-semibold uppercase tracking-widest text-sm">Our Mission</span>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent via-primary to-transparent" />
                            </div>
                            <p className="text-xl md:text-2xl text-white leading-relaxed font-light">
                                Bridging complex technology and business growth. We deliver professional, scalable solutions that transform your digital presence into a powerful asset.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 md:p-12">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to Grow Your Business?
                        </h3>
                        <p className="text-lg text-slate-300 mb-8">
                            Do you have a business need for a website or digital marketing?
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={scrollToContact}
                                className="group h-14 px-8 bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-primary text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-105"
                            >
                                Contact Us
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                            <a
                                href="https://www.excelbees.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 text-primary hover:text-amber-300 transition-colors font-semibold text-lg"
                            >
                                Visit www.excelbees.com
                                <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
