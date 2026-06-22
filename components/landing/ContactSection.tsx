"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  Shield,
  Bot,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  businessType: z.string().min(1, "Please select a business type."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type FormValues = z.infer<typeof schema>;

const valueProps = [
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permission control for every team member.",
  },
  {
    icon: Bot,
    title: "AI-Powered Automation",
    desc: "Save 2+ hours daily on data entry and follow-ups.",
  },
  {
    icon: DollarSign,
    title: "Up to 60% Cheaper",
    desc: "Transparent pricing with no hidden enterprise fees.",
  },
  {
    icon: Clock,
    title: "Ready in Under a Day",
    desc: "Onboard your team and go live without a consultant.",
  },
  {
    icon: Users,
    title: "Built for Teams of 1–100",
    desc: "Scales with you. Pay only for seats you use.",
  },
  {
    icon: TrendingUp,
    title: "Visual Deal Pipeline",
    desc: "See your entire pipeline at a glance, always.",
  },
];

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", businessType: "", message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "excelbees2024@gmail.com",
          subject: `Demo Request from ${data.name} — ${data.businessType}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#F59E0B">New Demo Request — RCRM</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${data.name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px">${data.email}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;color:#666">Business Type</td><td style="padding:8px">${data.businessType}</td></tr>
              </table>
              <h3 style="color:#333">Message</h3>
              <p style="line-height:1.6">${data.message.replace(/\n/g, "<br>")}</p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        form.reset();
        toast.success("Request sent! We'll reach out within 24 hours.");
        setTimeout(() => setSubmitted(false), 8000);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative bg-enterprise-surface py-24 sm:py-32">
      {/* Top gradient edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-enterprise-amber/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
            Get Started
          </p>
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Ready to Transform Your Business?
          </h2>
          <p className="text-base text-muted-foreground">
            Book a personalised demo. We'll show you exactly how RCRM fits your
            workflow — no generic slides, no sales pressure.
          </p>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {/* Left: Value props grid */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="mb-6 text-sm font-semibold text-muted-foreground">
              What you get with RCRM
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {valueProps.map((vp, i) => (
                <motion.div
                  key={vp.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  viewport={{ once: true }}
                  className="flex gap-3 rounded-xl border border-enterprise-border bg-enterprise-midnight/40 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-enterprise-amber/10">
                    <vp.icon className="h-4 w-4 text-enterprise-amber" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{vp.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{vp.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-enterprise-border bg-card p-6 sm:p-8 shadow-2xl shadow-black/30"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h4 className="text-xl font-bold text-white">You're on the list!</h4>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Our team will reach out within 24 hours with your personalised demo.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-6 text-lg font-bold text-white">Request Your Demo</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-foreground">
                              Full Name <span className="text-enterprise-amber">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jane Smith"
                                {...field}
                                className="h-10 border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-enterprise-amber/60 focus:ring-enterprise-amber/20"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-foreground">
                              Work Email <span className="text-enterprise-amber">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="jane@company.com"
                                {...field}
                                className="h-10 border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-enterprise-amber/60 focus:ring-enterprise-amber/20"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">
                            Business Type <span className="text-enterprise-amber">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground focus:border-enterprise-amber/60">
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-enterprise-border bg-enterprise-slate">
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="trades">Trades</SelectItem>
                              <SelectItem value="professional">Professional Services</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">
                            Tell us about your needs <span className="text-enterprise-amber">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What CRM challenges are you trying to solve?"
                              {...field}
                              className="min-h-[110px] resize-none border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-enterprise-amber/60"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 w-full bg-enterprise-amber font-semibold text-black shadow-lg shadow-enterprise-amber/20 transition-all hover:bg-amber-500 hover:shadow-enterprise-amber/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending your request…
                        </>
                      ) : (
                        "Book My Free Demo"
                      )}
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground/60">
                      No spam. We'll reply within 24 hours.
                    </p>
                  </form>
                </Form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
