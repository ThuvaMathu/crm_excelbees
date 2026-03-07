# LLM Usage Directory

This document tracks all instances of Large Language Models (LLMs) used across the project, mapping their purpose to specific API routes.

## Core Infrastructure

| File | Purpose | Model(s) |
|------|---------|-----------|
| `services/ai/gemini-provider.ts` | Centralized Google Generative AI initialization and generic wrapper functions (`generateJSON`, `generateText`). | `gemini-2.5-pro`, `gemini-2.5-flash` |
| `lib/ai/service.ts` | Core service wrapper for general AI interactions (being migrated to use `gemini-provider.ts`). | `gemini-2.5-flash` |

## Marketing Tools

| Route | Purpose | Model | Output Format |
|-------|---------|-------|---------------|
| `app/api/marketing/generate-insights/route.ts` | Generates a comprehensive competitive intelligence report. | `gemini-2.5-pro` | Strict JSON Schema (`ReportSections`) |
| `app/api/marketing/analyze-user-business/route.ts` | Analyzes the user's business profile and offerings. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/marketing/analyze-competitor-content/route.ts` | Extracts deep insights from competitor content metadata. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/marketing/discover-competitors/route.ts` | Automatically discovers potential competitors based on the business profile. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/marketing/ai/generate-email/route.ts` | Generates marketing email sequences based on a prompt context. | `gemini-2.5-flash` | Plain Text/Markdown |

## Keyword Research Tools

| Route | Purpose | Model | Output Format |
|-------|---------|-------|---------------|
| `app/api/keyword/extract-page-content/route.ts` | Quickly extracts relevant text features from scraped pages. | `gemini-2.5-flash` | Strict JSON Schema |
| `app/api/keyword/extract-business-context/route.ts` | Derives core business offerings from website text. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/keyword/extract-keywords/route.ts` | Extracts raw keywords from various page texts. | `gemini-2.5-flash` | Strict JSON Schema |
| `app/api/keyword/enrich-keywords/route.ts` | Categorizes and enriches the raw keywords with intent and difficulty. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/keyword/aggregate-keywords/route.ts` | Aggregates duplicate/similar keywords into unique entities. | `gemini-2.5-flash` | Strict JSON Schema |
| `app/api/keyword/finalize-selection/route.ts` | Finalizes the "best" keyword list based on volume and relevance. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/keyword/discover-sitemaps/route.ts` | Discovers valid sitemaps to crawl based on root URLs. | `gemini-2.5-flash` | Strict JSON Schema |
| `app/api/keyword/identify-competitors/route.ts` | Identifies primary competitors and overlaps for keyword targeting. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/keyword/generate-insights/route.ts` | Generates final SEO recommendations based on the keyword list. | `gemini-2.5-pro` | Strict JSON Schema |

## Blog Writer

| Route | Purpose | Model | Output Format |
|-------|---------|-------|---------------|
| `app/api/blog-writer/generate-outline/route.ts` | Generates an SEO-optimized blog outline structure. | `gemini-2.5-pro` | Strict JSON Schema |
| `app/api/blog-writer/generate-content/route.ts` | Generates the actual blog body paragraphs and content. | `gemini-2.5-pro` | Plain Text/Markdown |
| `app/api/blog-writer/ai-assist/route.ts` | On-the-fly AI assistance for modifying existing blog paragraphs. | `gemini-2.5-flash` | Plain Text |

## Calendar Generation

| Route | Purpose | Model | Output Format |
|-------|---------|-------|---------------|
| `app/api/calendar/ai-generate/route.ts` | Generates daily calendar events based on high-level promotional goals. | `gemini-2.5-flash` | Strict JSON Schema |
