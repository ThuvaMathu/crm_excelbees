"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-enterprise-border bg-enterprise-midnight/90 backdrop-blur-lg shadow-xl shadow-black/20"
          : "border-b border-transparent bg-enterprise-midnight/60 backdrop-blur-sm"
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-enterprise-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" aria-label="RCRM by ExcelBees — home">
              <Logo width={140} height={32} />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex flex-1 justify-center">
            {navLinks.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-enterprise-amber"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-enterprise-amber" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link href="/contact">
              <Button className="bg-enterprise-amber hover:bg-amber-500 text-black font-semibold shadow-lg shadow-enterprise-amber/20 transition-all hover:shadow-enterprise-amber/40 hover:-translate-y-0.5">
                Get Your Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-l border-enterprise-border bg-enterprise-midnight w-72"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav aria-label="Mobile navigation" className="mt-8 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const active = isActive(link.href, pathname);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-enterprise-amber/10 text-enterprise-amber"
                            : "text-muted-foreground hover:bg-enterprise-slate hover:text-foreground"
                        )}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-enterprise-amber" aria-hidden="true" />
                        )}
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="mt-4 border-t border-enterprise-border pt-4 flex flex-col gap-3 px-4">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link href="/contact" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-enterprise-amber hover:bg-amber-500 text-black font-semibold">
                        Get Your Demo
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
