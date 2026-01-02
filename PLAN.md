# Production-Ready CRM: Detailed Master Implementation Plan

This document serves as the **Single Source of Truth** for the development of a modern, enterprise-grade CRM. It consolidates architectural decisions, UI references, and a comprehensive A-Z execution roadmap with granular implementation details.

## Test Credentials

**Email**: excelbees2024@gmail.com  
**Password**: Excelbees@@2024

---

## 1. Project Overview & Vision

**Goal**: Build a high-performance, visually stunning CRM that rivals HubSpot and Zoho.  
**Design Philosophy**: "Enterprise SaaS meets Consumer UX." Clean lines, generous whitespace, card-based layouts, and vibrant status indicators.  
**Core Value Proposition**: A unified workspace for managing the entire customer lifecycle—from lead capture to invoicing and project delivery.

### Targeted UI Reference
Based on internal design benchmarks (dashboard screenshots), the system will feature:
- **Fixed Sidebar Navigation** with icon + label structure
- **Module-Specific Dashboards** (e.g., Leads Dashboard, Deals Dashboard)
- **Immediate Visual Insights**: KPI cards, Pie Charts (e.g., "Projects by Stage"), and Area Charts (Trends)
- **Color-Coded Statuses**: Green (Success), Yellow (Warning/Action Required), Red (Failure/Critical), Blue (Info/Pipeline)

---

## 2. Tech Stack & Architecture

### Frontend
- **Framework**: **Next.js 16 (App Router)** - Leveraging Server Components for data heaviness and Client Components for interactivity
- **Language**: **TypeScript** - Strict mode for enterprise-grade type safety
- **Styling**: **Tailwind CSS** + **clsx/tailwind-merge** for dynamic styling
- **UI Library**: **Shadcn UI** (Radix Primitives) for accessible, customizable components
- **Icons**: **Lucide React** (consistent, modern stroke icons)
- **Charts**: **Recharts** (highly customizable D3 wrapper)
- **Drag & Drop**: **@dnd-kit/core** (for Kanban boards)
- **Editor**: **React-Quill** or **Tiptap** (for rich text notes/emails)
- **Animations**: **Framer Motion** (layout transitions, micro-interactions)
- **Forms**: **React Hook Form** + **Zod** (validation)
- **Date Handling**: **date-fns** or **Day.js**
- **PDF Generation**: **@react-pdf/renderer**
- **Command Palette**: **cmdk**
- **Toast Notifications**: **Sonner**

### Backend & Data
- **Platform**: **Firebase** (serverless scalability)
- **Database**: **Cloud Firestore** (NoSQL document store)
- **Auth**: **Firebase Authentication** (Identity Platform)
- **Storage**: **Firebase Storage** (Documents, Avatars)
- **Admin SDK**: **Firebase Admin** (Server-side privileged operations)
- **State Management**: **Zustand** (Client-side global state)
- **Email Service**: **SendGrid** or **Resend** API
- **Functions**: **Firebase Cloud Functions** (Scheduled tasks, background jobs)

---

## 3. Data Model (Schema Design)

### Core Collections

#### `users`
```typescript
{
  uid: string (PK)
  email: string
  displayName: string
  photoURL: string | null
  role: "admin" | "manager" | "sales" | "support"
  status: "active" | "inactive"
  settings: {
    theme: "light" | "dark" | "system"
    notifications: boolean
    defaultCurrency: "USD" | "EUR" | "GBP"
    timezone: string
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `leads`
```typescript
{
  id: string (PK)
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  jobTitle: string
  status: "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost"
  source: "Website" | "Referral" | "Ads" | "Cold Call" | "Event" | "Other"
  ownerId: string (Ref: users)
  value: number (estimated)
  tags: string[]
  customFields: Map<string, any>
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  notes: string
  createdAt: timestamp
  updatedAt: timestamp
  lastContactedAt: timestamp | null
}
```

#### `contacts`
```typescript
{
  id: string (PK)
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  companyId: string (Ref: companies)
  ownerId: string (Ref: users)
  socialProfiles: {
    linkedin: string
    twitter: string
  }
  tags: string[]
  lastContactedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `companies`
```typescript
{
  id: string (PK)
  name: string
  domain: string
  industry: string
  size: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+"
  billingAddress: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  annualRevenue: number
  phone: string
  website: string
  ownerId: string (Ref: users)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `deals`
```typescript
{
  id: string (PK)
  title: string
  description: string
  pipelineStage: "Pipeline" | "Follow Up" | "Schedule Service" | "Conversation" | "Won" | "Lost"
  value: number
  closeDate: timestamp
  contactIds: string[]
  companyId: string
  ownerId: string (Ref: users)
  probability: number (0-100)
  products: Array<{
    id: string
    name: string
    quantity: number
    price: number
    total: number
  }>
  notes: string
  tags: string[]
  createdAt: timestamp
  updatedAt: timestamp
  wonDate: timestamp | null
  lostReason: string | null
}
```

#### `projects`
```typescript
{
  id: string (PK)
  name: string
  description: string
  status: "Planning" | "In Progress" | "Review" | "Completed" | "On Hold"
  dealId: string (Ref: deals)
  deadline: timestamp
  startDate: timestamp
  completionDate: timestamp | null
  teamIds: string[]
  progress: number (0-100)
  budget: number
  actualCost: number
  priority: "Low" | "Medium" | "High" | "Urgent"
  ownerId: string (Ref: users)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `tasks`
```typescript
{
  id: string (PK)
  subject: string
  description: string
  type: "To Do" | "Call" | "Email" | "Meeting"
  priority: "High" | "Medium" | "Low"
  dueDate: timestamp
  status: "Open" | "In Progress" | "Done" | "Cancelled"
  assignedTo: string (Ref: users)
  createdBy: string (Ref: users)
  relatedTo: {
    collection: "leads" | "contacts" | "deals" | "projects"
    id: string
  }
  reminder: timestamp | null
  completedAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `invoices`
```typescript
{
  id: string (PK)
  number: string (Sequential ID)
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled"
  issueDate: timestamp
  dueDate: timestamp
  paidDate: timestamp | null
  items: Array<{
    description: string
    quantity: number
    price: number
    tax: number
    total: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  clientId: string (Ref: companies or contacts)
  dealId: string (Ref: deals)
  notes: string
  terms: string
  currency: string
  createdBy: string (Ref: users)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `activities`
```typescript
{
  id: string (PK)
  type: "note" | "email" | "call" | "log" | "status_change" | "created" | "updated" | "deleted"
  content: string (HTML/Text)
  performedBy: string (Ref: users)
  relatedTo: {
    collection: string
    id: string
  }
  metadata: {
    oldValue?: any
    newValue?: any
    field?: string
  }
  createdAt: timestamp
}
```

---

## 4. A-Z Implementation Roadmap

### Phase 0: Project Initiation & Architecture

#### 0.1 Project Scaffolding
- [ ] **Initialize Next.js Project**
  - [ ] Run `npx create-next-app@latest crm-platform`
  - [ ] Select: TypeScript, Tailwind CSS, App Router, src directory
  - [ ] Configure `tsconfig.json` with strict mode
  - [ ] Set up path aliases (`@/components`, `@/lib`, `@/types`)

- [ ] **Project Structure Setup**
  - [ ] Create folder structure:
    ```
    src/
    ├── app/
    │   ├── (auth)/
    │   ├── (dashboard)/
    │   └── api/
    ├── components/
    │   ├── ui/
    │   ├── forms/
    │   ├── layout/
    │   └── modules/
    ├── lib/
    │   ├── firebase/
    │   ├── utils/
    │   └── validations/
    ├── hooks/
    ├── stores/
    ├── types/
    └── constants/
    ```

- [ ] **Git & Version Control**
  - [ ] Initialize Git repository
  - [ ] Create `.gitignore` (include `.env.local`, `node_modules`)
  - [ ] Set up `.env.example` template
  - [ ] Create initial commit
  - [ ] Set up branch protection rules (main/develop)

#### 0.2 Design System Setup
- [ ] **Tailwind Configuration**
  - [ ] Configure `tailwind.config.ts` with:
    - [ ] Brand colors:
      ```javascript
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#F3F4F6",
        surface: "#FFFFFF",
      }
      ```
    - [ ] Custom spacing scale
    - [ ] Typography scale (font families, sizes)
    - [ ] Shadow variations
    - [ ] Border radius tokens

- [ ] **Shadcn UI Installation**
  - [ ] Run `npx shadcn-ui@latest init`
  - [ ] Install core components:
    - [ ] `button`, `card`, `input`, `label`
    - [ ] `dropdown-menu`, `select`, `dialog`, `sheet`
    - [ ] `avatar`, `badge`, `separator`, `skeleton`
    - [ ] `table`, `tabs`, `toast`, `tooltip`
    - [ ] `command`, `popover`, `scroll-area`
    - [ ] `calendar`, `date-picker`, `checkbox`, `radio-group`
    - [ ] `form` (with React Hook Form integration)

- [ ] **Theme System**
  - [ ] Install `next-themes`
  - [ ] Create `ThemeProvider` wrapper
  - [ ] Add theme toggle component
  - [ ] Define CSS variables for light/dark modes
  - [ ] Test theme switching across all components

#### 0.3 Firebase Setup
- [ ] **Firebase Project Creation**
  - [ ] Create new project in Firebase Console
  - [ ] Enable Google Analytics (optional)
  - [ ] Set up billing (Blaze plan for Cloud Functions)

- [ ] **Firebase Services Configuration**
  - [ ] Enable **Authentication**:
    - [ ] Email/Password provider
    - [ ] Google OAuth provider
    - [ ] Configure authorized domains
  - [ ] Create **Firestore Database**:
    - [ ] Start in production mode
    - [ ] Set location (us-central1)
    - [ ] Create initial security rules (locked down)
  - [ ] Set up **Firebase Storage**:
    - [ ] Create default bucket
    - [ ] Configure CORS rules
    - [ ] Set up security rules

- [ ] **Firebase SDK Integration**
  - [ ] Install dependencies:
    ```bash
    npm install firebase firebase-admin
    ```
  - [ ] Create `lib/firebase/config.ts`:
    - [ ] Export Firebase app instance
    - [ ] Export auth, firestore, storage instances
  - [ ] Create `lib/firebase/admin.ts`:
    - [ ] Initialize Firebase Admin SDK
    - [ ] Configure service account credentials
    - [ ] Export admin auth, firestore instances

- [ ] **Environment Variables**
  - [ ] Create `.env.local` with:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=
    FIREBASE_ADMIN_PROJECT_ID=
    FIREBASE_ADMIN_CLIENT_EMAIL=
    FIREBASE_ADMIN_PRIVATE_KEY=
    ```
  - [ ] Add validation using `zod`

#### 0.4 State Management
- [ ] **Install Zustand**
  - [ ] Run `npm install zustand`
  - [ ] Configure TypeScript types

- [ ] **Auth Store** (`stores/authStore.ts`)
  - [ ] State properties:
    - [ ] `user: User | null`
    - [ ] `loading: boolean`
    - [ ] `error: string | null`
  - [ ] Actions:
    - [ ] `signIn(email, password)`
    - [ ] `signUp(email, password, displayName)`
    - [ ] `signInWithGoogle()`
    - [ ] `signOut()`
    - [ ] `resetPassword(email)`
    - [ ] `updateProfile(data)`
  - [ ] Persist auth state to localStorage
  - [ ] Auto-refresh on token expiry

- [ ] **UI Store** (`stores/uiStore.ts`)
  - [ ] State properties:
    - [ ] `sidebarCollapsed: boolean`
    - [ ] `notifications: Notification[]`
    - [ ] `commandPaletteOpen: boolean`
  - [ ] Actions:
    - [ ] `toggleSidebar()`
    - [ ] `addNotification(notification)`
    - [ ] `removeNotification(id)`
    - [ ] `toggleCommandPalette()`

#### 0.5 Utility Functions & Types
- [ ] **Type Definitions** (`types/`)
  - [ ] `types/models.ts`: All data model interfaces
  - [ ] `types/api.ts`: API request/response types
  - [ ] `types/ui.ts`: Component prop types

- [ ] **Utility Functions** (`lib/utils/`)
  - [ ] `cn()`: Tailwind class name merger
  - [ ] `formatCurrency()`: Currency formatter
  - [ ] `formatDate()`: Date formatter
  - [ ] `formatPhoneNumber()`: Phone number formatter
  - [ ] `generateId()`: Unique ID generator
  - [ ] `debounce()`: Debounce utility
  - [ ] `throttle()`: Throttle utility

- [ ] **Validation Schemas** (`lib/validations/`)
  - [ ] `leadSchema`: Zod schema for lead validation
  - [ ] `contactSchema`: Contact validation
  - [ ] `dealSchema`: Deal validation
  - [ ] `invoiceSchema`: Invoice validation

---

### Phase 1: Authentication & Foundation

#### 1.1 Auth Pages

##### Login Page (`app/(auth)/login/page.tsx`)
- [ ] **Layout & Design**
  - [ ] Full-height centered layout
  - [ ] Left side: Branding illustration (optional)
  - [ ] Right side: Login form card
  - [ ] Shadow `shadow-xl`, rounded `rounded-2xl`
  - [ ] Responsive (stack on mobile)

- [ ] **Login Form**
  - [ ] Email input with validation
  - [ ] Password input with show/hide toggle
  - [ ] "Remember me" checkbox
  - [ ] "Forgot password?" link
  - [ ] Primary "Sign In" button (full width)
  - [ ] Divider with "OR"
  - [ ] "Continue with Google" button
  - [ ] Link to registration page

- [ ] **Form Handling**
  - [ ] React Hook Form integration
  - [ ] Zod validation schema
  - [ ] Inline error messages below inputs
  - [ ] Loading state on button during submission
  - [ ] Success → redirect to `/dashboard`
  - [ ] Error → display error toast

- [ ] **Edge Cases**
  - [ ] Handle unverified email
  - [ ] Handle disabled account
  - [ ] Rate limiting feedback

##### Register Page (`app/(auth)/register/page.tsx`)
- [ ] **Registration Form**
  - [ ] First Name & Last Name inputs
  - [ ] Email input
  - [ ] Password input (strength indicator)
  - [ ] Confirm Password input
  - [ ] Role selection (if applicable)
  - [ ] Terms & Conditions checkbox
  - [ ] "Create Account" button

- [ ] **Validation**
  - [ ] Email uniqueness check (real-time or on submit)
  - [ ] Password strength requirements (8+ chars, uppercase, number, special)
  - [ ] Passwords match validation
  - [ ] Terms acceptance required

- [ ] **Post-Registration**
  - [ ] Send email verification
  - [ ] Create user document in Firestore
  - [ ] Redirect to onboarding or dashboard
  - [ ] Welcome toast notification

##### Forgot Password Page (`app/(auth)/forgot-password/page.tsx`)
- [ ] **Form**
  - [ ] Email input
  - [ ] "Send Reset Link" button
  - [ ] Back to login link

- [ ] **Flow**
  - [ ] Submit → Firebase `sendPasswordResetEmail()`
  - [ ] Success message: "Check your email"
  - [ ] Resend option after 60 seconds
  - [ ] Handle invalid email gracefully

#### 1.2 Layout Architecture

##### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- [ ] **Structure**
  - [ ] Flex container (min-h-screen)
  - [ ] Sidebar (fixed left, collapsible)
  - [ ] Main content area (flex-1)
  - [ ] Header (sticky top)

- [ ] **Authentication Guard**
  - [ ] Server-side auth check
  - [ ] Redirect unauthenticated users to `/login`
  - [ ] Load user data from Firestore
  - [ ] Pass user context to children

##### Sidebar Component (`components/layout/Sidebar.tsx`)
- [ ] **Design**
  - [ ] Width: 240px (expanded), 64px (collapsed)
  - [ ] Background: `bg-white dark:bg-gray-900`
  - [ ] Border right: `border-r border-gray-200`
  - [ ] Fixed position

- [ ] **Logo Section**
  - [ ] Company logo (top)
  - [ ] Collapse to icon-only when minimized
  - [ ] Click logo → navigate to dashboard

- [ ] **Navigation Items**
  - [ ] Icon + Label layout
  - [ ] Active state: `bg-primary-50 text-primary-600 border-l-4 border-primary-600`
  - [ ] Hover state: `bg-gray-50`
  - [ ] Group items by category:
    - **Sales**: Dashboard, Leads, Contacts, Companies, Deals
    - **Operations**: Projects, Tasks, Calendar
    - **Finance**: Invoices, Payments
    - **Settings**: Profile, Team, Integrations

- [ ] **Collapse Toggle**
  - [ ] Button at bottom of sidebar
  - [ ] Icon rotates on toggle
  - [ ] Persist state in localStorage
  - [ ] Smooth transition animation

- [ ] **User Profile Section**
  - [ ] Avatar + Name (bottom of sidebar)
  - [ ] Dropdown menu: Profile, Settings, Logout
  - [ ] Status indicator (online/offline)

##### Header Component (`components/layout/Header.tsx`)
- [ ] **Layout**
  - [ ] Sticky top, backdrop blur
  - [ ] Padding: `px-6 py-4`
  - [ ] Border bottom: `border-b border-gray-200`

- [ ] **Left Section**
  - [ ] Breadcrumbs (dynamic based on route)
  - [ ] Format: Home > Leads > Lead Details

- [ ] **Center Section**
  - [ ] Global search bar
  - [ ] Icon: Search (Lucide)
  - [ ] Placeholder: "Search leads, contacts, deals..."
  - [ ] Keyboard shortcut hint: `⌘K`
  - [ ] Click → open command palette

- [ ] **Right Section**
  - [ ] Notification bell icon
    - [ ] Badge with unread count
    - [ ] Click → open notifications dropdown
  - [ ] User avatar (clickable)
    - [ ] Dropdown: Profile, Settings, Logout
  - [ ] Theme toggle (sun/moon icon)

##### Mobile Navigation (`components/layout/MobileNav.tsx`)
- [ ] **Hamburger Menu**
  - [ ] Visible only on mobile (`< md`)
  - [ ] Icon: Menu (Lucide)
  - [ ] Opens sheet from left

- [ ] **Sheet Content**
  - [ ] Same navigation items as sidebar
  - [ ] Close button (X icon)
  - [ ] Overlay backdrop (dismiss on click outside)

#### 1.3 RBAC Middleware

##### Route Protection (`middleware.ts`)
- [ ] **Auth Check**
  - [ ] Verify Firebase token from cookies
  - [ ] If invalid → redirect to `/login`
  - [ ] If valid → continue

- [ ] **Role-Based Access**
  - [ ] Define route permissions:
    ```typescript
    const routePermissions = {
      '/admin': ['admin'],
      '/reports': ['admin', 'manager'],
      '/leads': ['admin', 'manager', 'sales'],
    }
    ```
  - [ ] Check user role against route
  - [ ] If unauthorized → redirect to `/unauthorized`

##### Permission Component (`components/RequireRole.tsx`)
- [ ] **Props**
  - [ ] `allowedRoles: Role[]`
  - [ ] `children: ReactNode`
  - [ ] `fallback?: ReactNode`

- [ ] **Logic**
  - [ ] Check current user role
  - [ ] If authorized → render children
  - [ ] If not → render fallback or null

---

### Phase 2: CRM Core (Leads & Contacts)

#### 2.1 Leads Module

##### Leads List Page (`app/(dashboard)/leads/page.tsx`)

###### Page Header
- [ ] **Breadcrumbs**
  - [ ] Display: Home > Leads
  - [ ] Each item clickable

- [ ] **Title & Actions**
  - [ ] H1: "Leads"
  - [ ] Description: "Manage your sales pipeline"
  - [ ] Primary action button: "+ Create Lead"
    - [ ] Opens create lead modal on click

###### Filter Bar
- [ ] **Search Input**
  - [ ] Placeholder: "Search by name, email, or phone..."
  - [ ] Debounced search (300ms delay)
  - [ ] Icon: Search (left side)
  - [ ] Clear button (X icon, right side)
  - [ ] Updates URL query param: `?search=...`

- [ ] **Filter Sidebar Toggle**
  - [ ] Button: "Filters" with icon (filter funnel)
  - [ ] Badge showing active filter count
  - [ ] Click → toggle sidebar visibility

- [ ] **View Toggle**
  - [ ] Buttons: List | Grid
  - [ ] Active state styling
  - [ ] Persists preference in localStorage

###### Ag-Grid Style Filters (Collapsible Sidebar)
- [ ] **Sidebar Layout**
  - [ ] Width: 280px
  - [ ] Slides in from right
  - [ ] Overlay on mobile
  - [ ] Background: white/dark theme

- [ ] **Status Filter**
  - [ ] Label: "Status"
  - [ ] Component: Multi-select dropdown
  - [ ] Options: New, Contacted, Follow Up, Qualified, Lost
  - [ ] Show selected count badge
  - [ ] Chips for selected items (removable)

- [ ] **Owner Filter**
  - [ ] Label: "Owner"
  - [ ] Component: Searchable dropdown
  - [ ] Load users from Firestore
  - [ ] Display avatar + name
  - [ ] Option: "Unassigned"

- [ ] **Source Filter**
  - [ ] Label: "Lead Source"
  - [ ] Component: Multi-select
  - [ ] Options: Website, Referral, Ads, Cold Call, Event, Other

- [ ] **Date Range Filter**
  - [ ] Label: "Created Date"
  - [ ] Component: Date range picker
  - [ ] Presets: Today, Last 7 days, Last 30 days, Custom
  - [ ] Calendar popup for custom range

- [ ] **Value Range Filter**
  - [ ] Label: "Estimated Value"
  - [ ] Component: Dual range slider
  - [ ] Min/Max inputs
  - [ ] Format: Currency

- [ ] **Tag Filter**
  - [ ] Label: "Tags"
  - [ ] Component: Multi-select with autocomplete
  - [ ] Load existing tags from Firestore
  - [ ] Show color-coded tag chips

- [ ] **Filter Actions**
  - [ ] "Apply Filters" button (primary)
  - [ ] "Clear All" button (secondary)
  - [ ] Auto-apply on change (optional toggle)
  - [ ] Sync filters with URL query params
  - [ ] Preserve filters on page refresh

###### Data Table
- [ ] **Table Structure**
  - [ ] Component: Shadcn Table or custom
  - [ ] Responsive design (horizontal scroll on mobile)
  - [ ] Sticky header

- [ ] **Columns**
  1. **Checkbox** (select row)
  2. **Name**
     - [ ] Display: `firstName lastName`
     - [ ] Avatar (left side, initials fallback)
     - [ ] Sortable
  3. **Company**
     - [ ] Display: `companyName`
     - [ ] Truncate with tooltip
  4. **Email**
     - [ ] Clickable mailto link
     - [ ] Icon: Mail
  5. **Phone**
     - [ ] Formatted display
     - [ ] Clickable tel link
     - [ ] Icon: Phone
  6. **Status**
     - [ ] Color-coded badge
     - [ ] Colors: New (blue), Contacted (yellow), Follow Up (orange), Qualified (green), Lost (red)
     - [ ] Inline editable (dropdown on click)
  7. **Owner**
     - [ ] Avatar + Name
     - [ ] Tooltip with full name
     - [ ] Click → filter by owner
  8. **Value**
     - [ ] Formatted currency
     - [ ] Right-aligned
     - [ ] Sortable
  9. **Created Date**
     - [ ] Format: "MMM DD, YYYY"
     - [ ] Tooltip with exact time
     - [ ] Sortable
  10. **Actions**
      - [ ] Dropdown menu (3-dot icon)
      - [ ] Options: View, Edit, Delete, Convert to Contact

- [ ] **Row Interactions**
  - [ ] Click anywhere on row → navigate to `/leads/[id]`
  - [ ] Hover state: background color change
  - [ ] Checkbox click → toggle selection (prevent navigation)
  - [ ] Actions dropdown click → prevent navigation

- [ ] **Bulk Actions Bar**
  - [ ] Appears when rows selected
  - [ ] Sticky at bottom of screen
  - [ ] Shows selection count: "X leads selected"
  - [ ] Actions: Update Status, Assign Owner, Delete, Export
  - [ ] "Clear Selection" button

- [ ] **Sorting**
  - [ ] Click column header to sort
  - [ ] Icons: Arrow up/down/both
  - [ ] Multi-column sort (shift+click)
  - [ ] Persist sort in URL: `?sort=name&order=asc`

- [ ] **Pagination**
  - [ ] Server-side pagination
  - [ ] Page size options: 10, 25, 50, 100
  - [ ] Display: "Showing 1-25 of 347 leads"
  - [ ] Buttons: First, Previous, Next, Last
  - [ ] Page number input (jump to page)
  - [ ] Persist page in URL: `?page=2`

- [ ] **Loading States**
  - [ ] Skeleton rows (shimmer effect)
  - [ ] Maintain table layout during load
  - [ ] Show spinner in center for initial load

- [ ] **Empty States**
  - [ ] No leads: Illustration + message
  - [ ] CTA: "Create your first lead"
  - [ ] No search results: Different message
  - [ ] CTA: "Clear filters" or "Create lead"

###### Create Lead Modal
- [ ] **Trigger**
  - [ ] Button: "+ Create Lead" (page header)
  - [ ] Keyboard shortcut: `Cmd+N` or `Ctrl+N`

- [ ] **Modal Design**
  - [ ] Component: Shadcn Dialog
  - [ ] Size: Large (600px width)
  - [ ] Header: "Create New Lead"
  - [ ] Close button (X icon, top right)
  - [ ] Footer: Cancel + Save buttons

- [ ] **Form Layout**
  - [ ] Two-column grid on desktop
  - [ ] Single column on mobile
  - [ ] Group related fields

- [ ] **Form Fields**
  1. **First Name** (required)
     - [ ] Input type: text
     - [ ] Validation: Required, min 2 chars
  2. **Last Name** (required)
     - [ ] Input type: text
     - [ ] Validation: Required, min 2 chars
  3. **Email** (required)
     - [ ] Input type: email
     - [ ] Validation: Required, valid email format
     - [ ] Async validation: Check uniqueness
  4. **Phone**
     - [ ] Input with formatting (e.g., (555) 123-4567)
     - [ ] Country code selector
  5. **Company Name**
     - [ ] Input with autocomplete
     - [ ] Suggest existing companies
  6. **Job Title**
     - [ ] Input type: text
  7. **Status**
     - [ ] Dropdown: New (default), Contacted, Follow Up, Qualified
     - [ ] Color indicator next to each option
  8. **Source** (required)
     - [ ] Dropdown: Website, Referral, Ads, Cold Call, Event, Other
  9. **Estimated Value**
     - [ ] Input type: number
     - [ ] Currency symbol prefix
     - [ ] Step: 100
  10. **Owner**
      - [ ] Searchable dropdown
      - [ ] Default: Current user
      - [ ] Display avatar + name
  11. **Tags**
      - [ ] Multi-select input
      - [ ] Create new tags inline
      - [ ] Color-coded chips
  12. **Address** (expandable section)
      - [ ] Street, City, State, ZIP, Country
  13. **Notes**
      - [ ] Textarea (3-4 rows)
      - [ ] Character count

- [ ] **Form Validation**
  - [ ] React Hook Form + Zod schema
  - [ ] Inline error messages (below each field)
  - [ ] Error styling: red border + text
  - [ ] Scroll to first error on submit

- [ ] **Submit Flow**
  - [ ] Validate form
  - [ ] Show loading spinner on button
  - [ ] Disable form during submission
  - [ ] API call to create lead document
  - [ ] Success:
    - [ ] Close modal
    - [ ] Show success toast: "Lead created successfully"
    - [ ] Refresh table data
    - [ ] Navigate to new lead detail page (optional)
  - [ ] Error:
    - [ ] Display error toast
    - [ ] Re-enable form
    - [ ] Keep modal open

- [ ] **Cancel Handling**
  - [ ] Prompt if form has unsaved changes
  - [ ] Confirmation dialog: "Discard changes?"

##### Lead Detail View (`app/(dashboard)/leads/[id]/page.tsx`)

###### Page Layout
- [ ] **Responsive Layout**
  - [ ] Two-column grid on desktop (60/40 split)
  - [ ] Stack on mobile (left column first)
  - [ ] Gap: `gap-6`

###### Left Column – Profile Info & Quick Actions

- [ ] **Profile Card**
  - [ ] Background: white/dark card
  - [ ] Padding: `p-6`
  - [ ] Shadow: `shadow-sm`

- [ ] **Header Section**
  - [ ] Large avatar (80x80px)
    - [ ] Initials fallback
    - [ ] Click to upload new photo
  - [ ] Name: H2 heading
  - [ ] Job Title: Muted text
  - [ ] Company name (clickable link to company)
  - [ ] Edit button (pencil icon, top right)

- [ ] **Status Section**
  - [ ] Current status badge (large)
  - [ ] Click to edit → Dropdown with all statuses
  - [ ] Auto-save on change
  - [ ] Log status change in activity timeline

- [ ] **Contact Information**
  - [ ] Email
    - [ ] Icon: Mail
    - [ ] Clickable mailto link
    - [ ] "Copy" button
  - [ ] Phone
    - [ ] Icon: Phone
    - [ ] Clickable tel link
    - [ ] "Copy" button
  - [ ] Address (if available)
    - [ ] Icon: MapPin
    - [ ] Formatted display

- [ ] **Quick Actions Bar**
  - [ ] Button: Call
    - [ ] Icon: Phone
    - [ ] Opens system dialer (mobile) or softphone
  - [ ] Button: Email
    - [ ] Icon: Mail
    - [ ] Opens email compose modal
  - [ ] Button: Schedule Meeting
    - [ ] Icon: Calendar
    - [ ] Opens calendar integration
  - [ ] Button: Add Note
    - [ ] Icon: FileText
    - [ ] Scrolls to timeline input

- [ ] **Lead Details Section**
  - [ ] Source: Badge with icon
  - [ ] Estimated Value: Large currency display
  - [ ] Owner: Avatar + Name
    - [ ] Click to reassign
  - [ ] Created: Relative time (e.g., "3 days ago")
  - [ ] Last Contacted: Relative time

- [ ] **Tags Section**
  - [ ] Display tags as chips
  - [ ] Add/Remove tags inline
  - [ ] Color-coded

- [ ] **Custom Fields**
  - [ ] Dynamic display based on `customFields` map
  - [ ] Label + Value pairs
  - [ ] Edit inline

- [ ] **Danger Zone**
  - [ ] "Convert to Contact" button
    - [ ] Opens confirmation dialog
    - [ ] Creates contact document
    - [ ] Archives lead
  - [ ] "Delete Lead" button
    - [ ] Opens confirmation dialog
    - [ ] Soft delete (archive)

###### Right Column – Activity Timeline

- [ ] **Timeline Header**
  - [ ] Title: "Activity Timeline"
  - [ ] Filter dropdown: All, Notes, Emails, Calls, Logs
  - [ ] Sort toggle: Newest/Oldest first

- [ ] **Add Note Input**
  - [ ] Textarea (expandable)
  - [ ] Placeholder: "Add a note..."
  - [ ] Toolbar: Bold, Italic, Link, Bullet list
  - [ ] Rich text editor (React-Quill or Tiptap)
  - [ ] Attachments button (upload files)
  - [ ] Mentions support (@username)
  - [ ] "Post" button
  - [ ] Auto-save draft to localStorage

- [ ] **Timeline Items**
  - [ ] Vertical timeline layout
  - [ ] Left: Icon + connecting line
  - [ ] Right: Content card

- [ ] **Activity Types & Icons**
  1. **Note**
     - [ ] Icon: StickyNote (blue)
     - [ ] Display: Rich text content
     - [ ] Author avatar + name
     - [ ] Timestamp (relative)
     - [ ] Edit/Delete actions (if author)
  2. **Email**
     - [ ] Icon: Mail (green)
     - [ ] Subject line
     - [ ] Snippet (first 100 chars)
     - [ ] Click to expand full email
     - [ ] "Reply" button
  3. **Call**
     - [ ] Icon: Phone (orange)
     - [ ] Duration
     - [ ] Notes from call
     - [ ] Recording link (if available)
  4. **Status Change**
     - [ ] Icon: RefreshCw (purple)
     - [ ] Display: "Status changed from X to Y"
     - [ ] Author + timestamp
  5. **Created**
     - [ ] Icon: Plus (gray)
     - [ ] Display: "Lead created by X"
  6. **Updated**
     - [ ] Icon: Edit (gray)
     - [ ] Display: "Field changed by X"
     - [ ] Show old → new values

- [ ] **Pagination/Lazy Loading**
  - [ ] Initial load: 10 items
  - [ ] "Load More" button at bottom
  - [ ] Or infinite scroll

- [ ] **Empty State**
  - [ ] Message: "No activity yet"
  - [ ] Illustration
  - [ ] CTA: "Add first note"

###### Edit Lead Modal
- [ ] **Trigger**
  - [ ] Edit button (pencil icon) in profile card
  - [ ] Pre-fill form with existing data
  - [ ] Same form structure as Create Lead
  - [ ] Submit → Update Firestore document
  - [ ] Show success toast
  - [ ] Refresh page data

#### 2.2 Contacts Module (`app/(dashboard)/contacts`)

##### Contacts List Page
- [ ] **Page Structure**
  - [ ] Same layout as Leads List
  - [ ] Header: "Contacts"
  - [ ] Create Contact button

- [ ] **Data Table Columns**
  1. Checkbox
  2. Name (Avatar + Full Name)
  3. Email
  4. Phone
  5. Company (linked)
  6. Job Title
  7. Owner
  8. Last Contacted
  9. Actions

- [ ] **Filters**
  - [ ] Company filter
  - [ ] Owner filter
  - [ ] Last contacted date range
  - [ ] Tags filter

- [ ] **Import Contacts**
  - [ ] Button: "Import" (next to Create)
  - [ ] Upload CSV file
  - [ ] Map CSV columns to contact fields
  - [ ] Preview imported data
  - [ ] Validate & import
  - [ ] Show progress bar
  - [ ] Error handling (duplicate emails)
  - [ ] Success summary: "X contacts imported, Y duplicates skipped"

##### Contact Detail View (`/contacts/[id]`)
- [ ] **Layout**
  - [ ] Similar to Lead Detail
  - [ ] Left: Profile + Company link
  - [ ] Right: Activity timeline

- [ ] **Additional Sections**
  - [ ] Associated Deals (card)
  - [ ] Recent Emails (card)
  - [ ] Meetings (card)

#### 2.3 Companies Module (`app/(dashboard)/companies`)

##### Companies List Page
- [ ] **Page Structure**
  - [ ] Header: "Companies"
  - [ ] Create Company button

- [ ] **Data Table Columns**
  1. Checkbox
  2. Company Name (with domain)
  3. Industry
  4. Company Size
  5. Annual Revenue
  6. Owner
  7. # of Contacts (badge)
  8. # of Deals (badge)
  9. Actions

- [ ] **Filters**
  - [ ] Industry filter
  - [ ] Size filter
  - [ ] Revenue range
  - [ ] Owner filter

##### Company Detail View (`/companies/[id]`)
- [ ] **Overview Section**
  - [ ] Company logo (editable)
  - [ ] Name, domain, industry, size
  - [ ] Addresses (billing/shipping)
  - [ ] Owner

- [ ] **Related Contacts Card**
  - [ ] List of contacts at this company
  - [ ] Add New Contact button
  - [ ] Click contact → navigate to contact detail

- [ ] **Related Deals Card**
  - [ ] List of deals with this company
  - [ ] Total deal value
  - [ ] Create Deal button

- [ ] **Activity Timeline**
  - [ ] Aggregated activities from all contacts/deals

---

### Phase 3: The Sales Engine (Deals & Pipeline)

#### 3.1 Pipeline Board (`app/(dashboard)/deals`)

##### Kanban View

###### Board Layout
- [ ] **Structure**
  - [ ] Horizontal scrollable container
  - [ ] Columns: Pipeline, Follow Up, Schedule Service, Conversation, Won, Lost
  - [ ] Each column: Fixed width (320px)
  - [ ] Gap between columns: `gap-4`

- [ ] **Column Header**
  - [ ] Stage name (bold)
  - [ ] Total deal count badge
  - [ ] Total value display (formatted currency)
  - [ ] Color indicator (left border)
    - Pipeline: Blue
    - Follow Up: Yellow
    - Schedule Service: Orange
    - Conversation: Purple
    - Won: Green
    - Lost: Red
  - [ ] Collapse/Expand toggle

- [ ] **Drag & Drop Implementation**
  - [ ] Library: `@dnd-kit/core`
  - [ ] Draggable deal cards
  - [ ] Drop zones: Each column
  - [ ] Visual feedback:
    - [ ] Card shadow on drag
    - [ ] Drop zone highlight
    - [ ] Smooth animation on drop
  - [ ] Auto-save on drop
  - [ ] Update deal stage in Firestore
  - [ ] Log activity: "Deal moved from X to Y"

###### Deal Cards
- [ ] **Card Design**
  - [ ] Background: white/dark
  - [ ] Padding: `p-4`
  - [ ] Shadow: `shadow-sm`
  - [ ] Rounded: `rounded-lg`
  - [ ] Hover: Lift effect

- [ ] **Card Content**
  - [ ] Deal title (bold, truncated)
  - [ ] Company name (muted, smaller)
  - [ ] Deal value (large, currency formatted)
  - [ ] Probability bar (visual progress)
    - [ ] Background: gray
    - [ ] Foreground: gradient (red→yellow→green based on %)
  - [ ] Owner avatar (bottom left)
  - [ ] Close date (bottom right, if set)
    - [ ] Red text if overdue
  - [ ] Tags (chips, max 2 visible + "+X more")

- [ ] **Card Actions**
  - [ ] Click card → navigate to deal detail
  - [ ] Hover: Show quick actions menu
    - [ ] Edit
    - [ ] Delete
    - [ ] Change owner

###### Board Actions
- [ ] **View Toggle**
  - [ ] Kanban | List | Table
  - [ ] Persist preference

- [ ] **Filters**
  - [ ] Owner filter
  - [ ] Date range (close date)
  - [ ] Value range
  - [ ] Tags filter

- [ ] **Create Deal Button**
  - [ ] Fixed position (top right)
  - [ ] Opens create deal modal

###### List View (Alternative)
- [ ] **Data Table**
  - [ ] Columns: Title, Company, Stage, Value, Probability, Close Date, Owner, Actions
  - [ ] Sortable, filterable
  - [ ] Similar to Leads table

##### Create Deal Modal
- [ ] **Form Fields**
  1. Deal Title (required)
  2. Company (searchable dropdown, required)
  3. Contacts (multi-select)
  4. Pipeline Stage
  5. Deal Value (required)
  6. Probability (0-100%)
  7. Expected Close Date
  8. Owner (default: current user)
  9. Tags
  10. Description (textarea)

- [ ] **Products/Services Section**
  - [ ] Add line items
  - [ ] Each item: Name, Quantity, Price
  - [ ] Auto-calculate total
  - [ ] Total = Deal Value

- [ ] **Submit Flow**
  - [ ] Validate form
  - [ ] Create deal document
  - [ ] Create activity: "Deal created"
  - [ ] Success toast
  - [ ] Refresh board or redirect to detail

#### 3.2 Deal Detail View (`/deals/[id]`)

##### Layout
- [ ] **Three-column layout**
  - [ ] Left (30%): Summary card
  - [ ] Center (50%): Details & Products
  - [ ] Right (20%): Related info

##### Left Column – Deal Summary
- [ ] **Overview Card**
  - [ ] Deal title (editable inline)
  - [ ] Company (linked)
  - [ ] Current stage badge
  - [ ] Value (large display)
  - [ ] Probability percentage
  - [ ] Expected close date
  - [ ] Owner (reassignable)

- [ ] **Stage Progress Stepper**
  - [ ] Vertical stepper
  - [ ] Show all stages
  - [ ] Current stage highlighted
  - [ ] Completed stages: green checkmark
  - [ ] Future stages: gray
  - [ ] Click stage → update (confirmation)

- [ ] **Quick Actions**
  - [ ] Mark as Won (green button)
  - [ ] Mark as Lost (red button)
    - [ ] Opens "Lost Reason" modal
  - [ ] Send Quote
  - [ ] Schedule Meeting

##### Center Column – Deal Details

- [ ] **Tabs**
  1. **Overview**
     - [ ] Description
     - [ ] Custom fields
  2. **Products/Services**
     - [ ] Line items table
       - Columns: Name, Quantity, Price, Total
     - [ ] Add/Remove items
     - [ ] Subtotal, Tax, Discount
     - [ ] Grand Total
     - [ ] "Generate Quote" button
  3. **Related Contacts**
     - [ ] List with avatars
     - [ ] Add Contact button
  4. **Files**
     - [ ] Uploaded documents
     - [ ] Upload button
     - [ ] Preview/Download actions
  5. **Activity**
     - [ ] Timeline (same as Lead)

##### Right Column – Related Info

- [ ] **Company Card**
  - [ ] Company name (linked)
  - [ ] Industry, size
  - [ ] "View all deals" link

- [ ] **Contacts Card**
  - [ ] List with avatars
  - [ ] Email/Phone quick actions

- [ ] **Tasks Card**
  - [ ] Open tasks related to this deal
  - [ ] Create Task button

---

### Phase 4: Operations (Projects & Tasks)

#### 4.1 Projects Module (`app/(dashboard)/projects`)

##### Projects List Page

###### View Modes
- [ ] **Cards Grid**
  - [ ] Responsive grid (1-3 columns)
  - [ ] Each card:
    - [ ] Project name
    - [ ] Status badge
    - [ ] Progress bar (0-100%)
    - [ ] Deadline date
    - [ ] Team avatars (overlapping)
    - [ ] Click → navigate to project detail

- [ ] **Table View**
  - [ ] Columns: Name, Status, Progress, Deadline, Team, Budget, Owner, Actions
  - [ ] Sortable, filterable

- [ ] **Board View**
  - [ ] Kanban by status
  - [ ] Columns: Planning, In Progress, Review, Completed, On Hold
  - [ ] Drag to update status

###### Filters
- [ ] Status filter
- [ ] Owner filter
- [ ] Deadline range
- [ ] Team member filter

##### Create Project Modal
- [ ] **Form Fields**
  1. Project Name (required)
  2. Description
  3. Status
  4. Linked Deal (dropdown)
  5. Start Date
  6. Deadline
  7. Budget
  8. Priority
  9. Owner
  10. Team Members (multi-select with avatars)

##### Project Detail View (`/projects/[id]`)

###### Overview Section
- [ ] Project name (editable)
- [ ] Description
- [ ] Status (editable dropdown)
- [ ] Progress percentage
  - [ ] Manual input or auto-calculated from tasks
- [ ] Dates (start, deadline, completion)
- [ ] Budget vs Actual Cost
- [ ] Owner + Team members

###### Gantt Chart
- [ ] **Library**: Custom or `react-gantt-chart`
- [ ] **Features**:
  - [ ] Timeline visualization
  - [ ] Task dependencies
  - [ ] Milestones
  - [ ] Drag to adjust dates
  - [ ] Zoom controls (day/week/month view)

###### Tasks Section
- [ ] List of tasks for this project
- [ ] Grouped by status
- [ ] Create Task button
- [ ] Inline edit task status

###### Files Section
- [ ] Upload files
- [ ] List with icons (by file type)
- [ ] Preview/Download

###### Activity Timeline
- [ ] Project-specific activities

#### 4.2 Tasks & Calendar (`app/(dashboard)/tasks`)

##### Tasks Page

###### View Modes
- [ ] **List View**
  - [ ] Grouped by status (Open, In Progress, Done)
  - [ ] Each task:
    - [ ] Checkbox (mark done)
    - [ ] Task subject
    - [ ] Type icon (To Do, Call, Email, Meeting)
    - [ ] Priority badge (High: red, Medium: yellow, Low: green)
    - [ ] Due date (red if overdue)
    - [ ] Assigned to (avatar)
    - [ ] Related to (linked entity)
    - [ ] Click → open task detail drawer

- [ ] **Calendar View**
  - [ ] Library: `react-big-calendar`
  - [ ] Month/Week/Day views
  - [ ] Tasks displayed on due date
  - [ ] Color-coded by priority
  - [ ] Click task → open detail drawer
  - [ ] Click empty slot → create task

- [ ] **My Tasks Widget**
  - [ ] Separate card/section
  - [ ] Filter: Assigned to current user
  - [ ] Grouped by: Today, Upcoming, Overdue
  - [ ] Quick actions: Mark done, Reschedule

###### Filters
- [ ] Type filter
- [ ] Priority filter
- [ ] Status filter
- [ ] Assigned to filter
- [ ] Due date range
- [ ] Related to filter (by entity type)

##### Create Task Drawer
- [ ] **Trigger**
  - [ ] "+ Create Task" button
  - [ ] Keyboard shortcut: `T`
  - [ ] Quick add from any page

- [ ] **Form Fields**
  1. Subject (required)
  2. Type (To Do, Call, Email, Meeting)
  3. Description
  4. Priority
  5. Due Date & Time
  6. Assigned To (default: current user)
  7. Related To (searchable across all entities)
  8. Reminder (dropdown: 15 min before, 1 hour before, etc.)

- [ ] **Submit**
  - [ ] Create task document
  - [ ] If reminder set → Schedule Cloud Function
  - [ ] Success toast
  - [ ] Add to list/calendar

##### Task Detail Drawer
- [ ] **Header**
  - [ ] Task subject (editable)
  - [ ] Status dropdown
  - [ ] Delete button

- [ ] **Body**
  - [ ] All task details (editable inline)
  - [ ] Mark as Done checkbox
  - [ ] Completion timestamp (if done)

- [ ] **Related Entity Card**
  - [ ] Link to lead/contact/deal/project
  - [ ] Quick preview info

- [ ] **Comments Section**
  - [ ] Add comment input
  - [ ] List of comments with timestamps

##### Automated Reminders
- [ ] **Cloud Function**
  - [ ] Triggered by scheduled time
  - [ ] Check tasks with upcoming reminders
  - [ ] Send notification:
    - [ ] In-app notification
    - [ ] Email notification (optional)
    - [ ] Push notification (mobile)
  - [ ] Mark reminder as sent

---

### Phase 5: Finance (Invoices)

#### 5.1 Invoices Module (`app/(dashboard)/invoices`)

##### Invoices List Page

###### Data Table
- [ ] **Columns**
  1. Checkbox
  2. Invoice Number (clickable)
  3. Client Name (linked)
  4. Issue Date
  5. Due Date
  6. Total Amount (currency formatted)
  7. Status Badge
     - Draft: gray
     - Sent: blue
     - Paid: green
     - Overdue: red
     - Cancelled: dark gray
  8. Actions (View, Edit, Delete, Download PDF, Send)

- [ ] **Filters**
  - [ ] Status filter
  - [ ] Client filter
  - [ ] Date range (issue/due date)
  - [ ] Amount range

- [ ] **Summary Cards** (above table)
  - [ ] Total Revenue (all paid invoices)
  - [ ] Outstanding Amount (sent + overdue)
  - [ ] Overdue Count (red badge)
  - [ ] Draft Count

##### Invoice Builder (`/invoices/create` or `/invoices/[id]/edit`)

###### Form Structure
- [ ] **Step-by-step or single page**
  - [ ] Recommend single page with sections

###### Invoice Header Section
- [ ] Company Logo (upload)
- [ ] Company Details (auto-fill from settings)
  - [ ] Name, Address, Phone, Email
  - [ ] Tax ID / Registration Number

###### Client Section
- [ ] **Select Client**
  - [ ] Searchable dropdown (companies or contacts)
  - [ ] Display: Name, Address
  - [ ] "Add New Client" button (inline form)

###### Invoice Details
- [ ] Invoice Number (auto-generated, editable)
- [ ] Issue Date (date picker, default: today)
- [ ] Due Date (date picker, default: +30 days)
- [ ] Payment Terms (dropdown: Net 15, Net 30, Net 60, Custom)
- [ ] Currency (dropdown)

###### Line Items Section
- [ ] **Dynamic Table**
  - [ ] Columns: Description, Quantity, Price, Tax%, Total
  - [ ] Each row:
    - [ ] Description: Text input (autocomplete from products)
    - [ ] Quantity: Number input
    - [ ] Price: Currency input
    - [ ] Tax: Percentage input (default from settings)
    - [ ] Total: Auto-calculated (read-only)
    - [ ] Delete button (icon)
  - [ ] "+ Add Line Item" button
  - [ ] Drag to reorder rows

- [ ] **Calculations Summary** (right-aligned)
  - [ ] Subtotal
  - [ ] Tax Amount
  - [ ] Discount (optional, percentage or fixed amount)
  - [ ] Grand Total (large, bold)

###### Additional Details
- [ ] Notes (textarea)
  - [ ] Visible to client
  - [ ] Example: "Thank you for your business"
- [ ] Terms & Conditions (textarea)
  - [ ] Payment terms, late fees, etc.
- [ ] Attachments (optional)
  - [ ] Upload files (PDFs, images)

###### Actions
- [ ] Save as Draft
- [ ] Save & Send (email to client)
- [ ] Preview
- [ ] Cancel

##### Invoice Detail / Preview (`/invoices/[id]`)

###### Preview Mode
- [ ] **Print-ready layout**
  - [ ] Clean design (no UI chrome)
  - [ ] Logo at top
  - [ ] Invoice title + number
  - [ ] From (company) & To (client) sections
  - [ ] Dates, payment terms
  - [ ] Line items table
  - [ ] Totals section
  - [ ] Notes & terms at bottom

- [ ] **Action Buttons** (sticky footer)
  - [ ] Edit
  - [ ] Download PDF
  - [ ] Send Email
  - [ ] Mark as Sent
  - [ ] Mark as Paid (date picker for paid date)
  - [ ] Cancel Invoice
  - [ ] Delete

##### PDF Generation
- [ ] **Library**: `@react-pdf/renderer`
- [ ] **Template**
  - [ ] Match preview layout
  - [ ] Professional styling
  - [ ] Custom fonts (optional)
  - [ ] Company branding

- [ ] **Download Flow**
  - [ ] Click "Download PDF"
  - [ ] Generate PDF on client or server
  - [ ] Trigger browser download
  - [ ] Filename: `Invoice_[NUMBER]_[CLIENT].pdf`

##### Email Sending
- [ ] **Email Compose Modal**
  - [ ] To: Client email (pre-filled)
  - [ ] Subject: "Invoice #[NUMBER] from [COMPANY]"
  - [ ] Body: Editable template
    - [ ] Default message
    - [ ] Merge tags: {client_name}, {invoice_number}, {due_date}, {total}
  - [ ] Attachment: PDF (auto-attached)
  - [ ] Send button

- [ ] **Send Logic**
  - [ ] API: SendGrid or Resend
  - [ ] Send email
  - [ ] Update invoice status to "Sent"
  - [ ] Log activity: "Invoice sent to [EMAIL]"
  - [ ] Success toast

##### Invoice Lifecycle Management
- [ ] **Status Transitions**
  - [ ] Draft → Sent: Manual or on email send
  - [ ] Sent → Paid: Manual (Mark as Paid)
  - [ ] Sent → Overdue: Automatic (Cloud Function checks daily)
  - [ ] Any → Cancelled: Manual

- [ ] **Overdue Handling**
  - [ ] Cloud Function (runs daily)
  - [ ] Check invoices where `dueDate < today` and `status = "Sent"`
  - [ ] Update status to "Overdue"
  - [ ] Send reminder email (optional)
  - [ ] Create notification for owner

- [ ] **Payment Recording**
  - [ ] "Mark as Paid" button
  - [ ] Date picker (default: today)
  - [ ] Update status
  - [ ] Log activity: "Payment received"
  - [ ] Update revenue dashboard

---

### Phase 6: Analytics & Reporting

#### 6.1 Dashboard Overview (`app/(dashboard)/page.tsx`)

##### Page Layout
- [ ] **Grid Layout**
  - [ ] Responsive: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
  - [ ] Gap: `gap-6`

##### KPI Cards (Top Row)
- [ ] **Card Design**
  - [ ] Background: white/dark
  - [ ] Padding: `p-6`
  - [ ] Shadow: `shadow-sm`
  - [ ] Rounded: `rounded-lg`

- [ ] **Total Revenue Card**
  - [ ] Icon: DollarSign (green)
  - [ ] Label: "Total Revenue"
  - [ ] Value: Large currency display
  - [ ] Change: "+12% from last month" (green/red)
  - [ ] Sparkline chart (optional)

- [ ] **Open Deals Card**
  - [ ] Icon: TrendingUp (blue)
  - [ ] Label: "Open Deals"
  - [ ] Value: Count
  - [ ] Sub-value: Total pipeline value

- [ ] **Conversion Rate Card**
  - [ ] Icon: Target (purple)
  - [ ] Label: "Lead to Deal Conversion"
  - [ ] Value: Percentage
  - [ ] Change indicator

- [ ] **Active Projects Card**
  - [ ] Icon: Briefcase (orange)
  - [ ] Label: "Active Projects"
  - [ ] Value: Count
  - [ ] Sub-value: "X due this week"

##### Charts Section

- [ ] **Projects by Stage (Pie Chart)**
  - [ ] Card with title: "Projects Distribution"
  - [ ] Library: Recharts PieChart
  - [ ] Data: Count per status (Planning, In Progress, Review, Completed)
  - [ ] Colors: Status-based
  - [ ] Tooltip: Show count & percentage
  - [ ] Legend: Below chart

- [ ] **Revenue Trends (Area Chart)**
  - [ ] Card with title: "Revenue Trend"
  - [ ] Library: Recharts AreaChart
  - [ ] X-axis: Time (Last 12 months)
  - [ ] Y-axis: Revenue (formatted currency)
  - [ ] Gradient fill (blue)
  - [ ] Tooltip: Show date & value
  - [ ] Date range selector: 7 days, 30 days, 90 days, 1 year

- [ ] **Team Performance (Bar Chart)**
  - [ ] Card with title: "Top Performers"
  - [ ] Library: Recharts BarChart
  - [ ] X-axis: Team member names
  - [ ] Y-axis: Deals closed or Revenue
  - [ ] Color: Primary blue
  - [ ] Tooltip: Show name & value

- [ ] **Leads by Source (Donut Chart)**
  - [ ] Card with title: "Lead Sources"
  - [ ] Library: Recharts PieChart with innerRadius
  - [ ] Data: Count per source
  - [ ] Colors: Distinct for each source
  - [ ] Center: Total leads count

##### Widgets

- [ ] **Recent Activities Widget**
  - [ ] Title: "Recent Activities"
  - [ ] List: Last 5-10 activities (all entities)
  - [ ] Each item:
    - [ ] Icon (based on type)
    - [ ] Description: "[User] [action] [entity]"
    - [ ] Timestamp (relative)
  - [ ] "View All" link

- [ ] **Upcoming Tasks Widget**
  - [ ] Title: "My Upcoming Tasks"
  - [ ] Filter: Assigned to current user, status Open/In Progress
  - [ ] List: Next 5 tasks
  - [ ] Each item:
    - [ ] Checkbox (mark done)
    - [ ] Task subject
    - [ ] Due date (red if today/overdue)
  - [ ] "View All" link

- [ ] **Deals Closing Soon Widget**
  - [ ] Title: "Deals Closing This Week"
  - [ ] Filter: Close date within next 7 days
  - [ ] List: Deals with value & owner
  - [ ] Click → navigate to deal

- [ ] **Overdue Invoices Widget**
  - [ ] Title: "Overdue Invoices"
  - [ ] Filter: Status = Overdue
  - [ ] List: Invoice number, client, amount, days overdue
  - [ ] Red warning badge
  - [ ] Click → navigate to invoice

##### Date Range Filter
- [ ] **Global Date Picker** (top right)
  - [ ] Affects: KPI cards, Charts
  - [ ] Presets: Today, Last 7 days, Last 30 days, Last 90 days, This year, All time
  - [ ] Custom range picker

#### 6.2 Report Generator

##### Reports Page (`/reports`)

###### Report Types
- [ ] **Sales Report**
  - [ ] Metrics: Deals won, Revenue, Conversion rates
  - [ ] Grouping: By owner, By source, By date
- [ ] **Leads Report**
  - [ ] Metrics: New leads, Qualified leads, Lost leads
  - [ ] Grouping: By status, By source, By owner
- [ ] **Invoice Report**
  - [ ] Metrics: Total invoiced, Paid, Outstanding, Overdue
  - [ ] Grouping: By client, By status, By date
- [ ] **Activity Report**
  - [ ] Metrics: Calls made, Emails sent, Meetings held
  - [ ] Grouping: By user, By entity type, By date

###### Report Builder UI
- [ ] **Configuration Panel**
  - [ ] Report Type selector
  - [ ] Date Range picker
  - [ ] Grouping options (checkboxes)
  - [ ] Filters (specific to report type)
  - [ ] "Generate Report" button

- [ ] **Results Display**
  - [ ] Summary cards (top)
  - [ ] Data table
  - [ ] Charts/visualizations
  - [ ] Loading state

- [ ] **Export Options**
  - [ ] Export to CSV
  - [ ] Export to PDF
  - [ ] Email report (schedule)

##### Scheduled Reports
- [ ] **Setup**
  - [ ] "Schedule Report" button
  - [ ] Modal: Select frequency (Daily, Weekly, Monthly)
  - [ ] Recipients (email list)
  - [ ] Save schedule

- [ ] **Cloud Function**
  - [ ] Triggered by schedule
  - [ ] Generate report
  - [ ] Send email with attachment

---

### Phase 7: Advanced Features

#### 7.1 Email Integration

##### Email Compose Modal
- [ ] **Trigger Locations**
  - [ ] Lead/Contact detail (quick action)
  - [ ] Deal detail
  - [ ] Anywhere (command palette)

- [ ] **Form Fields**
  - [ ] To (pre-filled, editable)
  - [ ] Cc, Bcc (optional)
  - [ ] Subject
  - [ ] Body (rich text editor)
    - [ ] Toolbar: Bold, Italic, Underline, Link, List, Image
    - [ ] Merge tags: {first_name}, {company_name}, etc.
    - [ ] Snippets/Templates dropdown
  - [ ] Attachments (drag & drop or browse)

- [ ] **Send Logic**
  - [ ] API: SendGrid or Resend
  - [ ] Send email
  - [ ] Log activity in related entity
  - [ ] Success toast
  - [ ] Save sent email to timeline

##### Email Templates
- [ ] **Templates Page** (`/settings/email-templates`)
  - [ ] List of templates
  - [ ] Create/Edit/Delete
  - [ ] Each template:
    - [ ] Name
    - [ ] Subject
    - [ ] Body (HTML)
    - [ ] Merge tags support

- [ ] **Template Selector**
  - [ ] In compose modal
  - [ ] Dropdown: Load template
  - [ ] Populate subject & body

##### Email Tracking
- [ ] **Tracking Pixel**
  - [ ] Embed 1x1 transparent image in email HTML
  - [ ] Unique URL per email: `/track/open/[emailId]`
  - [ ] API endpoint logs open event
  - [ ] Update activity: "Email opened"

- [ ] **Link Tracking**
  - [ ] Replace links with redirect URLs: `/track/click/[emailId]/[linkId]`
  - [ ] API endpoint logs click event, redirects to original URL
  - [ ] Update activity: "Link clicked"

- [ ] **Tracking Dashboard**
  - [ ] In email activity item, show:
    - [ ] Open status (checkmark icon)
    - [ ] Open count
    - [ ] Click count
    - [ ] Last opened timestamp

#### 7.2 Global Search (Command Palette)

##### Implementation
- [ ] **Library**: `cmdk`
- [ ] **Trigger**
  - [ ] Keyboard: `Cmd+K` (Mac) or `Ctrl+K` (Windows)
  - [ ] Click search bar in header
  - [ ] Store state in UI store

- [ ] **Modal Design**
  - [ ] Center screen overlay
  - [ ] Width: 600px
  - [ ] Input at top (auto-focused)
  - [ ] Results below (scrollable)
  - [ ] Footer: Keyboard hints

- [ ] **Search Logic**
  - [ ] Debounced input (200ms)
  - [ ] Multi-collection search:
    - [ ] Leads (name, email, company)
    - [ ] Contacts (name, email)
    - [ ] Companies (name, domain)
    - [ ] Deals (title, company)
    - [ ] Projects (name)
    - [ ] Tasks (subject)
    - [ ] Invoices (number, client)
  - [ ] Limit: 5 results per collection (total 35)

- [ ] **Results Display**
  - [ ] Grouped by collection
  - [ ] Each item:
    - [ ] Icon (collection-specific)
    - [ ] Primary text (name/title)
    - [ ] Secondary text (email/company)
    - [ ] Keyboard shortcut (↑↓ to navigate, Enter to open)
  - [ ] Click or Enter → Navigate to detail page
  - [ ] Escape → Close modal

- [ ] **Recent Searches**
  - [ ] Store in localStorage
  - [ ] Show when input empty
  - [ ] "Clear recent" button

- [ ] **Quick Actions**
  - [ ] When input starts with ">"
  - [ ] Commands:
    - [ ] ">new lead" → Open create lead modal
    - [ ] ">new deal" → Open create deal modal
    - [ ] ">new task" → Open create task drawer
    - [ ] ">reports" → Navigate to reports
    - [ ] ">settings" → Navigate to settings

#### 7.3 Notifications System

##### In-App Notifications

- [ ] **Notification Bell** (Header)
  - [ ] Icon: Bell (Lucide)
  - [ ] Badge: Unread count (red)
  - [ ] Click → Open dropdown

- [ ] **Notifications Dropdown**
  - [ ] Header: "Notifications"
  - [ ] Tabs: All | Unread
  - [ ] List of notifications (max 10)
  - [ ] Each notification:
    - [ ] Icon (based on type)
    - [ ] Message
    - [ ] Timestamp (relative)
    - [ ] Mark as read button (checkmark icon)
    - [ ] Click → Navigate to related entity
  - [ ] Footer: "View All" link
  - [ ] "Mark all as read" button

- [ ] **Notification Types**
  1. Task Due: "Task '[subject]' is due today"
  2. Deal Won: "[User] won deal '[title]'"
  3. Invoice Overdue: "Invoice #[number] is overdue"
  4. Lead Assigned: "[User] assigned you a lead"
  5. Comment Mention: "[User] mentioned you in a comment"
  6. Status Change: "Deal '[title]' moved to [stage]"

- [ ] **Notification Store** (Zustand)
  - [ ] State: `notifications: Notification[]`
  - [ ] Actions: `addNotification`, `markAsRead`, `markAllAsRead`, `deleteNotification`
  - [ ] Persist unread count

- [ ] **Real-time Updates**
  - [ ] Firestore onSnapshot listener
  - [ ] Subscribe to `notifications` collection where `userId = currentUser.uid`
  - [ ] On new notification → Add to store, show toast

##### Push Notifications (Optional)
- [ ] **Firebase Cloud Messaging**
  - [ ] Register service worker
  - [ ] Request notification permission
  - [ ] Store FCM token in user document
  - [ ] Cloud Function sends push on events

#### 7.4 Activity Logging (Auto-log)

##### What to Log
- [ ] **Create Events**
  - [ ] Lead created
  - [ ] Contact created
  - [ ] Deal created
  - [ ] etc.

- [ ] **Update Events**
  - [ ] Status change (Lead, Deal, Project)
  - [ ] Owner reassignment
  - [ ] Field updates (if significant)

- [ ] **Delete Events**
  - [ ] Entity deleted (soft delete)

- [ ] **Custom Events**
  - [ ] Email sent
  - [ ] Call logged
  - [ ] Meeting scheduled
  - [ ] Note added

##### Implementation
- [ ] **Activity Service** (`lib/activity.ts`)
  - [ ] Function: `logActivity(params)`
    - [ ] Parameters: type, content, relatedTo, metadata
    - [ ] Create activity document in Firestore
    - [ ] Include timestamp, performedBy

- [ ] **Integration Points**
  - [ ] Call `logActivity()` after every create/update/delete
  - [ ] Example: After updating deal stage:
    ```typescript
    await logActivity({
      type: 'status_change',
      content: `Deal stage changed from ${oldStage} to ${newStage}`,
      relatedTo: { collection: 'deals', id: dealId },
      metadata: { oldValue: oldStage, newValue: newStage, field: 'pipelineStage' }
    })
    ```

##### Mentions System
- [ ] **Rich Text Editor**
  - [ ] Detect "@" character
  - [ ] Show user dropdown (autocomplete)
  - [ ] On select: Insert user mention with ID
  - [ ] Store as: `@[userId:userName]` or custom format

- [ ] **On Save**
  - [ ] Parse content for mentions
  - [ ] Extract mentioned user IDs
  - [ ] Create notification for each mentioned user
  - [ ] Type: "mention"

- [ ] **Display**
  - [ ] In activity timeline, render mentions as clickable links
  - [ ] Highlight mentions (blue background)

---

### Phase 8: Polish & Production

#### 8.1 Performance Optimization

##### React Optimization
- [ ] **Code Splitting**
  - [ ] Use dynamic imports for large components
  - [ ] Example: `const ReportGenerator = dynamic(() => import('@/components/ReportGenerator'))`
  - [ ] Split by route (automatic with Next.js App Router)

- [ ] **React.Suspense**
  - [ ] Wrap async Server Components in Suspense
  - [ ] Provide loading fallback (skeleton)
  - [ ] Example:
    ```tsx
    <Suspense fallback={<LeadsTableSkeleton />}>
      <LeadsTable />
    </Suspense>
    ```

- [ ] **Memoization**
  - [ ] Use `React.memo()` for expensive components
  - [ ] Use `useMemo()` for expensive calculations
  - [ ] Use `useCallback()` for callbacks passed to children

- [ ] **Virtual Scrolling**
  - [ ] For very long lists (1000+ items)
  - [ ] Library: `react-virtual` or `react-window`
  - [ ] Implement in tables if needed

##### Data Fetching
- [ ] **Server Components**
  - [ ] Fetch data in Server Components where possible
  - [ ] Reduces client bundle size
  - [ ] Improves SEO

- [ ] **Parallel Fetching**
  - [ ] Use `Promise.all()` for independent queries
  - [ ] Example:
    ```typescript
    const [leads, users] = await Promise.all([
      getLeads(),
      getUsers()
    ])
    ```

- [ ] **Pagination**
  - [ ] Always paginate large datasets
  - [ ] Use Firestore `limit()` and `startAfter()`

- [ ] **Caching**
  - [ ] Next.js: Use `fetch()` with cache options
  - [ ] Client-side: Consider React Query or SWR for caching

##### Image Optimization
- [ ] **Next.js Image Component**
  - [ ] Use `next/image` for all images
  - [ ] Automatic lazy loading
  - [ ] Responsive images (srcset)
  - [ ] WebP format

- [ ] **Avatar Optimization**
  - [ ] Resize avatars to small size (80x80, 40x40)
  - [ ] Compress before upload
  - [ ] Use Firebase Storage thumbnails

##### Bundle Size
- [ ] **Analyze Bundle**
  - [ ] Run `npm run build` and check size
  - [ ] Use `@next/bundle-analyzer`
  - [ ] Identify large dependencies

- [ ] **Tree Shaking**
  - [ ] Import only what you need
  - [ ] Example: `import { Button } from '@/components/ui/button'` not `import * as UI from '@/components/ui'`

- [ ] **Remove Unused Code**
  - [ ] Run linter to find unused imports/variables
  - [ ] Delete dead code

#### 8.2 Security

##### Firestore Security Rules
- [ ] **Authentication Check**
  - [ ] All rules require `request.auth != null`

- [ ] **Role-Based Rules**
  - [ ] Example:
    ```javascript
    match /leads/{leadId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.role in ['admin', 'manager', 'sales'];
      allow update, delete: if request.auth != null && (resource.data.ownerId == request.auth.uid || request.auth.token.role == 'admin');
    }
    ```

- [ ] **Field Validation**
  - [ ] Validate required fields
  - [ ] Validate data types
  - [ ] Example:
    ```javascript
    allow create: if request.resource.data.keys().hasAll(['firstName', 'lastName', 'email']);
    ```

- [ ] **Test Rules**
  - [ ] Use Firebase Emulator
  - [ ] Write unit tests for rules

##### Storage Security Rules
- [ ] **Authentication Check**
  - [ ] All uploads require auth

- [ ] **File Type Validation**
  - [ ] Allow only specific types: image/*, application/pdf
  - [ ] Example:
    ```javascript
    allow write: if request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf';
    ```

- [ ] **File Size Limit**
  - [ ] Max 5MB per file
  - [ ] Example:
    ```javascript
    allow write: if request.resource.size < 5 * 1024 * 1024;
    ```

##### Environment Variables
- [ ] **Validation**
  - [ ] Use Zod to validate env vars on startup
  - [ ] Throw error if missing/invalid

- [ ] **Never Expose Secrets**
  - [ ] Only `NEXT_PUBLIC_*` vars are exposed to client
  - [ ] Keep API keys, private keys server-side only

##### API Routes
- [ ] **Rate Limiting**
  - [ ] Implement rate limiting middleware
  - [ ] Example: 100 requests per 15 minutes per user

- [ ] **Input Validation**
  - [ ] Validate all inputs with Zod
  - [ ] Return 400 Bad Request for invalid input

- [ ] **Error Handling**
  - [ ] Never expose internal errors to client
  - [ ] Log errors server-side
  - [ ] Return generic error messages

#### 8.3 Error Handling

##### Global Error Boundary
- [ ] **Create Error Boundary Component**
  - [ ] Catch React errors
  - [ ] Display fallback UI
  - [ ] Log error to monitoring service (e.g., Sentry)

- [ ] **Wrap App**
  - [ ] In root layout or app component

##### API Error Handling
- [ ] **Try-Catch Blocks**
  - [ ] Wrap all async operations
  - [ ] Example:
    ```typescript
    try {
      const lead = await createLead(data)
      return { success: true, data: lead }
    } catch (error) {
      console.error('Failed to create lead:', error)
      return { success: false, error: 'Failed to create lead' }
    }
    ```

- [ ] **Toast Notifications**
  - [ ] Show error toast on failure
  - [ ] User-friendly messages
  - [ ] Example: "Failed to create lead. Please try again."

##### Empty States
- [ ] **Design Empty State Components**
  - [ ] Illustration (optional)
  - [ ] Message: "No [entities] yet"
  - [ ] Description: Brief explanation
  - [ ] CTA: "Create [entity]" button

- [ ] **Implement Everywhere**
  - [ ] Tables with no data
  - [ ] Filters with no results
  - [ ] Timelines with no activity
  - [ ] etc.

##### Loading States
- [ ] **Skeleton Screens**
  - [ ] Create skeleton versions of all major components
  - [ ] Match layout of actual component
  - [ ] Use Shadcn Skeleton component
  - [ ] Shimmer animation

- [ ] **Spinners**
  - [ ] For inline loading (e.g., button loading)
  - [ ] Size: Small, Medium, Large

- [ ] **Progress Indicators**
  - [ ] For long operations (e.g., CSV import)
  - [ ] Show percentage or step number

#### 8.4 Accessibility (a11y)

##### Keyboard Navigation
- [ ] **Tab Order**
  - [ ] Ensure logical tab order
  - [ ] Test with Tab key

- [ ] **Keyboard Shortcuts**
  - [ ] Document all shortcuts
  - [ ] Display hints in UI (e.g., "⌘K to search")
  - [ ] Allow customization (optional)

- [ ] **Focus Indicators**
  - [ ] Visible focus outline on all interactive elements
  - [ ] Use `:focus-visible` for better UX

##### ARIA Attributes
- [ ] **Use Semantic HTML**
  - [ ] `<button>`, `<nav>`, `<header>`, `<main>`, etc.

- [ ] **ARIA Labels**
  - [ ] Add `aria-label` to icon-only buttons
  - [ ] Example: `<button aria-label="Close modal">...</button>`

- [ ] **ARIA Roles**
  - [ ] Use when semantic HTML not available
  - [ ] Example: `<div role="dialog">...</div>`

##### Screen Reader Testing
- [ ] **Test with NVDA/JAWS (Windows)**
- [ ] **Test with VoiceOver (Mac/iOS)**
- [ ] **Ensure all content is readable**
- [ ] **Test forms for proper labeling**

##### Color Contrast
- [ ] **WCAG AA Compliance**
  - [ ] Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
  - [ ] Use contrast checker tool
  - [ ] Adjust colors if needed

- [ ] **Don't Rely on Color Alone**
  - [ ] Use icons + text for status indicators
  - [ ] Example: Green checkmark + "Paid" text, not just green

#### 8.5 Testing

##### Unit Testing
- [ ] **Setup**
  - [ ] Framework: Jest or Vitest
  - [ ] Library: React Testing Library
  - [ ] Install: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`

- [ ] **Write Tests**
  - [ ] Utility functions (formatters, validators)
  - [ ] React components (render, interactions)
  - [ ] Custom hooks

- [ ] **Coverage**
  - [ ] Aim for 80%+ coverage
  - [ ] Focus on critical paths

##### Integration Testing
- [ ] **Test API Routes**
  - [ ] Mock Firebase
  - [ ] Test request/response

- [ ] **Test User Flows**
  - [ ] Example: Create lead → Update status → Delete
  - [ ] Use Playwright or Cypress

##### E2E Testing (Optional)
- [ ] **Framework**: Playwright or Cypress
- [ ] **Key Flows to Test**
  - [ ] User registration & login
  - [ ] Create and manage lead
  - [ ] Create deal and move through pipeline
  - [ ] Generate and send invoice

#### 8.6 Deployment

##### Vercel Deployment
- [ ] **Connect Repository**
  - [ ] Link GitHub/GitLab repo to Vercel
  - [ ] Auto-deploy on push to main

- [ ] **Environment Variables**
  - [ ] Add all env vars in Vercel dashboard
  - [ ] Separate for Production and Preview

- [ ] **Custom Domain**
  - [ ] Add custom domain in Vercel
  - [ ] Configure DNS records
  - [ ] Enable HTTPS (automatic)

- [ ] **Build Settings**
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
  - [ ] Node version: 18.x or 20.x

##### Firebase Configuration
- [ ] **Production Project**
  - [ ] Create separate Firebase project for production
  - [ ] Deploy Firestore indexes
  - [ ] Deploy Storage rules
  - [ ] Deploy Security rules

- [ ] **Cloud Functions**
  - [ ] Deploy functions: `firebase deploy --only functions`
  - [ ] Monitor logs in Firebase Console

##### Monitoring & Analytics
- [ ] **Error Tracking**
  - [ ] Setup Sentry
  - [ ] Add Sentry to Next.js: `@sentry/nextjs`
  - [ ] Track errors in production

- [ ] **Analytics**
  - [ ] Google Analytics or Mixpanel
  - [ ] Track: Page views, User actions, Conversions

- [ ] **Performance Monitoring**
  - [ ] Vercel Analytics (built-in)
  - [ ] Firebase Performance Monitoring

##### Backup & Disaster Recovery
- [ ] **Database Backups**
  - [ ] Schedule automatic Firestore exports
  - [ ] Cloud Function to export daily
  - [ ] Store in Cloud Storage

- [ ] **Recovery Plan**
  - [ ] Document recovery procedure
  - [ ] Test restore process

---

## 5. UI/UX Design System Reference

### Anatomy of a Page
1. **Page Header**
   - [ ] Breadcrumbs (top)
   - [ ] Page title (H1)
   - [ ] Description (muted text)
   - [ ] Primary action button (right-aligned)

2. **Filter Bar**
   - [ ] Search input (left)
   - [ ] Filter buttons/dropdowns (middle)
   - [ ] View toggle buttons (right)

3. **Content Area**
   - [ ] White card container
   - [ ] Shadow: `shadow-sm`
   - [ ] Rounded: `rounded-lg`
   - [ ] Padding: `p-6`

### Brand Colors (Tailwind Config)
```javascript
colors: {
  primary: {
    DEFAULT: "#3B82F6", // Blue-500
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
    foreground: "#FFFFFF",
  },
  success: {
    DEFAULT: "#10B981", // Green-500
    foreground: "#FFFFFF",
  },
  warning: {
    DEFAULT: "#F59E0B", // Amber-500
    foreground: "#FFFFFF",
  },
  danger: {
    DEFAULT: "#EF4444", // Red-500
    foreground: "#FFFFFF",
  },
  background: "#F3F4F6", // Gray-100
  surface: "#FFFFFF",
  muted: "#6B7280", // Gray-500
  border: "#E5E7EB", // Gray-200
}
```

### Typography
```javascript
fontSize: {
  'xs': '0.75rem',     // 12px
  'sm': '0.875rem',    // 14px
  'base': '1rem',      // 16px
  'lg': '1.125rem',    // 18px
  'xl': '1.25rem',     // 20px
  '2xl': '1.5rem',     // 24px
  '3xl': '1.875rem',   // 30px
  '4xl': '2.25rem',    // 36px
}
```

### Spacing
```javascript
spacing: {
  '0': '0',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '12': '3rem',    // 48px
}
```

### Components Checklist
- [x] **Sidebar**: 240px fixed width, collapsible to 64px (icon-only)
- [x] **StatusBadge**: `px-2.5 py-0.5 rounded-full text-xs font-medium`
  - [ ] Colors: blue (new), yellow (in progress), green (success), red (danger)
- [x] **AvatarGroup**: Overlapping avatars for teams (`-ml-2` for each after first)
- [x] **ProgressBar**: For deal probability or project completion
  - [ ] Background: gray-200
  - [ ] Fill: primary-500
  - [ ] Height: `h-2`
  - [ ] Rounded: `rounded-full`
- [x] **DataTable**: Reusable table component with sorting, filtering, pagination
- [x] **EmptyState**: Illustration + message + CTA button
- [x] **Skeleton**: Loading placeholder with shimmer animation

### Animations
- [ ] **Transitions**
  - [ ] Duration: 150-300ms
  - [ ] Easing: `ease-in-out`
  - [ ] Properties: opacity, transform, background-color

- [ ] **Hover Effects**
  - [ ] Scale: `hover:scale-105`
  - [ ] Shadow lift: `hover:shadow-md`
  - [ ] Opacity: `hover:opacity-80`

- [ ] **Page Transitions** (Framer Motion)
  - [ ] Fade in on mount
  - [ ] Slide in from right (for modals/drawers)

### Responsive Breakpoints
```javascript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### Dark Mode Support
- [ ] **Theme Toggle**
  - [ ] Sun/Moon icon
  - [ ] Persist preference in localStorage
  - [ ] Apply via `next-themes`

- [ ] **Color Adjustments**
  - [ ] Background: `bg-white dark:bg-gray-900`
  - [ ] Text: `text-gray-900 dark:text-gray-100`
  - [ ] Borders: `border-gray-200 dark:border-gray-700`

---

## 6. Implementation Checklist Summary

### Phase 0: Project Initiation & Architecture ✓
- [x] Scaffold Next.js project
- [x] Setup design system (Tailwind + Shadcn)
- [x] Configure Firebase
- [x] Setup state management (Zustand)
- [x] Create utility functions & types

### Phase 1: Authentication & Foundation
- [ ] Build auth pages (login, register, forgot password)
- [ ] Create dashboard layout with sidebar & header
- [ ] Implement RBAC middleware
- [ ] Mobile navigation

### Phase 2: CRM Core
- [ ] Leads module (list, create, detail, filters)
- [ ] Contacts module (list, create, detail, import)
- [ ] Companies module (list, create, detail, relationships)

### Phase 3: Sales Engine
- [ ] Deals pipeline (Kanban board with drag & drop)
- [ ] Deal detail view with stage progression
- [ ] Products/services management

### Phase 4: Operations
- [ ] Projects module (list, board, Gantt chart)
- [ ] Tasks & calendar (list, calendar view, reminders)

### Phase 5: Finance
- [ ] Invoice builder (line items, calculations)
- [ ] PDF generation & download
- [ ] Email sending
- [ ] Invoice lifecycle management

### Phase 6: Analytics & Reporting
- [ ] Dashboard with KPI cards & charts
- [ ] Report generator
- [ ] Export functionality

### Phase 7: Advanced Features
- [ ] Email integration (compose, templates, tracking)
- [ ] Global search (command palette)
- [ ] Notifications system
- [ ] Activity auto-logging & mentions

### Phase 8: Polish & Production
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Error handling & empty states
- [ ] Accessibility improvements
- [ ] Testing (unit, integration, E2E)
- [ ] Deployment to Vercel
- [ ] Monitoring & analytics

---

## 7. Next Steps

**Immediate Actions**:
1. Review and approve this implementation plan
2. Setup development environment
3. Begin Phase 0: Project Initiation
4. Create Git repository and initial commit
5. Setup Firebase project and configure credentials

**Development Approach**:
- Work in sprints (1-2 weeks per phase)
- Regular code reviews
- Continuous testing
- Iterative improvements

**Success Metrics**:
- Page load time < 2 seconds
- Time to Interactive < 3 seconds
- Lighthouse score > 90
- Zero critical security vulnerabilities
- 80%+ test coverage
- Mobile-responsive across all devices

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2025  
**Status**: Ready for Implementation

---

This comprehensive plan provides granular, actionable steps for building a production-ready CRM from scratch. Each checkbox represents a concrete deliverable that can be implemented, tested, and verified. Let's build something amazing! 🚀
      