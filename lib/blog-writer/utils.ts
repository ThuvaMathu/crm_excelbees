import { BlogConfiguration, BlogOutline, KeywordUsage } from "@/types/blog-writer";

// ============================================================================
// PROMPT GENERATION FOR OUTLINE
// ============================================================================

export function getOutlineGenerationPrompt(
  primaryKeyword: string,
  secondaryKeywords: string[],
  config: BlogConfiguration
): string {
  return `You are an expert SEO content strategist and blog writer.

Create a comprehensive blog outline optimized for:

PRIMARY KEYWORD: ${primaryKeyword}
SECONDARY KEYWORDS: ${secondaryKeywords.join(", ")}

CONTENT SPECIFICATIONS:
- Target Reading Time: ${config.readingTime} minutes (~${config.wordCount} words)
- Content Depth: ${config.contentDepth}
- Target Audience: ${config.targetAudience}
- Reader Knowledge: ${config.readerKnowledge} level
- Reader Intent: ${config.readerIntent}
- Primary Goal: ${config.primaryGoal}

WRITING STYLE:
- Tone: ${config.tone}
- Formality: ${config.formalityLevel}/10
- Pronoun Use: ${config.pronounUse} person
- Technical Level: ${config.technicalLevel}
- Voice: ${config.voicePersonality.join(", ")}

STRUCTURE REQUIREMENTS:
- Introduction Style: ${config.introStyle}
- Paragraph Structure: ${config.paragraphStructure}
- List Usage: ${config.listUsage}
- Heading Frequency: ${config.headingFrequency}

INCLUDE THESE ELEMENTS:
${config.contentElements.join(", ")}

SEO OPTIMIZATION:
- Keyword Strategy: ${config.keywordOptimization}
- Internal Links: ${config.internalLinking ? "Include suggestions" : "None"}
- External Sources: ${config.externalLinkingStrategy}
- Target Readability: ${config.targetReadabilityScore} Flesch score

CTAs:
- Frequency: ${config.ctaFrequency}
- Type: ${config.ctaType.join(", ")}
- Tone: ${config.ctaTone}

VISUAL CONTENT:
- Image Density: ${config.imageDensity}
- Image Types: ${config.imageTypes.join(", ")}
${config.generateAIPrompts ? "- Generate detailed AI image prompts for each placeholder" : ""}

Generate a detailed blog outline as JSON with this exact structure:
{
  "workingTitle": "SEO-optimized, compelling title",
  "slug": "url-friendly-slug",
  "metaDescription": "150-155 character meta description",
  "sections": [
    {
      "section": "Introduction",
      "heading": "H2 heading text",
      "purpose": "Purpose of this section",
      "subheadings": [
        {
          "heading": "H3 heading text",
          "keyPoints": ["point 1", "point 2"],
          "estimatedWordCount": 200,
          "keywordsToInclude": ["keyword1"],
          "imageNeeded": true,
          "imageDescription": "Description of image needed"
        }
      ],
      "estimatedWordCount": 400,
      "transitionToNext": "Transition sentence to next section"
    }
  ],
  "seoStrategy": {
    "primaryKeywordPlacement": ["title", "first-paragraph", "h2-headings"],
    "secondaryKeywordDistribution": {"keyword1": 3, "keyword2": 2},
    "targetKeywordDensity": "1.5-2%",
    "internalLinkOpportunities": ["Link text to /page"],
    "externalSourceTypes": ["industry-publications", "research-papers"]
  },
  "ctaPlacement": [
    {
      "location": "After section 2",
      "type": "newsletter",
      "suggestedText": "CTA text"
    }
  ],
  "visualContent": [
    {
      "location": "After introduction",
      "type": "featured-image",
      "description": "Image description",
      "aiImagePrompt": "Detailed 100-150 word prompt for AI image generation"
    }
  ],
  "mainImageAIPrompt": "150-200 word detailed prompt for main featured image",
  "contentStrategy": "Overall content strategy explanation",
  "uniqueAngle": "What makes this content unique",
  "estimatedMetrics": {
    "totalWordCount": ${config.wordCount},
    "readingTime": ${config.readingTime},
    "numberOfHeadings": 12,
    "numberOfImages": 6,
    "numberOfCTAs": 2
  }
}`;
}

// ============================================================================
// PROMPT GENERATION FOR CONTENT
// ============================================================================

export function getContentGenerationPrompt(
  outline: BlogOutline,
  config: BlogConfiguration,
  primaryKeyword: string,
  secondaryKeywords: string[]
): string {
  return `You are an expert blog writer creating high-quality content.

Write a complete blog post based on this detailed outline:

BLOG DETAILS:
Title: ${outline.workingTitle}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}

DETAILED OUTLINE:
${JSON.stringify(outline.sections, null, 2)}

SEO STRATEGY:
${JSON.stringify(outline.seoStrategy, null, 2)}

WRITING REQUIREMENTS:
1. Follow outline structure exactly
2. Write in ${config.tone} tone with ${config.formalityLevel}/10 formality
3. Target ${config.targetAudience} with ${config.readerKnowledge} level
4. Use ${config.pronounUse} person perspective
5. Write ${config.paragraphStructure} paragraphs
6. Target word count: ${config.wordCount} words (±10%)
7. Target readability: ${config.targetReadabilityScore} Flesch
8. Use primary keyword naturally throughout
9. Include secondary keywords where relevant
10. Add smooth transition sentences between sections
11. Place CTAs at specified locations
12. Include all requested content elements
13. Mark image locations: <!--IMAGE: description-->
14. For citations: [Source: description](placeholder-url)

CONTENT DEPTH GUIDELINES:
- ${config.contentDepth === "overview" ? "High-level summary, touch main points" : ""}
- ${config.contentDepth === "detailed" ? "Comprehensive, examples, actionable advice" : ""}
- ${config.contentDepth === "expert" ? "Deep technical, research-backed, data-driven" : ""}

READABILITY REQUIREMENTS:
- Average sentence length: ${config.sentenceLength === "short" ? "10-15" : config.sentenceLength === "medium" ? "15-20" : "varied"} words
- Use headings every ${config.headingFrequency === "frequent" ? "150-200" : config.headingFrequency === "standard" ? "250-350" : "400+"} words
- ${config.listUsage} use of lists
- Include formatting: bold, italics, quotes as appropriate

OUTPUT FORMAT:
Return complete blog as HTML with semantic markup:
- <h2> for main sections
- <h3> for subsections
- <p> for paragraphs
- <ul>/<ol> for lists
- <strong> for emphasis
- <em> for italics
- <blockquote> for quotes
- <a href="#">link text</a> for link placeholders
- <!-- IMAGE: description --> for images
- <!-- CTA: type --> for CTAs

Write the complete blog content now:`;
}

// ============================================================================
// PROMPT GENERATION FOR AI ASSISTANCE
// ============================================================================

export function getAIAssistPrompt(
  action: string,
  selection: string,
  context: string,
  config: BlogConfiguration,
  mode: "generate" | "improve"
): string {
  const baseContext = `
Tone: ${config.tone}
Formality: ${config.formalityLevel}/10
Technical Level: ${config.technicalLevel}
Target Audience: ${config.targetAudience}
`;

  const outputInstruction =
    mode === "generate"
      ? "IMPORTANT: You must return the ORIGINAL text provided below, followed immediately by your generated content. Do not modify the original text. The output should be a continuous piece of content. REQUIRED FORMAT: Return the response as valid HTML using tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc. Do not use Markdown."
      : "IMPORTANT: Return ONLY the improved version of the text. Do not include the original text or any explanations. REQUIRED FORMAT: Return the response as valid HTML using tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc. Do not use Markdown.";

  let specificPrompt = "";

  switch (action) {
    case "continue":
      specificPrompt = `Continue writing from this point:\n\n${selection}\n\nContext: ${context}\n\nWrite the next 2-3 paragraphs maintaining the same style and flow.`;
      break;
    case "rewrite":
      specificPrompt = `Rewrite this text to improve clarity and engagement:\n\n${selection}\n\nMaintain the same key points but make it more compelling.`;
      break;
    case "expand":
      specificPrompt = `Expand this section with more detail and examples:\n\n${selection}\n\nAdd 2-3 more paragraphs with specific examples and actionable advice.`;
      break;
    case "simplify":
      specificPrompt = `Simplify this text for better readability:\n\n${selection}\n\nMake it easier to understand while keeping the key information.`;
      break;
    case "add_examples":
      specificPrompt = `Add 2-3 relevant examples to this section:\n\n${selection}\n\nContext: ${context}\n\nProvide concrete, real-world examples that illustrate the points.`;
      break;
    case "add_statistics":
      specificPrompt = `Add relevant statistics and data points to this section:\n\n${selection}\n\nContext: ${context}\n\nInclude credible statistics that support the content. Format as: [Statistic](source-placeholder)`;
      break;
    case "add_faq":
      specificPrompt = `Generate 5-7 frequently asked questions related to this content:\n\n${selection}\n\nContext: ${context}\n\nProvide questions and detailed answers in HTML format with <h3> for questions and <p> for answers.`;
      break;
    case "improve_readability":
      specificPrompt = `Improve the readability of this text:\n\n${selection}\n\nTarget Flesch score: ${config.targetReadabilityScore}\n\nUse shorter sentences, simpler words, and better structure.`;
      break;
    case "make_engaging":
      specificPrompt = `Make this text more engaging and compelling:\n\n${selection}\n\nAdd hooks, interesting transitions, and make it more captivating to read.`;
      break;
    case "add_transitions":
      specificPrompt = `Add smooth transition sentences between these sections:\n\n${selection}\n\nCreate natural flow from one topic to the next.`;
      break;
    case "seo_optimize":
      specificPrompt = `Optimize this text for SEO:\n\n${selection}\n\nContext: ${context}\n\nImprove keyword placement and density while maintaining natural flow.`;
      break;
    case "add_ctas":
      specificPrompt = `Add ${config.ctaFrequency === "multiple" ? "2-3" : "1"} call-to-action(s) to this section:\n\n${selection}\n\nCTA Type: ${config.ctaType.join(", ")}\nCTA Tone: ${config.ctaTone}\n\nCreate compelling CTAs that fit naturally in the content.`;
      break;
    default:
      specificPrompt = `Perform the following action: ${action}\n\nOn this text:\n\n${selection}`;
  }

  return `${baseContext}\n\n${outputInstruction}\n\n${specificPrompt}`;
}

// ============================================================================
// SEO ANALYSIS FUNCTIONS
// ============================================================================

export function calculateKeywordDensity(
  content: string,
  keyword: string
): number {
  const words = content.toLowerCase().split(/\s+/).length;
  const keywordOccurrences = (
    content.toLowerCase().match(new RegExp(keyword.toLowerCase(), "g")) || []
  ).length;
  return (keywordOccurrences / words) * 100;
}

export function analyzeKeywordUsage(
  content: string,
  title: string,
  primaryKeyword: string,
  secondaryKeywords: string[]
): KeywordUsage {
  const lowerContent = content.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const firstParagraph = content.split("</p>")[0] || "";

  // Primary keyword analysis
  const primaryCount = (
    lowerContent.match(new RegExp(primaryKeyword.toLowerCase(), "g")) || []
  ).length;
  const primaryDensity = calculateKeywordDensity(content, primaryKeyword);

  // Check headings
  const headings = content.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
  const headingsText = headings.join(" ").toLowerCase();
  const primaryInHeadings = (
    headingsText.match(new RegExp(primaryKeyword.toLowerCase(), "g")) || []
  ).length;

  // Secondary keywords analysis
  const secondary = secondaryKeywords.map((keyword) => ({
    keyword,
    count: (lowerContent.match(new RegExp(keyword.toLowerCase(), "g")) || [])
      .length,
    density: calculateKeywordDensity(content, keyword),
  }));

  return {
    primary: {
      count: primaryCount,
      density: primaryDensity,
      inTitle: lowerTitle.includes(primaryKeyword.toLowerCase()),
      inFirstParagraph: firstParagraph
        .toLowerCase()
        .includes(primaryKeyword.toLowerCase()),
      inHeadings: primaryInHeadings,
    },
    secondary,
  };
}

// ============================================================================
// READABILITY SCORING (Flesch Reading Ease)
// ============================================================================

export function calculateReadabilityScore(content: string): number {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, " ");

  // Count sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    .length;

  // Count words
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;

  // Count syllables (simplified)
  const syllables = text
    .toLowerCase()
    .split(/\s+/)
    .reduce((count, word) => {
      return count + countSyllables(word);
    }, 0);

  if (sentences === 0 || words === 0) return 0;

  // Flesch Reading Ease formula
  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

  return Math.max(0, Math.min(100, score));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;

  const vowels = "aeiouy";
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith("e")) {
    count--;
  }

  return Math.max(1, count);
}

// ============================================================================
// SEO SCORE CALCULATION
// ============================================================================

export function calculateSEOScore(
  content: string,
  title: string,
  description: string,
  primaryKeyword: string,
  secondaryKeywords: string[],
  config: BlogConfiguration
): number {
  let score = 0;

  // Keyword usage (30 points)
  const keywordUsage = analyzeKeywordUsage(
    content,
    title,
    primaryKeyword,
    secondaryKeywords
  );

  if (keywordUsage.primary.inTitle) score += 5;
  if (keywordUsage.primary.inFirstParagraph) score += 5;
  if (keywordUsage.primary.inHeadings > 0) score += 5;
  if (
    keywordUsage.primary.density >= 1 &&
    keywordUsage.primary.density <= 3
  )
    score += 10;
  if (keywordUsage.secondary.filter((k) => k.count > 0).length >= 2)
    score += 5;

  // Content structure (20 points)
  const headings = content.match(/<h[2-3][^>]*>/gi) || [];
  if (headings.length >= 5) score += 10;

  const paragraphs = content.match(/<p>/gi) || [];
  if (paragraphs.length >= 10) score += 5;

  const lists = content.match(/<[uo]l>/gi) || [];
  if (lists.length >= 2) score += 5;

  // Readability (20 points)
  const readability = calculateReadabilityScore(content);
  if (readability >= 60) score += 20;
  else if (readability >= 50) score += 15;
  else if (readability >= 40) score += 10;

  // Links (15 points)
  const internalLinks = content.match(/<a[^>]*href="\/[^"]*"/gi) || [];
  const externalLinks = content.match(/<a[^>]*href="http[^"]*"/gi) || [];

  if (internalLinks.length >= 3) score += 8;
  else if (internalLinks.length >= 1) score += 4;

  if (externalLinks.length >= 3) score += 7;
  else if (externalLinks.length >= 1) score += 3;

  // Meta (15 points)
  if (description.length >= 150 && description.length <= 160) score += 8;
  else if (description.length >= 140 && description.length <= 170) score += 5;

  if (description.toLowerCase().includes(primaryKeyword.toLowerCase()))
    score += 7;

  return Math.min(100, score);
}

// ============================================================================
// CONTENT STRUCTURE ANALYSIS
// ============================================================================

export function analyzeContentStructure(content: string) {
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
  const h4Count = (content.match(/<h4[^>]*>/gi) || []).length;
  const paragraphCount = (content.match(/<p>/gi) || []).length;
  const listCount = (content.match(/<[uo]l>/gi) || []).length;
  const internalLinkCount = (content.match(/<a[^>]*href="\/[^"]*"/gi) || [])
    .length;
  const externalLinkCount = (content.match(/<a[^>]*href="http[^"]*"/gi) || [])
    .length;

  return {
    headings: { h2: h2Count, h3: h3Count, h4: h4Count },
    paragraphs: paragraphCount,
    lists: listCount,
    links: { internal: internalLinkCount, external: externalLinkCount },
  };
}

// ============================================================================
// WORD COUNT
// ============================================================================

export function countWords(content: string): number {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, " ");
  // Count words
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  return words.length;
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
