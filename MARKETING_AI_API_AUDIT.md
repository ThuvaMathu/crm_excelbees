# Marketing AI - Google Places API Audit

## Overview
This document audits the usage of the Google Places API within the Marketing AI module of the CRM application. The audit identifies where the API is called, how the data flows, and suggests strategies for migrating to Gemini.

## 1. Services Layer

**File Path:** `services/googlePlaces.ts` → `services/competitorDiscovery.ts`
**Section/Component:** core Service
**Status:** ✅ **MIGRATED TO GEMINI**
**Current API Method:** `Text Search (REST)`, `Place Details (REST)`
**Replacement:**
- **NEW SERVICE:** `services/competitorDiscovery.ts` created using Gemini AI with Google Search Grounding
- **Prompt Strategy:** Uses structured prompts to extract Name, Website, Rating, ReviewCount, and Address from search results
- **Benefits:**
  - Single API call instead of multiple (Search + Details)
  - Natural language search support (e.g., "Top coffee shops with great ambiance in Brisbane")
  - No Google Places API key required (uses GEMINI_API_KEY)
  - Works for both local and global competitor discovery
- **Functions:**
  - `discoverCompetitors(industry, location, maxResults)` - Primary discovery function
  - `naturalLanguageSearch(query, maxResults)` - Flexible natural language queries
  - `isGeminiDiscoveryConfigured()` - Check configuration

## 2. API Routes

**File Path:** `app/api/marketing/discover-competitors/route.ts`
**Section/Component:** Competitor Discovery API
**Status:** ✅ **MIGRATED TO GEMINI**
**Changes:**
- Replaced import from `@/services/googlePlaces` to `@/services/competitorDiscovery`
- Updated function call from `discoverGooglePlaces()` to `discoverGeminiCompetitors()`
- Changed source label from `'google_places'` to `'gemini'`
- Removed geographic scope check (Gemini handles both local and global)
- Updated documentation comments

## 3. Frontend Components

**File Path:** `app/(dashboard)/marketing/competitors/[analysisId]/confirm/page.tsx`
**Section/Component:** Competitor Confirmation Page
**Status:** ✅ **MIGRATED TO GEMINI**
**Changes:**
- Updated badge display: `'google_places'` and `'gemini'` both show "AI Discovery"
- Maintains backward compatibility with existing data

## 4. Data Types

**File Path:** `types/competitor-analysis.ts`
**Section/Component:** Type Definitions
**Status:** ✅ **MIGRATED TO GEMINI**
**Changes:**
- Added `'gemini'` to `CompetitorSource` type
- Kept `'google_places'` for backward compatibility with existing data

---

## Sample Google API with Google Web Search Tool (Reference)

The migration follows this pattern for using Google Search grounding:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
  { model: "gemini-2.0-flash-exp" },
  { apiVersion: "v1beta" }
);

const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: "MODE_DYNAMIC",
          dynamicThreshold: 0.3,
        },
      },
    },
  ],
});
```



Sample Google API Example with google web search tool


import {
  GoogleGenAI,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const tools = [
    {
      googleSearch: {
      }
    },
  ];
  const config = {
    thinkingConfig: {
      thinkingBudget: 0,
    },
    tools,
  };
  const model = 'gemini-flash-lite-latest';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
