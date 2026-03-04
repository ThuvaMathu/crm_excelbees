"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

export function LandingNavbar() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
    };

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Features", section: "features" },
        { name: "Integration", section: "integration" },
        { name: "About Us", section: "about-us" },
        { name: "Contact", section: "enterprise-contact" },
    ];

    return (
        <motion.nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                isScrolled
                    ? "bg-enterprise-midnight/90 backdrop-blur-xl border-b border-primary/10 py-4 shadow-lg shadow-black/20"
                    : "bg-transparent py-6"
            )}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <Image
                                src="/logo.png"
                                alt="ExcelBees"
                                width={180}
                                height={40}
                                className={cn(
                                    "h-10 w-auto object-contain transition-all duration-300",
                                    isScrolled ? "" : "brightness-0 invert"
                                )}
                                priority
                            />
                        </motion.div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) =>
                            link.section ? (
                                <button
                                    key={link.name}
                                    onClick={() => scrollToSection(link.section)}
                                    className={cn(
                                        "text-sm font-medium tracking-wide transition-all duration-300 relative group",
                                        isScrolled ? "text-slate-300" : "text-white/80"
                                    )}
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                                </button>
                            ) : link.href ? (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-medium tracking-wide transition-all duration-300 relative group",
                                        isScrolled ? "text-slate-300" : "text-white/80"
                                    )}
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                                </Link>
                            ) : null
                        )}
                    </div>

                    {/* CTA Button & Mobile Menu Toggle */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className={cn(
                                "text-sm font-medium transition-colors hidden sm:block",
                                isScrolled ? "text-slate-400 hover:text-primary" : "text-white/70 hover:text-white"
                            )}
                        >
                            Sign In
                        </Link>
                        <Button
                            onClick={() => scrollToSection("enterprise-contact")}
                            className={cn(
                                "font-semibold transition-all duration-300 hover:scale-105 shadow-lg",
                                isScrolled
                                    ? "bg-gradient-to-r from-primary to-amber-600 text-white hover:shadow-primary/30"
                                    : "bg-white text-enterprise-midnight hover:bg-primary hover:shadow-primary/20"
                            )}
                        >
                            Contact Sales
                        </Button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-slate-300 hover:text-white"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden mt-4 pb-4 border-t border-white/10"
                    >
                        <div className="flex flex-col gap-4 py-4">
                            {navLinks.map((link) => (
                                link.section ? (
                                    <button
                                        key={link.name}
                                        onClick={() => scrollToSection(link.section)}
                                        className="text-left text-slate-300 hover:text-primary transition-colors py-2"
                                    >
                                        {link.name}
                                    </button>
                                ) : link.href ? (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-left text-slate-300 hover:text-primary transition-colors py-2"
                                    >
                                        {link.name}
                                    </Link>
                                ) : null
                            ))}
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-left text-slate-300 hover:text-primary transition-colors py-2"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom accent line on scroll */}
            <motion.div
                className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: isScrolled ? "100%" : "0%" }}
                transition={{ duration: 0.5 }}
            />
        </motion.nav>
    );
}
