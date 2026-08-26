# ExcelBees CRM

> **Your Data. Your Server. Your Domain.**

A personalized, AI-powered CRM deployed entirely within your infrastructure. Zero data leakage. Complete sovereignty.

---

## Overview

ExcelBees CRM is a modern, enterprise-grade Customer Relationship Management platform designed to rival industry leaders like HubSpot and Zoho. It provides a unified workspace for managing the entire customer lifecycle — from lead capture to invoicing, project delivery, HR management, and AI-driven marketing.

The design philosophy is **"Enterprise SaaS meets Consumer UX"** — clean lines, generous whitespace, card-based layouts, color-coded status indicators, and smooth micro-animations throughout.

---

## Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| **Framework**      | Next.js 16 (App Router) with React 19                            |
| **Language**       | TypeScript (strict mode)                                          |
| **Styling**        | Tailwind CSS + Shadcn UI (Radix Primitives)                       |
| **State**          | Zustand (client-side global state)                                |
| **Database**       | Firebase Cloud Firestore (NoSQL)                                  |
| **Auth**           | Firebase Authentication (Email/Password, Google OAuth)            |
| **Storage**        | Firebase Storage (documents, avatars)                             |
| **Caching**        | Upstash Redis                                                     |
| **AI**             | Google Generative AI (Gemini)                                     |
| **Charts**         | Recharts                                                          |
| **Forms**          | React Hook Form + Zod validation                                  |
| **Rich Text**      | Tiptap editor                                                     |
| **Drag & Drop**    | @dnd-kit (Kanban boards)                                          |
| **Animations**     | Framer Motion                                                     |
| **PDF**            | jsPDF + jspdf-autotable                                           |
| **Email**          | Nodemailer                                                        |
| **Calendar**       | react-big-calendar                                                |
| **Icons**          | Lucide React                                                      |
| **Themes**         | next-themes (light/dark mode)                                     |

---

## Core Modules

### 🎯 Sales Pipeline

| Module        | Description                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| **Dashboard** | KPI cards, pipeline charts, area/trend graphs, and real-time sales metrics                                   |
| **Leads**     | Full lead lifecycle — create, assign, track, filter, bulk actions, convert to contact. Color-coded statuses.  |
| **Contacts**  | Contact profiles with social links, tags, activity history, and company associations                         |
| **Companies** | Company records with billing/shipping addresses, industry, size, revenue, and linked contacts                |
| **Deals**     | Kanban board pipeline view with drag-and-drop stage progression, win/loss tracking, and deal value forecasts  |

### 📋 Operations

| Module       | Description                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Projects** | Project management with status tracking (Planning → In Progress → Review → Completed), budgets, and teams  |
| **Tasks**    | Task assignments (To Do, Call, Email, Meeting) with priority levels, due dates, and related entity linking   |
| **Calendar** | Interactive calendar with task/event scheduling and date validation                                          |

### 💰 Finance

| Module       | Description                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Invoices** | Create, send, and track invoices with line items, tax, discounts, PDF generation, and payment status         |

### 👥 HR & People

| Module        | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| **Employees** | Employee profiles and management (admin-only write access)                             |
| **Leaves**    | Leave request submission and approval workflow                                         |
| **Payroll**   | Payroll records with strict access control (owner-read, admin-write only)              |

### 🤖 Marketing AI Suite

| Module                 | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Email Campaigns**    | Create, schedule, and send email campaigns with templates and analytics            |
| **Blog Writer**        | AI-powered blog content generation and management                                  |
| **SEO Tools**          | SEO analysis and optimization recommendations                                     |
| **Keyword Research**   | Keyword discovery and tracking for content strategy                                |
| **Competitor Analysis**| Competitor discovery and monitoring via Google Places and Jina AI                   |
| **Social Media**       | Social media management interface                                                  |
| **Landing Pages**      | Landing page builder and management                                                |
| **Ads**                | Ad campaign management                                                             |
| **Marketing Calendar** | AI-generated content calendar with templates and scheduling                        |
| **Marketing Analytics**| Campaign performance tracking and reporting                                        |

### 📊 Analytics & Reporting

| Module        | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| **Analytics** | Cross-module analytics dashboard with visual insights               |
| **Reports**   | Configurable reports across all CRM data                            |

---

## Architecture

### Directory Structure

```
crm_excelbees/
├── app/
│   ├── (auth)/              # Auth pages: login, register, forgot-password, change-password
│   ├── (dashboard)/         # All protected dashboard routes (16+ modules)
│   ├── api/                 # API routes (admin, email, invoices, marketing, cron, etc.)
│   └── legal/               # Legal pages (privacy, terms)
├── components/              # 27+ component directories
│   ├── ui/                  # Shadcn UI primitives (button, card, dialog, etc.)
│   ├── layout/              # Sidebar, Header, MobileNav
│   ├── leads/               # Lead-specific components
│   ├── deals/               # Deal pipeline & Kanban components
│   ├── ai/                  # AI assistant components
│   ├── charts/              # Chart/visualization components
│   ├── email-campaigns/     # Email campaign builder
│   ├── marketing/           # Marketing suite components
│   └── ...                  # Module-specific component directories
├── lib/
│   ├── firebase.ts          # Firebase client SDK config
│   ├── firebase-admin.ts    # Firebase Admin SDK (server-side)
│   ├── redis.ts             # Upstash Redis client
│   ├── firestore/           # Firestore data access layer
│   ├── ai/                  # AI utility functions
│   ├── email/               # Email sending utilities
│   ├── email-campaigns/     # Campaign management logic
│   ├── validations/         # Zod validation schemas
│   ├── permissions/         # Permission checking utilities
│   └── services/            # Business logic services
├── services/                # External service integrations
│   ├── ai/                  # AI service clients
│   ├── agents/              # AI agent configurations
│   ├── marketing/           # Marketing API integrations
│   ├── competitorDiscovery  # Competitor analysis service
│   ├── googlePlaces         # Google Places API integration
│   └── jinaAI               # Jina AI web scraping service
├── hooks/                   # Custom React hooks (useAuth, usePermission, useToast)
├── store/                   # Zustand stores (auth, ui)
├── types/                   # TypeScript type definitions
├── config/                  # Site configuration
├── styles/                  # Global styles
└── public/                  # Static assets
```

### Authentication & Security

- **Firebase Authentication** with email/password and Google OAuth
- **Admin-created user accounts** — no public self-registration (enforced at Firestore rules level)
- **Role-Based Access Control (RBAC)** with four roles:

| Role        | Permissions                                                     |
| ----------- | --------------------------------------------------------------- |
| **Admin**   | Full access to all resources, user management, and HR/payroll   |
| **Manager** | Read/update most resources, cannot delete or create in some     |
| **Sales**   | Standard CRM access (leads, contacts, deals, etc.)              |
| **Team**    | Read-only access to CRM data                                    |

- **Firestore Security Rules** enforce RBAC at the database level with per-collection rules
- **Middleware-level route protection** via Next.js middleware with Firebase token verification
- **Protected fields** (role, isApproved, isActive) can only be changed by admins

### Data Model

The CRM uses **Cloud Firestore** with the following core collections:

`users` · `leads` · `contacts` · `companies` · `deals` · `projects` · `tasks` · `invoices` · `activities` · `email_templates` · `employees` · `attendance` · `leaves` · `payroll`

Plus nested marketing collections for calendars, blog posts, and templates.

---

## Key Features

- **🎨 Dark/Light Theme** — System-aware theming with manual toggle
- **🔍 Global Search** — Command palette (`Ctrl+K`) to quickly find anything
- **📱 Responsive** — Full mobile navigation with hamburger menu and sheet overlay
- **🔔 Notifications** — In-app notification system with event-based triggers (deal won/lost, invoice paid, etc.)
- **📄 PDF Export** — Generate professional invoice PDFs with jsPDF
- **📧 Email System** — Send emails directly from the CRM via Nodemailer
- **🤖 AI Assistant** — Gemini-powered AI for blog writing, content calendar generation, and more
- **📊 Charts & Graphs** — Interactive dashboards with Recharts (pie, area, bar charts)
- **🔄 Drag & Drop** — Kanban-style deal pipeline with @dnd-kit
- **📝 Rich Text Editor** — Tiptap-based editor with mentions, links, and placeholders
- **📥 CSV Import** — Bulk data import with PapaParse
- **⏰ Cron Jobs** — Scheduled background tasks via API routes
- **🗓️ Calendar View** — Interactive calendar powered by react-big-calendar

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Blaze plan recommended for Cloud Functions)
- Upstash Redis instance (for caching)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd crm_excelbees

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Firebase credentials, Redis URL, and other keys
```

### Environment Variables

Key variables required in `.env.local`:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start production server (port 3001)
npm start
```

---

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |

---

## License

Proprietary. © ExcelBees Inc. All rights reserved.
