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
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  businessType: z.string().min(1, "Please select a business type."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type FormValues = z.infer<typeof schema>;

const valueProps = [
  { icon: Shield, title: "Role-Based Access", desc: "Granular permission control for every team member." },
  { icon: Bot, title: "AI-Powered Automation", desc: "Save 2+ hours daily on data entry and follow-ups." },
  { icon: DollarSign, title: "Up to 60% Cheaper", desc: "Transparent pricing with no hidden enterprise fees." },
  { icon: Clock, title: "Ready in Under a Day", desc: "Onboard your team and go live without a consultant." },
  { icon: Users, title: "Built for Teams of 1–100", desc: "Scales with you. Pay only for seats you use." },
  { icon: TrendingUp, title: "Visual Deal Pipeline", desc: "See your entire pipeline at a glance, always." },
];

const faqs = [
  {
    q: "How long does the demo take?",
    a: "Our demos are 30–45 minutes, focused entirely on your specific use case. No generic slides.",
  },
  {
    q: "Is there any commitment after the demo?",
    a: "Absolutely none. The demo is free and there's no obligation to sign up.",
  },
  {
    q: "How quickly will I hear back?",
    a: "We respond to all demo requests within one business day — usually within a few hours.",
  },
  {
    q: "Can I trial RCRM before committing?",
    a: "Yes. We offer a guided trial period so you can test the platform with your own data.",
  },
];

export function ContactPageContent() {
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
    <div className="bg-enterprise-midnight">
      {/* Hero */}
      <section
        aria-labelledby="contact-hero-heading"
        className="relative overflow-hidden py-24 sm:py-32"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.2) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              Get Started
            </p>
            <h1
              id="contact-hero-heading"
              className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl"
            >
              Let's Talk About{" "}
              <span className="text-enterprise-amber">Your Business</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Book a free, personalised demo. We'll show you exactly how RCRM fits your
              workflow — no generic slides, no sales pressure, no lock-in.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact details bar */}
      <section
        aria-label="Contact information"
        className="border-y border-enterprise-border bg-enterprise-surface/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-enterprise-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { icon: MapPin, label: "Based In", value: "Brisbane, Queensland, Australia" },
              { icon: Mail, label: "Email Us", value: "excelbees2024@gmail.com" },
              { icon: MessageSquare, label: "Response Time", value: "Within 1 business day" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 px-6 py-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-enterprise-amber/10">
                  <item.icon className="h-4 w-4 text-enterprise-amber" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main form section */}
      <section
        aria-labelledby="contact-form-heading"
        className="relative bg-enterprise-surface py-24 sm:py-32"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-enterprise-amber/20 to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            {/* Left: Value props */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2
                id="contact-form-heading"
                className="mb-2 text-3xl font-bold text-white sm:text-4xl"
              >
                What You Get With RCRM
              </h2>
              <p className="mb-8 text-sm text-muted-foreground">
                Every demo is tailored to your business type and specific challenges.
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
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-enterprise-amber/10">
                      <vp.icon className="h-4 w-4 text-enterprise-amber" aria-hidden="true" />
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
              className="rounded-2xl border border-enterprise-border bg-card p-6 shadow-2xl shadow-black/30 sm:p-8"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-white">You're on the list!</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Our team will reach out within 24 hours with your personalised demo.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="mb-6 text-lg font-bold text-white">Request Your Free Demo</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-foreground">
                                Full Name <span className="text-enterprise-amber" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Jane Smith"
                                  autoComplete="name"
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
                                Work Email <span className="text-enterprise-amber" aria-hidden="true">*</span>
                                <span className="sr-only">(required)</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="jane@company.com.au"
                                  autoComplete="email"
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
                              Business Type <span className="text-enterprise-amber" aria-hidden="true">*</span>
                              <span className="sr-only">(required)</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground focus:border-enterprise-amber/60">
                                  <SelectValue placeholder="Select your industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-enterprise-border bg-enterprise-slate">
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="trades">Trades (Electrician, Plumber, Builder)</SelectItem>
                                <SelectItem value="professional">Professional Services</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="construction">Construction</SelectItem>
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
                              Tell us about your needs <span className="text-enterprise-amber" aria-hidden="true">*</span>
                              <span className="sr-only">(required)</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What CRM challenges are you trying to solve? How many team members need access?"
                                {...field}
                                className="min-h-[120px] resize-none border-enterprise-border bg-enterprise-midnight/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-enterprise-amber/60"
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Sending your request…
                          </>
                        ) : (
                          "Book My Free Demo"
                        )}
                      </Button>

                      <p className="text-center text-[11px] text-muted-foreground/60">
                        No spam. We'll reply within 24 hours. No credit card required.
                      </p>
                    </form>
                  </Form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="contact-faq-heading"
        className="bg-enterprise-midnight py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              FAQs
            </p>
            <h2
              id="contact-faq-heading"
              className="text-3xl font-bold text-white"
            >
              Before You Book
            </h2>
          </motion.div>

          <dl className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="rounded-xl border border-enterprise-border bg-enterprise-surface p-5"
              >
                <dt className="mb-2 text-sm font-semibold text-foreground">{faq.q}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
