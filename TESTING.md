# Playwright E2E Testing Framework

## Quick Start

```bash
# Install Playwright and browser (first time only)
npm run test:install

# Run all tests (dev server starts automatically)
npm run test

# Run tests with UI mode
npm run test:ui

# Run tests headed (see browser)
npm run test:headed

# Debug a single test
npm run test:debug

# View test report
npm run test:report
```

## Project Structure

```
tests/
├── e2e/                    # Test spec files (organized by feature module)
│   ├── auth/               # Authentication tests
│   ├── leads/              # Lead management tests
│   ├── contacts/           # Contact management tests
│   ├── companies/          # Company management tests
│   ├── deals/              # Deal pipeline tests
│   ├── projects/           # Project management tests
│   ├── tasks/              # Task management tests
│   ├── invoices/           # Invoice management tests
│   ├── dashboard/          # Dashboard tests
│   ├── permissions/        # RBAC and permission tests
│   └── generated/          # AI-generated tests (future)
│
├── fixtures/               # Shared test fixtures
│   └── auth.ts             # Authenticated fixtures per role (admin, manager, team)
│
├── pages/                  # Page Object Models
│   ├── base.page.ts        # Base page with common methods
│   ├── login.page.ts       # Login page
│   ├── dashboard.page.ts   # Dashboard page
│   ├── leads.page.ts       # Leads page
│   ├── contacts.page.ts    # Contacts page
│   └── deals.page.ts       # Deals page
│
├── helpers/                # Utility functions
│   ├── auth.ts             # Login, logout, auth checks
│   ├── navigation.ts       # URL navigation, sidebar, breadcrumbs
│   ├── wait.ts             # Wait helpers (loading, toasts, spinners)
│   ├── data.ts             # Random test data generation
│   └── screenshot.ts       # Screenshot utilities
│
├── data/                   # Constants and configuration
│   ├── users.ts            # Test user credentials
│   └── urls.ts             # Application URL constants
│
├── reports/                # HTML test reports (gitignored)
├── screenshots/            # Failure screenshots (gitignored)
├── videos/                 # Failure videos (gitignored)
├── traces/                 # Trace files (gitignored)
└── tsconfig.json           # TypeScript config for tests
```

## Test Fixtures (Authentication)

The framework provides pre-authenticated page fixtures for each role:

```ts
import { test, expect } from "../fixtures/auth";

test("admin test", async ({ adminPage }) => {
  // adminPage is already logged in as admin
});

test("manager test", async ({ managerPage }) => {
  // managerPage is already logged in as manager
});

test("team test", async ({ teamPage }) => {
  // teamPage is already logged in as team member
});

test("unauthenticated", async ({ page }) => {
  // page is a clean browser context (not logged in)
});
```

Each fixture automatically logs in via the actual UI login flow using credentials from `.env.test`.

## Test User Setup

Create these test accounts in your Firebase project:

1. Go to Firebase Console → Authentication → Add User
2. Create users with the following roles (assign custom claims):

| Email | Password | Role |
|-------|----------|------|
| `test.admin@excelbees.com` | `Test@Admin2026!` | admin |
| `test.manager@excelbees.com` | `Test@Manager2026!` | manager |
| `test.team@excelbees.com` | `Test@Team2026!` | team |
| `test.scanner@excelbees.com` | `Test@Scanner2026!` | team |

Override credentials via `.env.test`:
```env
TEST_ADMIN_EMAIL=your-admin@example.com
TEST_ADMIN_PASSWORD=your-password
```

## Writing Tests

### Basic Example

```ts
import { test, expect } from "../fixtures/auth";
import { LoginPage } from "../pages/login.page";

test.describe("Login", () => {
  test("can login with valid credentials", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("user@example.com", "password");
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

### Using Page Objects

```ts
import { LeadsPage } from "../pages/leads.page";
import { randomName, randomEmail } from "../helpers/data";

test("create lead", async ({ adminPage }) => {
  const orgId = getOrgId(adminPage.url());
  const leads = new LeadsPage(adminPage);
  await leads.goto(orgId);
  await leads.createButton.click();
  // Fill form, submit, verify
});
```

### Selector Best Practices

Prefer accessible selectors:
- `page.getByRole('button', { name: 'Save' })` - buttons by text
- `page.getByLabel('Email')` - form fields by label
- `page.getByPlaceholder('Search...')` - inputs by placeholder
- `page.getByText('Welcome')` - text content
- `page.locator('input[type="email"]')` - when necessary

Avoid:
- CSS class selectors (`.bg-primary`) - classes change
- XPath selectors
- Data attributes (unless added specifically for testing)
- `page.waitForTimeout()` - use proper wait strategies

### Waiting Strategies

```ts
// Wait for page load
await page.waitForLoadState("networkidle");

// Wait for specific element
await page.getByText("Loading...").waitFor({ state: "hidden" });

// Wait for toast message
await waitForToast(page, "Saved successfully", "success");

// Wait for spinner to disappear
await waitForLoadingSpinner(page);
```

## Reports & Artifacts

| Artifact | Location | When Generated |
|----------|----------|----------------|
| HTML Report | `tests/reports/` | Every run |
| Screenshots | `tests/screenshots/` | On test failure |
| Videos | `tests/videos/` | On test failure |
| Traces | `tests/traces/` | On first retry |

View the HTML report:
```bash
npm run test:report
```

## CI/CD Configuration

### GitHub Actions Example

```yaml
- name: Run E2E tests
  run: npm run test:ci
  env:
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
    TEST_MANAGER_EMAIL: ${{ secrets.TEST_MANAGER_EMAIL }}
    TEST_MANAGER_PASSWORD: ${{ secrets.TEST_MANAGER_PASSWORD }}
    TEST_TEAM_EMAIL: ${{ secrets.TEST_TEAM_EMAIL }}
    TEST_TEAM_PASSWORD: ${{ secrets.TEST_TEAM_PASSWORD }}
```

## AI-Generated Tests

Tests generated from `humanlike-test-case.md` should be placed in `tests/generated/`.

They should follow the same patterns:
- Import from `tests/fixtures/auth.ts` for authenticated fixtures
- Use page objects from `tests/pages/` where applicable
- Use helpers from `tests/helpers/` for common operations

## Adding New Page Objects

1. Create file in `tests/pages/`
2. Extend `BasePage` for common functionality
3. Add URL constant in `tests/data/urls.ts`
4. Register routes as needed

## Adding New Feature Tests

1. Create directory in `tests/e2e/` (e.g., `tests/e2e/invoices/`)
2. Create spec files (e.g., `tests/e2e/invoices/create.spec.ts`)
3. Import from `tests/fixtures/auth.ts`
4. Use page objects and helpers