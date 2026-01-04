# Environment Variables Setup for Competitor Analysis

## Required Variables

Add these to your `.env.local` file:

```bash
# ============================================
# COMPETITOR ANALYSIS - NEW VARIABLES
# ============================================

# Google Places API (Optional but Recommended)
# Used for discovering local competitors
# Get your key from: https://console.cloud.google.com/
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Jina AI Reader (No key required for basic usage)
# Used for scraping competitor websites
JINA_AI_BASE_URL=https://r.jina.ai

# ============================================
# EXISTING VARIABLES (Already configured)
# ============================================

# OpenAI API (Already exists in your .env.local)
# Used for AI analysis and insights generation
OPENAI_API_KEY=your_openai_api_key_here
```

## Google Places API Setup Instructions

### Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it (e.g., "CRM Competitor Analysis")
4. Click "Create"

### Step 2: Enable Places API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

### Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key" (recommended)

### Step 4: Restrict API Key (Security Best Practice)

**API Restrictions:**
1. Under "API restrictions", select "Restrict key"
2. Check only:
   - Places API
   - Places API (New)
3. Click "Save"

**Application Restrictions (Optional):**
- For production, add HTTP referrer restrictions
- For development, you can leave unrestricted

### Step 5: Enable Billing

> **Important:** Google Places API requires billing to be enabled, but includes a generous free tier.

1. Go to "Billing" in Cloud Console
2. Link a billing account (or create new)
3. **Free Tier:** $200/month credit (covers ~10,000 competitor discoveries)

**Pricing:**
- Text Search: $0.032 per request
- Place Details: $0.017 per request
- **Estimated cost per competitor discovery:** ~$0.02

### Step 6: Add to .env.local

```bash
GOOGLE_PLACES_API_KEY=AIzaSyC...your_actual_key_here
```

## Jina AI Setup

No API key required! Jina AI Reader is free for basic usage.

The service is already configured to use `https://r.jina.ai/` endpoint.

**Rate Limits (Free Tier):**
- ~60 requests per minute
- Sufficient for competitor analysis (we batch 5 at a time)

**Paid Tier (Optional):**
- If you need higher limits, visit [jina.ai](https://jina.ai/)
- Add `JINA_AI_API_KEY` to .env.local if you upgrade

## Verification

After adding the environment variables, restart your development server:

```bash
npm run dev
```

Test the setup:
1. Go to `/marketing/competitors/new`
2. Fill in the form with your business details
3. Click "Find Competitors"
4. Check the console for any API errors

## Troubleshooting

### Google Places API Errors

**Error: "API key not valid"**
- Check that you copied the full API key
- Verify the API key has Places API enabled
- Check API restrictions

**Error: "This API project is not authorized"**
- Enable Places API in Cloud Console
- Wait 1-2 minutes for changes to propagate

**Error: "Billing not enabled"**
- Add billing account in Cloud Console
- Free tier ($200/month) is sufficient for most use cases

### Jina AI Errors

**Error: "Timeout"**
- Some websites take longer to scrape
- The system will mark as "limited_data" and continue
- Not a critical error

**Error: "Too many requests"**
- We batch requests (5 at a time) to avoid this
- If it happens, wait 1 minute and retry

## Cost Monitoring

### Google Places API

Monitor usage in Cloud Console:
1. Go to "APIs & Services" → "Dashboard"
2. Click "Places API"
3. View "Metrics" tab

**Budget Alert (Recommended):**
1. Go to "Billing" → "Budgets & alerts"
2. Create budget alert at $10/month
3. Get email notifications before overspending

### OpenAI API

Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

**Estimated costs per analysis:**
- Quick Scan (3 competitors): ~$1.00
- Standard (5 competitors): ~$2.00
- Deep Dive (10 competitors): ~$4.00

## Optional: Jina AI Paid Tier

If you need higher rate limits or priority processing:

1. Visit [jina.ai](https://jina.ai/)
2. Sign up for paid tier
3. Get API key
4. Add to `.env.local`:

```bash
JINA_AI_API_KEY=your_jina_api_key_here
```

5. Update `services/jinaAI.ts` to include API key in headers

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use API restrictions** for Google Places API
3. **Monitor usage** regularly
4. **Set budget alerts** to avoid unexpected charges
5. **Rotate keys** if compromised

## Summary

**Minimum Required:**
- ✅ OpenAI API key (already configured)

**Recommended:**
- ✅ Google Places API key (for local competitor discovery)

**Optional:**
- ⭕ Jina AI API key (only if you need higher limits)

The system will work without Google Places API, but competitor discovery will rely solely on OpenAI Web Search, which may be less accurate for local businesses.
