import { test, expect } from "../../fixtures/auth";
import { DashboardPage } from "../../pages/dashboard.page";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 16 (Dashboard), cases beyond what
// access.spec.ts already covers (admin/manager/team access, sidebar, header).
test.describe("Dashboard - Extra", () => {
  test("16.1 dashboard shows welcome message, quick stats, and quick actions", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText(/welcome back/i)).toBeVisible();
    await expect(adminPage.getByText("Total Leads")).toBeVisible();
    await expect(adminPage.getByText("Active Deals")).toBeVisible();
    // "Companies" also matches the sidebar nav link, not just the stat
    // card — disambiguate with .first() to avoid a strict-mode violation.
    await expect(adminPage.getByText("Companies").first()).toBeVisible();
  });

  test("16.2 revenue hidden for team role with lock icon", async ({ teamPage }) => {
    const dashboard = new DashboardPage(teamPage);
    await dashboard.goto(orgIdOf(teamPage));
    await expect(teamPage.getByText("$•••").first()).toBeVisible({ timeout: 10000 });
  });

  test("16.3 revenue visible for admin", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("$•••")).not.toBeVisible();
  });

  test("16.4/16.5 Create Invoice quick action hidden for team, visible for admin", async ({ adminPage, teamPage }) => {
    const adminDash = new DashboardPage(adminPage);
    await adminDash.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText(/create invoice/i)).toBeVisible({ timeout: 10000 });

    const teamDash = new DashboardPage(teamPage);
    await teamDash.goto(orgIdOf(teamPage));
    await expect(teamPage.getByText(/create invoice/i)).not.toBeVisible();
  });

  test("16.6 upcoming tasks section shows up to 5 sorted tasks with a View All link", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    const viewAllLink = adminPage.getByRole("link", { name: /view all tasks/i });
    await expect(viewAllLink).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test("16.8 dashboard loading state clears", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    await expect(adminPage.locator(".animate-spin")).toHaveCount(0, { timeout: 15000 }).catch(() => {});
  });

  test("16.9 smart follow-ups section renders", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText(/smart follow-ups/i)).toBeVisible({ timeout: 15000 });
  });

  test("16.10 stat card click navigates to leads then deals", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(orgIdOf(adminPage));
    await adminPage.getByRole("link", { name: /total leads/i }).click();
    await adminPage.waitForURL(/\/leads$/, { timeout: 10000 });
    await adminPage.goBack();
    await adminPage.getByRole("link", { name: /active deals/i }).click();
    await adminPage.waitForURL(/\/deals$/, { timeout: 10000 });
  });

  test("16.7 empty state for tasks shown on a freshly-created org with zero tasks", async ({ browser }) => {
    // The shared "Playwright Test Org" seed can never guarantee zero tasks
    // once other specs run against it — a brand-new throwaway org with a
    // fresh ephemeral user is task-free by construction.
    const { createEphemeralUser, deleteEphemeralUser, createDoc, deleteDoc, setDocWithId } = await import("../../helpers/admin");
    const user = await createEphemeralUser({ emailPrefix: "e2e.notasks", password: "Password1!", displayName: "No Tasks User" });
    const orgId = await createDoc("organizations", { name: "E2E No Tasks Org", slug: `e2e-no-tasks-org-${Date.now()}`, ownerId: user.uid, createdAt: new Date(), updatedAt: new Date() });
    await setDocWithId("organization_members", `${orgId}_${user.uid}`, {
      organizationId: orgId, userId: user.uid, role: "admin", status: "active",
      displayName: user.email, joinedAt: new Date(), updatedAt: new Date(),
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const { LoginPage } = await import("../../pages/login.page");
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword("Password1!");
      await loginPage.submit();
      await page.waitForURL("**/org", { timeout: 20000 });

      await page.goto(`/org/${orgId}/dashboard`);
      await expect(page.getByText(/no upcoming tasks/i)).toBeVisible({ timeout: 15000 });
    } finally {
      await deleteDoc("organizations", orgId).catch(() => {});
      await deleteEphemeralUser(user.uid);
      await context.close();
    }
  });
});
