import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, BLOG_AUTHOR } from "@/lib/constants/blog";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BlogPostContent } from "@/components/landing/BlogPostContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Article Not Found" };

  const metaTitle = post.seoTitle ?? `${post.title} — ExcelBees Blog`;
  const metaDescription = post.seoDescription ?? post.excerpt;
  const ogImage = post.mainImage ?? post.coverImageUrl ?? "/og-image.png";
  const keywords = post.tags
    ? [...post.tags, "CRM Australia", "RCRM ExcelBees"]
    : [post.category, "CRM tips Australia", "Australian business", "RCRM ExcelBees"];

  return {
    title: metaTitle,
    description: metaDescription,
    keywords,
    authors: [{ name: BLOG_AUTHOR.name }],
    alternates: { canonical: `https://excelbees.com.au/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "en_AU",
      url: `https://excelbees.com.au/blog/${post.slug}`,
      siteName: "RCRM by ExcelBees",
      title: metaTitle,
      description: metaDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt,
      authors: [BLOG_AUTHOR.name],
      tags: post.tags ?? [post.category, "CRM", "Australia"],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://excelbees.com.au/blog/${post.slug}`,
    url: `https://excelbees.com.au/blog/${post.slug}`,
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    keywords: post.tags?.join(", "),
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: "en-AU",
    ...((post.mainImage ?? post.coverImageUrl) && {
      image: {
        "@type": "ImageObject",
        url: `https://excelbees.com.au${post.mainImage ?? post.coverImageUrl}`,
        width: 1200,
        height: 630,
      },
    }),
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      jobTitle: BLOG_AUTHOR.role,
      worksFor: {
        "@type": "Organization",
        "@id": "https://excelbees.com.au/#organization",
        name: "ExcelBees",
      },
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://excelbees.com.au/#organization",
      name: "ExcelBees",
      logo: { "@type": "ImageObject", url: "https://excelbees.com.au/logo.png" },
    },
    isPartOf: {
      "@type": "Blog",
      "@id": "https://excelbees.com.au/blog",
      name: "ExcelBees CRM Blog",
    },
    articleSection: post.category,
    timeRequired: `PT${post.readTimeMinutes}M`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://excelbees.com.au/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="min-h-screen bg-enterprise-midnight">
        <Navbar />
        <main id="main-content">
          <BlogPostContent post={post} />
        </main>
        <Footer />
      </div>
    </>
  );
}
