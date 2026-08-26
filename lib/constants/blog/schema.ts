export type BlogCategory =
  | "CRM Tips"
  | "AI & Automation"
  | "Business Growth"
  | "Product Updates";

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "code"; language: string; content: string };

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: BlogBlock[];
  category: BlogCategory;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  /** Full-width hero image shown at the top of the post page */
  coverImageUrl?: string;
  /** Large featured image for the post detail page (1200×630) */
  mainImage?: string;
  /** Card thumbnail used in blog listing and related posts (800×450) */
  thumbnail?: string;
  featured?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}
