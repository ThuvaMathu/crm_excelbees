"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/constants/blog";
import { BlogCard } from "./BlogCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function BlogSection() {
  const recentPosts = blogPosts.slice(0, 3);

  return (
    <section id="blog" className="bg-enterprise-midnight py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              Resources
            </p>
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              From the ExcelBees Blog
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              CRM strategies, AI tips, and business growth insights — no fluff, just
              what your team can actually use tomorrow.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex-shrink-0"
          >
            <Link href="/blog">
              <Button
                variant="ghost"
                className="group border border-enterprise-border text-muted-foreground hover:border-enterprise-amber/40 hover:text-foreground"
              >
                View All Posts
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="contents" tabIndex={-1}>
              <BlogCard post={post} index={index} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
