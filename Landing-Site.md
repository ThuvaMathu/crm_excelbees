# Landing Page Plan — RCRM by ExcelBees

## Context

The CRM app currently redirects `/` to `/login`. `AuthGate` already whitelists `"/"` as a public route, so the infrastructure is ready. There are no public-facing pages, no landing layout, no blog schema, and no contact form — all must be created from scratch.

The landing page serves as the primary marketing surface for RCRM. It must visually align with the existing dark mode design system (amber + midnight blue palette, shadcn/ui components, CSS variables) so the brand is consistent whether users enter via marketing or the app itself.

---

## Existing System to Reuse

| Asset | Path | Usage |
|---|---|---|
| CSS dark mode variables | `app/globals.css` | Amber `#F59E0B`, Midnight `#0A1628`, Slate `#1A2738`, Border `#2D3F52` |
| Tailwind enterprise tokens | `tailwind.config.ts` | `enterprise.amber`, `enterprise.midnight`, `enterprise.surface`, etc. |
| `cn()` utility | `lib/utils.ts` | All className merging |
| shadcn/ui primitives | `components/ui/` | Button, Card, Input, Badge, Form, Tabs, Separator |
| Logo component | `components/ui/logo.tsx` | Theme-aware `/logo.png` + `/logo-dark.png` |
| Email send API | `app/api/email/send/route.ts` + nodemailer | Contact form submission |
| `framer-motion` | already installed | Section animations, scroll reveals |
| `react-hook-form` + `zod` | already installed | Contact form validation |
| `lucide-react` | already installed | All icons |

---

## File Structure to Create

```
app/
  page.tsx                          ← Replace redirect with landing page
  (landing)/
    layout.tsx                      ← Public layout (no sidebar, no auth)

components/
  landing/
    Navbar.tsx
    HeroSection.tsx
    FeaturesSection.tsx
    TestimonialsSection.tsx
    AboutSection.tsx
    BlogSection.tsx
    ContactSection.tsx
    Footer.tsx
    TeamCard.tsx
    BlogCard.tsx
    FeatureCard.tsx

lib/
  constants/
    blog/
      schema.ts                     ← Blog post TypeScript schema
      blog1-5.ts                    ← Posts 1–5
      blog6-10.ts                   ← Posts 6–10
      index.ts                      ← Re-exports all posts as a flat array
    team.ts                         ← Team member data
    testimonials.ts                 ← Testimonial data
    features.ts                     ← Feature list data
```

---

## Color Palette (Dark Mode First)

All components must use these existing tokens:

| Role | Token | Value |
|---|---|---|
| Page background | `bg-background` / `enterprise-midnight` | `#0A1628` |
| Card/surface | `bg-card` / `enterprise-slate` | `#1A2738` |
| Elevated surface | `enterprise-surface` | `#111C2E` |
| Border | `border-border` / `enterprise-border` | `#2D3F52` |
| Primary CTA | `bg-primary` / `enterprise-amber` | `#F59E0B` |
| Foreground text | `text-foreground` | white in dark mode |
| Muted text | `text-muted-foreground` | slate-400 equivalent |
| Highlight/glow | `enterprise-highlight` | `#FEF3C7` |

---

## Section-by-Section Design Spec

### 1. Navigation (`Navbar.tsx`)
- **Sticky**, `z-50`, `backdrop-blur-md`, `bg-enterprise-midnight/80 border-b border-enterprise-border`
- Logo on left (`<Logo />` component, ~h-8)
- Nav links: Home, About, Blog, Contact — `text-muted-foreground hover:text-foreground transition`
- Primary CTA button: "Get Your Custom Demo" — `variant="default"` (amber fill)
- Mobile: hamburger → `Sheet` (shadcn slide-in) with stacked nav links
- Smooth scroll to sections via anchor `#id` links

### 2. Hero Section (`HeroSection.tsx`)
- Full viewport height (`min-h-screen`), centered, `bg-enterprise-midnight`
- Background: subtle radial amber glow (`radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)`)
- **Headline:** `"Custom CRM for Custom Business Needs"` — large bold text, amber highlight on "Custom"
- **Subheadline:** Three feature chips (Badge components):
  - "Advanced User Role Management"
  - "Integrated Custom AI"
  - "Affordable Pricing"
- **Screenshot placeholder:** `aspect-video`, `rounded-xl border border-enterprise-border bg-enterprise-slate`, centered below text with a "Dashboard Preview" label
- **CTA Button:** "Get Your Custom Demo" — amber, large, with ChevronRight icon
- Secondary link: "See How It Works ↓" — ghost, scrolls to features
- Framer Motion: fade-up on load

### 3. Features Section (`FeaturesSection.tsx`)
- `bg-enterprise-surface`, section padding
- **Headline:** "Everything You Need. Nothing You Don't."
- **Value line:** "Don't waste money on unwanted features. Pay only for what you need."
- 3-column grid (stacks to 1 on mobile) of `FeatureCard` components:
  1. **Role-Based Access** — Admin / Manager / Team roles, icon: `Shield`
  2. **Custom AI Assistant** — data entry help, insights, icon: `Bot`
  3. **Modular Features** — pick only what you need, icon: `Puzzle`
  4. **Lead & Deal Tracking** — visual pipeline, icon: `TrendingUp`
  5. **Invoice & Billing** — built-in invoicing, icon: `FileText`
  6. **Affordable Pricing** — transparent, no bloat, icon: `DollarSign`
- Each card: `bg-card border border-enterprise-border rounded-xl p-6`, amber icon, title, description

### 4. Testimonials Section (`TestimonialsSection.tsx`)
- `bg-enterprise-midnight`
- Headline: "Trusted by Brisbane Businesses"
- Trust badge: "Local Brisbane Businesses" with `MapPin` icon
- 3-column grid of testimonial cards: avatar initials, name, business type, star rating (amber stars), quote
- Static data from `lib/constants/testimonials.ts`
- Sample testimonials:
  1. "Switched from Salesforce — saves us $400/month" — Operations Manager, Trades Company
  2. "The AI data entry alone saves me 2 hours a day" — Sales Director, SMB
  3. "Finally a CRM that doesn't overwhelm the team" — Business Owner, Retail

### 5. About Section (`AboutSection.tsx`)
- `bg-enterprise-surface`
- **ExcelBees intro:** 2-sentence paragraph about the agency
- **Story block:** Amber left-border quote card:
  > "Inspired by exploring Sierra Enterprises and realising existing CRMs were bloated and expensive, we built RCRM for our own needs — then decided other businesses deserved the same lean, powerful tool at an affordable price."
- **Team grid:** 3–4 `TeamCard` components
  - Each card: circular avatar image (fallback initials), name, role, short bio
  - Data from `lib/constants/team.ts`
- **CTA:** "Meet the Experts" button (outlined amber) → links to full about page or contact

### 6. Blog Section (`BlogSection.tsx`)
- `bg-enterprise-midnight`
- Headline: "From the ExcelBees Blog"
- 3-column card grid, shows 3 most recent posts from the static data
- Each `BlogCard`: cover image placeholder, category Badge, title, excerpt (2 lines), publish date, "Read More →" link
- "View All Posts" ghost button at bottom

### 7. Contact Section (`ContactSection.tsx`)
- `bg-enterprise-surface`
- Headline: "Ready to Transform Your Business?"
- Subline: Strong CTA copy
- Two-column layout on desktop:
  - Left: value summary bullets (Role Management, AI, Affordable)
  - Right: contact form
- Form fields (react-hook-form + zod):
  - Name (`string`, required)
  - Email (`email`, required)
  - Business Type (`select`: Retail, Trades, Professional Services, Other)
  - Message (`textarea`, required)
- Submit → POST to `/api/email/send` (existing nodemailer endpoint)
- Success/error state with sonner toast

### 8. Footer (`Footer.tsx`)
- `bg-enterprise-midnight border-t border-enterprise-border`
- Logo + tagline left
- Navigation column: Home, About, Blog, Contact, Login
- Social icons: LinkedIn, Twitter/X, Facebook (lucide or custom SVGs)
- Copyright: `© 2025 ExcelBees. All rights reserved.`

---

## Blog Schema (`lib/constants/blog/schema.ts`)

```typescript
export type BlogCategory = 'CRM Tips' | 'AI & Automation' | 'Business Growth' | 'Product Updates'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: BlogBlock[]        // Rich text blocks
  category: BlogCategory
  author: string
  publishedAt: string         // ISO date string
  readTimeMinutes: number
  coverImageUrl?: string
  featured?: boolean
}

export type BlogBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'image'; url: string; alt: string; caption?: string }
  | { type: 'code'; language: string; content: string }
```

---

## Routing & Layout Notes

- `app/page.tsx` — replace `redirect('/login')` with landing page content
- `app/(landing)/layout.tsx` — minimal layout: no sidebar/header, just `{children}` (root ThemeProvider already wraps everything)
- `AuthGate` already allows `"/"` through without auth check — no changes needed there

---

## Responsiveness Breakpoints

| Breakpoint | Behaviour |
|---|---|
| `< 768px` (mobile) | Single column, hamburger nav, stacked hero text + mockup |
| `768px–1024px` (tablet) | 2-col grids, nav links visible |
| `> 1024px` (desktop) | 3-col grids, full hero layout |

---

## Performance Notes

- All section images and dashboard screenshot placeholder use `next/image` with explicit `width`/`height`
- Static blog data is imported at build time (no runtime fetch)
- Framer Motion animations: `whileInView` + `once: true` to avoid re-triggering
- No extra fonts — Inter already loaded in root layout

---

## Verification Plan

1. Run `npm run dev`, navigate to `http://localhost:3000/` — confirm landing page loads instead of redirect
2. Test dark mode toggle — all sections should use amber/midnight palette
3. Resize viewport through mobile/tablet/desktop — confirm responsive grid breakpoints
4. Submit contact form with valid data — check nodemailer delivers email; check sonner success toast
5. Submit contact form with invalid data — check zod validation error messages appear inline
6. Click all nav anchor links — confirm smooth scroll to correct sections
7. Confirm `app/(dashboard)` routes still work — no regression from replacing `app/page.tsx`
8. Check `AuthGate` still blocks unauthenticated users from dashboard routes
