# Production-Ready CRM: Master Implementation Plan

This document serves as the **Single Source of Truth** for the development of a modern, enterprise-grade CRM. It consolidates architectural decisions, UI references, and a comprehensive A-Z execution roadmap.

Test Credentials

Email: excelbees2024@gmail.com
Password: Excelbees@@2024

---

## 1. Project Overview & Vision

**Goal**: Build a high-performance, visually stunning CRM that rivals HubSpot and Zoho.
**Design Philosophy**: "Enterprise SaaS meets Consumer UX." Clean lines, generous whitespace, card-based layouts, and vibrant status indicators.
**Core Value Proposition**: A unified workspace for managing the entire customer lifecycle—from lead capture to invoicing and project delivery.

### Targeted UI Reference
Based on internal design benchmarks (dashboard screenshots), the system will feature:
*   **Fixed Sidebar Navigation** with icon + label structure.
*   **Module-Specific Dashboards** (e.g., Leads Dashboard, Deals Dashboard).
*   **Immediate Visual Insights**: KPI cards, Pie Charts (e.g., "Projects by Stage"), and Area Charts (Trends).
*   **Color-Coded Statuses**: Green (Success), Yellow (Warning/Action Required), Red (Failure/Critical), Blue (Info/Pipeline).

---

## 2. Tech Stack & Architecture

### Frontend
*   **Framework**: **Next.js 16 (App Router)** - Leveraging Server Components for data heaviness and Client Components for interactivity.
*   **Language**: **TypeScript** - Strict mode for enterprise-grade type safety.
*   **Styling**: **Tailwind CSS** + **module_clsx/tailwind-merge** for dynamic styling.
*   **UI Library**: **Shadcn UI** (Radix Primitives) for accessible, customizable components.
*   **Icons**: **Lucide React** (consistent, modern stroke icons).
*   **Charts**: **Recharts** (highly customizable D3 wrapper).
*   **Drag & Drop**: **@dnd-kit/core** (for Kanban boards).
*   **Editor**: **React-Quill** or **Tiptap** (for rich text notes/emails).
*   **Animations**: **Framer Motion** (layout transitions, micro-interactions).

### Backend & Data
*   **Platform**: **Firebase** (serverless scalability).
*   **Database**: **Cloud Firestore** (NoSQL document store).
*   **Auth**: **Firebase Authentication** (Identity Platform).
*   **Storage**: **Firebase Storage** (Documents, Avatars).
*   **Admin SDK**: **Firebase Admin** (Server-side privileged operations).
*   **State Management**: **Zustand** (Client-side global state).

---

## 3. Data Model (Schema Design)

### Core Collections

#### `users`
*   `uid` (PK): User ID
*   `email`, `displayName`, `photoURL`
*   `role`: "admin" | "manager" | "sales" | "support"
*   `status`: "active" | "inactive"
*   `settings`: { theme, notifications, defaultCurrency }

#### `leads`
*   `id` (PK)
*   `firstName`, `lastName`, `email`, `phone`
*   `companyName`, `jobTitle`
*   `status`: "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost"
*   `source`: "Website" | "Referral" | "Ads" | "Cold Call"
*   `ownerId` (Ref: users)
*   `value`: number (estimated)
*   `tags`: string[]
*   `customFields`: Map<string, any>

#### `contacts`
*   `id` (PK)
*   `firstName`, `lastName`, `email`, `phone`
*   `companyId` (Ref: companies)
*   `ownerId` (Ref: users)
*   `lastContactedAt`: timestamp

#### `companies`
*   `id` (PK)
*   `name`, `domain`, `industry`, `size`
*   `billingAddress`, `shippingAddress`
*   `annualRevenue`

#### `deals`
*   `id` (PK)
*   `title`
*   `pipelineStage`: "Pipeline" | "Follow Up" | "Schedule Service" | "Conversation" | "Won" | "Lost"
*   `value`: number
*   `closeDate`: timestamp
*   `contactIds`: string[]
*   `companyId`: string
*   `ownerId`: string
*   `probability`: number (0-100)

#### `projects`
*   `id` (PK)
*   `name`, `description`
*   `status`: "Planning" | "In Progress" | "Review" | "Completed"
*   `dealId` (Ref: deals)
*   `deadline`: timestamp
*   `teamIds`: string[]

#### `tasks`
*   `id` (PK)
*   `subject`
*   `type`: "To Do" | "Call" | "Email" | "Meeting"
*   `priority`: "High" | "Medium" | "Low"
*   `dueDate`: timestamp
*   `status`: "Open" | "In Progress" | "Done"
*   `relatedTo`: { collection: string, id: string }

#### `invoices`
*   `id` (PK)
*   `number` (Sequential ID)
*   `status`: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled"
*   `issueDate`, `dueDate`
*   `items`: [{ description, quantity, price, total }]
*   `subtotal`, `tax`, `total`
*   `clientId`

#### `activities` (The "Timeline")
*   `id` (PK)
*   `type`: "note" | "email" | "call" | "log" | "status_change"
*   `content`: HTML/Text
*   `performedBy` (Ref: users)
*   `relatedTo`: { collection: string, id: string }
*   `metadata`: Map<string, any>

---

## 4. A-Z Implementation Roadmap

### Phase 0: Project Initiation & Architecture
- [ ] **Scaffold Project**: `npx create-next-app@latest` (TS, Tailwind, App Router).
- [ ] **Design System Setup**:
    - [ ] Configure `tailwind.config.ts` with brand colors (Primary Blue `#3B82F6`, etc.).
    - [ ] Install **Shadcn UI** core: `button`, `card`, `input`, `dropdown-menu`, `avatar`, `separator`, `badge`.
    - [ ] Set up `next-themes` for dark mode support.
- [ ] **Firebase Setup**:
    - [ ] Create Firebase Project.
    - [ ] Enable Auth, Firestore, Storage.
    - [ ] Initialize `firebase-admin` service account.
    - [ ] Create `lib/firebase.ts` and `lib/firebase-admin.ts`.
- [ ] **State Management**:
    - [ ] Create `zustand` store for Auth (`useAuthStore`).
    - [ ] Create `zustand` store for UI (Sidebar toggle, etc).

### Phase 1: Authentication & Foundation
- [ ] **Auth Pages**:
    - [ ] Build `/login` with clean, modern card layout.
    - [ ] Build `/register` and `/forgot-password`.
    - [ ] Implement Google Sign-In & Email/Password.
- [ ] **Layout Architecture**:
    - [ ] Create `app/(dashboard)/layout.tsx`.
    - [ ] **Sidebar Component**: Collapsible, icon-driven (Lucide icons).
    - [ ] **Header Component**: Search bar, Notification bell, User profile dropdown.
    - [ ] **Mobile Nav**: Hamburger menu sheet.
- [ ] **RBAC Middleware**:
    - [ ] Implement `middleware.ts` to protect routes.
    - [ ] Create `RequireRole` wrapper component for UI permission gating.

### Phase 2: CRM Core (Leads & Contacts)
- [ ] **Leads Module** (`/leads`):
    - [ ] **Data Table**: Sortable, paginated, searchable interactions.
    - [ ] **Ag-Grid Style Filters**: Sidebar filter panel (Status, Owner, Date).
    - [ ] **Create Lead Modal**: Form with validation (Zod + React Hook Form).
    - [ ] **Lead Detail View** (`/leads/[id]`):
        - [ ] Left col: Profile info, quick actions (Call, Email).
        - [ ] Right col: Activity Timeline (Notes, History).
- [ ] **Contacts Module** (`/contacts`):
    - [ ] Import utility (CSV parser).
    - [ ] Company association logic.
- [ ] **Companies Module** (`/companies`):
    - [ ] "Related Contacts" card.
    - [ ] "Related Deals" card.

### Phase 3: The Sales Engine (Deals & Pipeline)
- [ ] **Pipeline Board** (`/deals`):
    - [ ] Implement Kanban view using `@dnd-kit`.
    - [ ] Columns: Pipeline, Follow Up, Schedule Service, Conversation, Won/Lost.
    - [ ] Drag-to-update stage logic.
    - [ ] Total value calculation per column.
- [ ] **Deal Detail View**:
    - [ ] Stage progress stepper.
    - [ ] Products/Services line items offering.
    - [ ] Quotes generation logic.

### Phase 4: Operations (Projects & Tasks)
- [ ] **Projects Module** (`/projects`):
    - [ ] List View & Status Boards.
    - [ ] **Gantt Chart**: Simple timeline visualization of project deadlines.
    - [ ] Team assignment logic.
- [ ] **Tasks & Calendar** (`/tasks`):
    - [ ] **Calendar View**: `react-big-calendar` or custom grid implementation.
    - [ ] Task creation drawer.
    - [ ] "My Tasks" dashboard widget.
    - [ ] Automated reminders (Cloud Functions).

### Phase 5: Finance (Invoices)
- [ ] **Invoice Builder**:
    - [ ] Dynamic line item addition.
    - [ ] Tax & Discount calculations.
- [ ] **PDF Generation**:
    - [ ] `@react-pdf/renderer` templates.
    - [ ] "Download PDF" button.
- [ ] **Invoice Lifecycle**:
    - [ ] Mark as Sent/Paid.
    - [ ] Revenue dashboard integration.

### Phase 6: Analytics & Reporting
- [ ] **Dashboard Overview** (`/dashboard`):
    - [ ] **KPI Cards**: Leads Revenue, Conversion Rate, Open Deals.
    - [ ] **Charts**:
        - [ ] Projects by Stage (Pie Chart).
        - [ ] Revenue Trends (Area Chart).
        - [ ] Team Performance (Bar Chart).
- [ ] **Report Generator**:
    - [ ] Date range picker.
    - [ ] Export to CSV.

### Phase 7: Advanced Features (Do Not Hold Back)
- [ ] **Email Integration**:
    - [ ] Send emails via SendGrid/Resend API.
    - [ ] Track opens/clicks (Pixel tracking).
- [ ] **Global Search**:
    - [ ] `cmd+k` command palette (CMDK) searching across all records.
- [ ] **Notifications**:
    - [ ] In-app toast notifications (Sonner).
    - [ ] Notification center (dropdown).
- [ ] **Activity Logging**:
    - [ ] Auto-log status changes.
    - [ ] "Mention" system in comments (@user).

### Phase 8: Polish & Production
- [ ] **Performance**:
    - [ ] Implement `React.Suspense` with Skeletons for all data fetching.
    - [ ] Image optimization.
- [ ] **Security Rules**:
    - [ ] Lock down Firestore rules based on `request.auth.uid`.
- [ ] **Error Handling**:
    - [ ] Global Error Boundary.
    - [ ] Empty states for all tables/lists.
- [ ] **Deployment**:
    - [ ] Vercel deployment configuration.
    - [ ] Environment variable validation.

---

## 5. UI/UX Design System Reference

### Anatomy of a Page
1.  **Page Header**: Breadcrumbs > Title > Primary Action Button (Right aligned).
2.  **Filter Bar**: Search input (left), Filter dropdowns (middle), View toggle (List/Board) (right).
3.  **Content Area**: White card container with `shadow-sm` and `rounded-lg`.

### Brand Colors (Tailwind Config)
```javascript
colors: {
  primary: {
    DEFAULT: "#3B82F6", // Blue-500
    foreground: "#FFFFFF",
  },
  success: "#10B981", // Green-500
  warning: "#F59E0B", // Amber-500
  danger: "#EF4444",  // Red-500
  background: "#F3F4F6", // Gray-100
  surface: "#FFFFFF",
}
```

### Components Checklist
- [ ] `Sidebar`: 240px fixed, collapsible to 64px.
- [ ] `StatusBadge`: `px-2.5 py-0.5 rounded-full text-xs font-medium`.
- [ ] `AvatarGroup`: Overlapping avatars for project teams.
- [ ] `ProgressBar`: For deal probability or project completion.

---

**Next Step**: Review this plan and signal approval to begin **Phase 0: Project Initiation**.
