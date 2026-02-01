import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { ExportRequest } from "@/types/blog-writer";

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { blogId, format, userId } = body;

    if (!userId || !blogId) {
      return NextResponse.json(
        { error: "User ID and Blog ID required" },
        { status: 400 }
      );
    }

    // Get blog from database
    const blogDoc = await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .get();

    if (!blogDoc.exists) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blog = blogDoc.data();

    if (!blog) {
      return NextResponse.json({ error: "Blog data not found" }, { status: 404 });
    }

    const { title, content, description, tags, primaryKeyword, secondaryKeywords } = blog;

    switch (format) {
      case "markdown": {
        // Convert HTML to Markdown
        let markdown = `# ${title}\n\n`;
        markdown += `**Meta Description:** ${description}\n\n`;
        markdown += `**Primary Keyword:** ${primaryKeyword}\n`;
        markdown += `**Secondary Keywords:** ${secondaryKeywords?.join(", ") || "None"}\n`;
        markdown += `**Tags:** ${tags?.join(", ") || "None"}\n\n`;
        markdown += `---\n\n`;

        // Simple HTML to Markdown conversion
        let mdContent = content
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
          .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n")
          .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
          .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
          .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
          .replace(/<ul[^>]*>/gi, "\n")
          .replace(/<\/ul>/gi, "\n")
          .replace(/<ol[^>]*>/gi, "\n")
          .replace(/<\/ol>/gi, "\n")
          .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
          .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n")
          .replace(/<[^>]*>/g, ""); // Remove remaining HTML tags

        markdown += mdContent;

        return NextResponse.json({
          content: markdown,
          filename: `${blog.slug}.md`,
        });
      }

      case "html": {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${primaryKeyword}, ${secondaryKeywords?.join(", ")}">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; }
        h3 { font-size: 1.4em; margin-top: 1.2em; }
        p { margin: 1em 0; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 1.5em 0;
            font-style: italic;
            color: #555;
        }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        .meta {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 1px solid #ecf0f1;
        }
    </style>
</head>
<body>
    <article>
        <h1>${title}</h1>
        <div class="meta">
            <p><strong>Keywords:</strong> ${primaryKeyword}${secondaryKeywords?.length ? ", " + secondaryKeywords.join(", ") : ""}</p>
            ${tags?.length ? `<p><strong>Tags:</strong> ${tags.join(", ")}</p>` : ""}
        </div>
        ${content}
    </article>
</body>
</html>`;

        return NextResponse.json({
          content: html,
          filename: `${blog.slug}.html`,
        });
      }

      case "txt": {
        // Plain text export
        let text = `${title}\n${"=".repeat(title.length)}\n\n`;
        text += `${description}\n\n`;
        text += `Primary Keyword: ${primaryKeyword}\n`;
        text += `Secondary Keywords: ${secondaryKeywords?.join(", ") || "None"}\n`;
        text += `Tags: ${tags?.join(", ") || "None"}\n\n`;
        text += `${"=".repeat(50)}\n\n`;

        // Strip HTML tags
        const plainContent = content
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n$1\n" + "-".repeat(40) + "\n")
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n$1\n")
          .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
          .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
          .replace(/<[^>]*>/g, "");

        text += plainContent;

        return NextResponse.json({
          content: text,
          filename: `${blog.slug}.txt`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid export format" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error exporting blog:", error);
    return NextResponse.json(
      { error: "Failed to export blog" },
      { status: 500 }
    );
  }
}
