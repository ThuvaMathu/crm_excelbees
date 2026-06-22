"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User, Tag } from "lucide-react";
import type { BlogPost, BlogBlock } from "@/lib/constants/blog/schema";
import { blogPosts, BLOG_AUTHOR } from "@/lib/constants/blog";
import { BlogCard } from "./BlogCard";

interface Props {
  post: BlogPost;
}

function RenderBlock({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "heading":
      if (block.level === 2) {
        return (
          <h2 className="mb-4 mt-10 text-2xl font-bold text-white sm:text-3xl">
            {block.text}
          </h2>
        );
      }
      return (
        <h3 className="mb-3 mt-8 text-xl font-semibold text-white">
          {block.text}
        </h3>
      );

    case "paragraph":
      return (
        <p className="mb-5 text-base leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );

    case "list":
      return block.ordered ? (
        <ol className="mb-5 ml-5 list-decimal space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="text-base leading-relaxed text-muted-foreground">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mb-5 ml-5 list-disc space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="text-base leading-relaxed text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      );

    case "blockquote":
      return (
        <blockquote className="mb-5 rounded-r-xl border-l-4 border-enterprise-amber bg-enterprise-midnight/60 py-4 pl-5 pr-4">
          <p className="text-sm leading-relaxed text-foreground italic">{block.text}</p>
        </blockquote>
      );

    case "code":
      return (
        <pre className="mb-5 overflow-x-auto rounded-xl bg-enterprise-midnight p-4 text-xs text-muted-foreground">
          <code>{block.content}</code>
        </pre>
      );

    case "image":
      return (
        <figure className="mb-5">
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            className="w-full rounded-xl"
            width={800}
            height={450}
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-xs text-muted-foreground/70">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

const categoryColors: Record<string, string> = {
  "CRM Tips": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "AI & Automation": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Business Growth": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Product Updates": "text-enterprise-amber bg-enterprise-amber/10 border-enterprise-amber/20",
};

export function BlogPostContent({ post }: Props) {
  const related = blogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const colorClass =
    categoryColors[post.category] ?? "text-muted-foreground bg-muted border-border";

  return (
    <div className="bg-enterprise-midnight">
      {/* Back nav */}
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Blog
        </Link>
      </div>

      {/* Article header */}
      <header className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className={`mb-4 inline-block rounded-full border px-3 py-1 text-[10px] font-semibold ${colorClass}`}
          >
            {post.category}
          </span>
          <h1 className="mb-5 text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl">
            {post.title}
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 border-b border-enterprise-border pb-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {BLOG_AUTHOR.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {post.readTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              {post.category}
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Article tags">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-enterprise-border bg-enterprise-surface px-3 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </header>

      {/* Main image hero */}
      {(post.mainImage ?? post.coverImageUrl) && (
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-enterprise-border aspect-[1200/630]">
            <img
              src={post.mainImage ?? post.coverImageUrl}
              alt={post.title}
              loading="eager"
              decoding="async"
              width={1200}
              height={630}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article body */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8"
        aria-label={post.title}
      >
        {post.content.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </motion.article>

      {/* Author card */}
      <div className="border-y border-enterprise-border bg-enterprise-surface">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-enterprise-amber/10 text-sm font-bold text-enterprise-amber"
              aria-hidden="true"
            >
              {BLOG_AUTHOR.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{BLOG_AUTHOR.name}</p>
              <p className="mt-0.5 text-xs font-medium text-enterprise-amber">{BLOG_AUTHOR.role}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground max-w-xl">
                {BLOG_AUTHOR.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-posts-heading"
          className="bg-enterprise-midnight py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="related-posts-heading"
              className="mb-8 text-2xl font-bold text-white"
            >
              Related Articles
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relPost, index) => (
                <a key={relPost.id} href={`/blog/${relPost.slug}`} className="contents" tabIndex={-1}>
                  <BlogCard post={relPost} index={index} />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        aria-labelledby="blog-post-cta-heading"
        className="border-t border-enterprise-border bg-enterprise-surface py-20"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-enterprise-amber">
            Ready to get started?
          </p>
          <h2
            id="blog-post-cta-heading"
            className="mb-4 text-3xl font-bold text-white"
          >
            See RCRM in Action
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Book a free, personalised demo and see how RCRM can solve the challenges
            described in this article for your Australian business.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-enterprise-amber px-8 text-sm font-semibold text-black shadow-lg shadow-enterprise-amber/25 transition-all hover:bg-amber-500 hover:-translate-y-0.5 hover:shadow-enterprise-amber/40"
          >
            Book a Free Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
