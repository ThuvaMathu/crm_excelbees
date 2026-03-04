"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
    Button,
} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Send,
    CheckCircle2,
    Building2,
    Shield,
    Users,
    Mail,
    Phone,
    FileText,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/config/site";

// Enterprise contact form schema
const enterpriseContactSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    workEmail: z.string().email("Valid work email is required"),
    companyName: z.string().min(2, "Company name is required"),
    jobTitle: z.string().min(2, "Job title is required"),
    serverEnvironment: z.string().min(1, "Please select your server environment"),
    dataVolume: z.string().min(1, "Please select your data volume"),
    message: z.string().min(10, "Please provide more details about your requirements"),
});

type EnterpriseContactForm = z.infer<typeof enterpriseContactSchema>;

// Animation variants with proper typing
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
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

export function LandingContact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const form = useForm<EnterpriseContactForm>({
        resolver: zodResolver(enterpriseContactSchema),
        defaultValues: {
            fullName: "",
            workEmail: "",
            companyName: "",
            jobTitle: "",
            serverEnvironment: "",
            dataVolume: "",
            message: "",
        },
    });

    const onSubmit = async (data: EnterpriseContactForm) => {
        setIsSubmitting(true);

        // Simulate API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);

        toast({
            title: "Request Received",
            description: "Our enterprise team will contact you within 24 hours.",
        });

        form.reset();
    };

    return (
        <section id="enterprise-contact" className="py-32 bg-enterprise-midnight relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-enterprise-slate via-enterprise-midnight to-enterprise-midnight" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Subtle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

            {/* Ambient glow */}
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                        >
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                                Enterprise Concierge
                            </span>
                        </motion.div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                            Let&apos;s discuss your{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary">
                                private deployment
                            </span>
                        </h2>

                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Our enterprise team will work with you to design a custom deployment strategy
                            tailored to your infrastructure, security requirements, and scale.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Contact Information Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="lg:col-span-2 space-y-8"
                        >
                            {/* Enterprise Benefits */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-white uppercase tracking-wider">
                                    What to Expect
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        {
                                            icon: Shield,
                                            title: "Dedicated Architect",
                                            description: "A solutions architect assigned to your deployment"
                                        },
                                        {
                                            icon: Users,
                                            title: "Priority Support",
                                            description: "24/7 access to our engineering team"
                                        },
                                        {
                                            icon: Building2,
                                            title: "Custom Integration",
                                            description: "Tailored setup for your existing infrastructure"
                                        },
                                        {
                                            icon: FileText,
                                            title: "Compliance Pack",
                                            description: "Full documentation for SOC 2, GDPR, HIPAA"
                                        }
                                    ].map((benefit, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            className="flex gap-4 p-4 rounded-xl bg-enterprise-slate/50 border border-white/5 hover:border-primary/20 transition-all duration-300"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <benefit.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                                                <p className="text-sm text-slate-400">{benefit.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Direct Contact - Using centralized config */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-semibold text-white uppercase tracking-wider mb-4">
                                    Direct Contact
                                </h3>
                                <div className="space-y-3">
                                    <a
                                        href={`mailto:${siteConfig.contact.email}`}
                                        className="flex items-center gap-3 text-slate-300 hover:text-primary transition-colors group"
                                    >
                                        <Mail className="h-5 w-5" />
                                        <span>{siteConfig.contact.email}</span>
                                    </a>
                                    <a
                                        href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                                        className="flex items-center gap-3 text-slate-300 hover:text-primary transition-colors group"
                                    >
                                        <Phone className="h-5 w-5" />
                                        <span>{siteConfig.contact.phone}</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="lg:col-span-3"
                        >
                            <div className="bg-enterprise-slate/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
                                {isSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">
                                            Request Received
                                        </h3>
                                        <p className="text-slate-400 mb-8">
                                            Our enterprise team will review your requirements and contact you
                                            within 24 hours.
                                        </p>
                                        <Button
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="border-primary/30 text-primary hover:bg-primary/10"
                                        >
                                            Submit Another Request
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="fullName"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Full Name *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="John Smith"
                                                                        className="bg-enterprise-midnight/50 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="jobTitle"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Job Title *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="CTO / VP of Engineering"
                                                                        className="bg-enterprise-midnight/50 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>
                                            </motion.div>

                                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="workEmail"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Work Email *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="email"
                                                                        placeholder="john@company.com"
                                                                        className="bg-enterprise-midnight/50 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="companyName"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Company Name *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Acme Corporation"
                                                                        className="bg-enterprise-midnight/50 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>
                                            </motion.div>

                                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="serverEnvironment"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Server Environment *</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="bg-enterprise-midnight/50 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20">
                                                                            <SelectValue placeholder="Select environment" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="bg-enterprise-slate border-white/10">
                                                                        <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                                                                        <SelectItem value="azure">Microsoft Azure</SelectItem>
                                                                        <SelectItem value="gcp">Google Cloud Platform</SelectItem>
                                                                        <SelectItem value="on-prem">On-Premise Servers</SelectItem>
                                                                        <SelectItem value="hybrid">Hybrid Environment</SelectItem>
                                                                        <SelectItem value="private-cloud">Private Cloud</SelectItem>
                                                                        <SelectItem value="other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>

                                                <motion.div variants={itemVariants}>
                                                    <FormField
                                                        control={form.control}
                                                        name="dataVolume"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-slate-300">Data Volume *</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="bg-enterprise-midnight/50 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20">
                                                                            <SelectValue placeholder="Select volume" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="bg-enterprise-slate border-white/10">
                                                                        <SelectItem value="small">&lt; 10,000 records</SelectItem>
                                                                        <SelectItem value="medium">10,000 - 100,000 records</SelectItem>
                                                                        <SelectItem value="large">100,000 - 1,000,000 records</SelectItem>
                                                                        <SelectItem value="enterprise">1,000,000+ records</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </motion.div>
                                            </motion.div>

                                            <motion.div variants={itemVariants} initial="hidden" animate="visible">
                                                <FormField
                                                    control={form.control}
                                                    name="message"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-300">Tell Us About Your Requirements *</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Please describe your deployment requirements, timeline, and any specific security or compliance needs..."
                                                                    rows={5}
                                                                    className="bg-enterprise-midnight/50 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 resize-none"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 }}
                                            >
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full h-14 text-base bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-primary text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="mr-2 h-5 w-5" />
                                                            Submit Enterprise Request
                                                        </>
                                                    )}
                                                </Button>
                                                <p className="mt-4 text-center text-sm text-slate-500">
                                                    All fields are required. Our team typically responds within 24 hours.
                                                </p>
                                            </motion.div>
                                        </form>
                                    </Form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
