"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { blogPosts } from "@/lib/constants/blog";
import { BlogCard } from "./BlogCard";
import type { BlogCategory } from "@/lib/constants/blog/schema";

const categories: Array<BlogCategory | "All"> = [
  "All",
  "CRM Tips",
  "AI & Automation",
  "Business Growth",
  "Product Updates",
];

const POSTS_PER_PAGE = 6;

export function BlogPageContent() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return blogPosts;
    return blogPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filtered.slice(start, start + POSTS_PER_PAGE);
  }, [filtered, currentPage]);

  const featured = blogPosts.find((p) => p.featured);

  function handleCategoryChange(cat: BlogCategory | "All") {
    setActiveCategory(cat);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    document.getElementById("all-posts-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-enterprise-midnight">
      {/* Hero */}
      <section
        aria-labelledby="blog-hero-heading"
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
              Resources
            </p>
            <h1
              id="blog-hero-heading"
              className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl"
            >
              From the{" "}
              <span className="text-enterprise-amber">ExcelBees Blog</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              CRM strategies, AI automation tips, and business growth insights tailored
              to Australian SMBs. No fluff — just what your team can actually use tomorrow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section
          aria-labelledby="featured-post-heading"
          className="bg-enterprise-surface py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
              Featured Article
            </p>
            <motion.a
              href={`/blog/${featured.slug}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="group grid gap-8 rounded-2xl border border-enterprise-border bg-enterprise-midnight p-8 transition-all hover:border-enterprise-amber/30 hover:shadow-xl hover:shadow-enterprise-amber/5 lg:grid-cols-[1fr_auto] lg:items-center"
              aria-labelledby="featured-post-heading"
            >
              <div>
                <span className="mb-3 inline-block rounded-full bg-enterprise-amber/10 px-3 py-1 text-[10px] font-semibold text-enterprise-amber">
                  {featured.category}
                </span>
                <h2
                  id="featured-post-heading"
                  className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-enterprise-amber sm:text-3xl"
                >
                  {featured.title}
                </h2>
                <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{featured.author}</span>
                  <span>·</span>
                  <span>{featured.readTimeMinutes} min read</span>
                  <span>·</span>
                  <span>
                    {new Date(featured.publishedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-enterprise-amber/30 bg-enterprise-amber/10 px-5 py-2.5 text-sm font-semibold text-enterprise-amber transition-colors group-hover:bg-enterprise-amber/20 lg:shrink-0">
                Read Article
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.a>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section
        id="all-posts-section"
        aria-labelledby="all-posts-heading"
        className="bg-enterprise-midnight py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category filter */}
          <div className="mb-10 flex flex-wrap items-center gap-2" role="group" aria-label="Filter articles by category">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "border-enterprise-amber bg-enterprise-amber/10 text-enterprise-amber"
                    : "border-enterprise-border text-muted-foreground hover:border-enterprise-amber/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <h2 id="all-posts-heading" className="sr-only">
            All articles
          </h2>

          {filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">
              No articles in this category yet — check back soon.
            </p>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map((post, index) => (
                  <a key={post.id} href={`/blog/${post.slug}`} className="contents" tabIndex={-1}>
                    <BlogCard post={post} index={index} />
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Blog pagination"
                  className="mt-14 flex items-center justify-between gap-4"
                >
                  {/* Post count */}
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Showing{" "}
                    <span className="text-foreground">
                      {(currentPage - 1) * POSTS_PER_PAGE + 1}–
                      {Math.min(currentPage * POSTS_PER_PAGE, filtered.length)}
                    </span>{" "}
                    of <span className="text-foreground">{filtered.length}</span> articles
                  </p>

                  {/* Controls */}
                  <div className="flex items-center gap-1 mx-auto sm:mx-0">
                    {/* Prev */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-enterprise-border text-muted-foreground transition-all hover:border-enterprise-amber/50 hover:text-enterprise-amber disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isActive = page === currentPage;
                      const isNearCurrent =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;

                      if (!isNearCurrent) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span
                              key={page}
                              className="inline-flex h-9 w-9 items-center justify-center text-xs text-muted-foreground"
                            >
                              …
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          aria-label={`Page ${page}`}
                          aria-current={isActive ? "page" : undefined}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                            isActive
                              ? "border-enterprise-amber bg-enterprise-amber/10 text-enterprise-amber"
                              : "border-enterprise-border text-muted-foreground hover:border-enterprise-amber/50 hover:text-foreground"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-enterprise-border text-muted-foreground transition-all hover:border-enterprise-amber/50 hover:text-enterprise-amber disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
