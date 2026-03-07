# LLM Usage in ExcelBees CRM

This document tracks all Artificial Intelligence large language model (LLM) usages across the project. As of March 2026, the project has been fully migrated from OpenAI (`gpt-4o`/`gpt-3.5`) to Google Gemini (`gemini-2.5-pro`/`gemini-2.5-flash`).

## AI Strategy

Our strategy leverages a hybrid model approach:
- **`gemini-2.5-pro`**: Used for deep reasoning, complex analysis, and high-quality content generation. It powers core business strategy insights and detailed extractions.
- **`gemini-2.5-flash`**: Used for speed, efficiency, and routine tasks. It handles keyword embeddings, data clustering labeling, simple text extraction, and quick drafting.

## Strict JSON Schema Enforcement

All structured outputs rely on Gemini's `responseSchema` mechanism. This guarantees type-safe JSON returns that match our TypeScript interfaces, eliminating the need for error-prone raw JSON parsing.

## Implemented Use Cases

### 1. Marketing Tools
- **Analyze User Business** (`pro`): Scrapes user website to extract a structured business profile (`industry`, `targetAudience`, etc.).
- **Discover Competitors** (`pro`): Validates and generates relevant competitor domains dynamically.
- **Analyze Competitor Content** (`pro`): Scrapes and evaluates competitor pages to identify strengths, weaknesses, and pricing models.
- **Generate Insights** (`pro`): Produces a comprehensive, multi-section strategy report detailing market opportunities and competitive threats.
- **Generate Email Copy** (`flash`): Quickly drafts marketing email subject lines and body content.

### 2. Keyword Intelligence
- **Extract Page Content** (`flash`): Analyzes site pages to extract baseline SEO metadata (H1s, topics).
- **Extract Business Context** (`pro`): deeply infers business services from landing pages.
- **Extract Keywords** (`flash`): Identifies primary and secondary search intents from text.
- **Enrich Keywords** (`pro`): Attaches search metrics, difficulty, and trends to keywords.
- **Aggregate Keywords** (`flash`): Groups keywords dynamically into topic families.
- **Finalize Selection** (`pro`): Determines strategic value and selects the best keywords to target.
- **Strategy Insights** (`pro`): Builds an SEO execution plan based on selected clusters.

### 3. Content Creation
- **Blog Writer - Outline** (`pro`): Plans structured blog headings (H2, H3), identifying search intent and estimated word count.
- **Blog Writer - Generate** (`pro`): Writes high-quality, long-form blog content tailored to the outline.
- **Blog Writer - Assist** (`flash`): Quick-action AI edits to selected text (e.g. summarize, expand, fix grammar).

### 4. Planning & Scheduling
- **Calendar Event Generation** (`flash`): Auto-generates structured calendar plans (marketing schedules, publishing timelines).

## Extensibility

New AI features should utilize the `GeminiProvider` exported from `services/ai/gemini-provider.ts` and the `AIProviderFactory` from `services/ai/provider-factory.ts`. Always define a strong JSON schema (`import { Schema, SchemaType } from "@google/generative-ai"`) when structured output is expected.
