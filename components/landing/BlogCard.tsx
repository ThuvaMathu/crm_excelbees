"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/constants/blog/schema";

const categoryColors: Record<string, string> = {
  "CRM Tips": "text-blue-400 bg-blue-400/10",
  "AI & Automation": "text-purple-400 bg-purple-400/10",
  "Business Growth": "text-emerald-400 bg-emerald-400/10",
  "Product Updates": "text-enterprise-amber bg-enterprise-amber/10",
};

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  const colorClass = categoryColors[post.category] ?? "text-muted-foreground bg-muted";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true, margin: "-80px" }}
      className="group flex flex-col rounded-2xl border border-enterprise-border bg-enterprise-surface overflow-hidden transition-all duration-300 hover:border-enterprise-amber/30 hover:shadow-xl hover:shadow-enterprise-amber/5 hover:-translate-y-1"
    >
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-enterprise-slate via-enterprise-midnight to-enterprise-slate">
        {(post.thumbnail ?? post.coverImageUrl) ? (
          <img
            src={post.thumbnail ?? post.coverImageUrl}
            alt={post.title}
            loading="lazy"
            decoding="async"
            width={800}
            height={450}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-enterprise-border/30 select-none group-hover:text-enterprise-border/50 transition-colors">
              {post.category.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-enterprise-midnight/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${colorClass}`}
          >
            {post.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-enterprise-amber transition-colors">
          {post.title}
        </h3>
        <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-enterprise-border/60 bg-enterprise-midnight px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-enterprise-border/50 pt-4">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTimeMinutes} min read
            </span>
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <button
            aria-label={`Read ${post.title}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-enterprise-amber hover:text-amber-400 transition-colors"
          >
            Read More
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
