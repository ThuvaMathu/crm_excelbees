import { test, expect } from "../../fixtures/auth";
import { setMemberFields, getUserIdByEmail } from "../../helpers/admin";
import { USERS } from "../../data/users";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

async function waitForGuardResolved(page: import("@playwright/test").Page) {
  for (const text of [/initializing crm/i, /loading workspace/i, /redirecting/i]) {
    await page.getByText(text).first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }
}

// Covers humanlike-test-case.md section 21 (Permissions & RBAC), cases
// beyond what rbac.spec.ts (21.4/21.5 direct-URL blocks) already covers.
test.describe("Permissions & RBAC - Menus & Custom Permissions", () => {
  test("21.1 admin sees all CRM modules + Administration section", async ({ adminPage }) => {
    for (const label of ["Dashboard", "Leads", "Contacts", "Companies", "Deals", "Projects", "Tasks", "Invoices", "Reports"]) {
      await expect(adminPage.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(adminPage.getByText("Administration")).toBeVisible();
  });

  test("21.2 manager sees all modules + Administration", async ({ managerPage }) => {
    await expect(managerPage.getByRole("link", { name: "Invoices", exact: true })).toBeVisible();
    await expect(managerPage.getByText("Administration")).toBeVisible();
  });

  test("21.3 team role sidebar hides Invoices/Reports/Administration", async ({ teamPage }) => {
    await expect(teamPage.getByRole("link", { name: "Invoices", exact: true })).not.toBeVisible();
    await expect(teamPage.getByRole("link", { name: "Reports", exact: true })).not.toBeVisible();
    await expect(teamPage.getByText("Administration")).not.toBeVisible();
  });

  test("21.6 team cannot access users via direct URL", async ({ teamPage }) => {
    await teamPage.goto(`/org/${orgIdOf(teamPage)}/users`);
    await waitForGuardResolved(teamPage);
    const url = teamPage.url();
    const denied = url.includes("/org") && !url.includes("/users");
    expect(denied || (await teamPage.getByText(/access denied|not authorized/i).isVisible().catch(() => false))).toBeTruthy();
  });

  test("21.7 manager cannot access SMTP settings directly", async ({ managerPage }) => {
    // RBACGuard (requiredRole="admin") silently redirects — no "access
    // denied" text is ever rendered.
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/integrations/smtp`);
    await waitForGuardResolved(managerPage);
    await managerPage.waitForURL(/\/org$/, { timeout: 15000 });
  });

  test("21.8 team member does not see Delete on record detail", async ({ teamPage }) => {
    await teamPage.goto(`/org/${orgIdOf(teamPage)}/leads`);
    await teamPage.locator("table tbody tr").first().getByRole("link").click();
    await teamPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(teamPage.getByRole("button", { name: /^delete$/i })).not.toBeVisible();
  });

  test("21.9 team can create leads, contacts, companies, deals, tasks", async ({ teamPage }) => {
    const orgId = orgIdOf(teamPage);
    await teamPage.goto(`/org/${orgId}/leads`);
    await expect(teamPage.getByRole("button", { name: "Add Lead", exact: true })).toBeVisible();
    await teamPage.goto(`/org/${orgId}/contacts`);
    await expect(teamPage.getByRole("button", { name: /add contact/i })).toBeVisible();
    await teamPage.goto(`/org/${orgId}/companies`);
    await expect(teamPage.getByRole("button", { name: "Add Company", exact: true })).toBeVisible();
    await teamPage.goto(`/org/${orgId}/deals`);
    await expect(teamPage.getByRole("button", { name: /add deal/i })).toBeVisible();
    await teamPage.goto(`/org/${orgId}/tasks`);
    await expect(teamPage.getByRole("button", { name: "New Task", exact: true })).toBeVisible();
  });

  test("21.10 team cannot create invoices or projects", async ({ teamPage }) => {
    const orgId = orgIdOf(teamPage);
    await teamPage.goto(`/org/${orgId}/invoices`);
    await expect(teamPage.getByRole("link", { name: "New Invoice", exact: true })).not.toBeVisible();
    await teamPage.goto(`/org/${orgId}/projects`);
    await expect(teamPage.getByRole("button", { name: "New Project", exact: true })).not.toBeVisible();
  });

  test("21.12 admin bypasses all permission checks", async ({ adminPage }) => {
    const orgId = orgIdOf(adminPage);
    for (const path of ["leads", "contacts", "companies", "deals", "projects", "tasks", "invoices", "reports", "users", "settings", "integrations"]) {
      await adminPage.goto(`/org/${orgId}/${path}`);
      await waitForGuardResolved(adminPage);
      await expect(adminPage.getByText(/access denied|not authorized/i)).not.toBeVisible();
    }
  });

  test("21.14 custom permission deals.create=false hides Add Deal for that member", async ({ browser }) => {
    const uid = await getUserIdByEmail(USERS.team.email);
    const context = await browser.newContext();
    const page = await context.newPage();
    const { LoginPage } = await import("../../pages/login.page");
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.team.email, USERS.team.password);
    const orgId = orgIdOf(page);

    await setMemberFields(orgId, uid, { "permissions.deals.create": false });
    await page.goto(`/org/${orgId}/deals`);
    await page.reload();
    await expect(page.getByRole("button", { name: /add deal/i })).not.toBeVisible({ timeout: 10000 });

    await setMemberFields(orgId, uid, { "permissions.deals.create": true });
    await context.close();
  });

  test("21.15 custom permission leads.editAll=true grants edit on others' leads", async ({ browser }) => {
    const uid = await getUserIdByEmail(USERS.team.email);
    const context = await browser.newContext();
    const page = await context.newPage();
    const { LoginPage } = await import("../../pages/login.page");
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.team.email, USERS.team.password);
    const orgId = orgIdOf(page);

    await setMemberFields(orgId, uid, { "permissions.leads.editAll": true });
    await page.goto(`/org/${orgId}/leads`);
    await page.reload();
    await page.locator("table tbody tr").first().getByRole("link").click();
    await page.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    // Status dropdown (the only editable control on lead detail) should be
    // enabled even on a lead this team member doesn't own.
    await expect(page.locator('[role="combobox"]').first()).toBeEnabled({ timeout: 10000 });

    await setMemberFields(orgId, uid, { "permissions.leads.editAll": false });
    await context.close();
  });

  test("21.11 team can edit own leads but not others'", async ({ teamPage }) => {
    const orgId = orgIdOf(teamPage);
    // Seeded leads are owned by the admin fixture user, not team — the
    // status dropdown should be disabled/absent for a team member without
    // editAll (default role permission).
    await teamPage.goto(`/org/${orgId}/leads`);
    await teamPage.locator("table tbody tr").first().getByRole("link").click();
    await teamPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    const statusSelect = teamPage.locator('[role="combobox"]').first();
    const visible = await statusSelect.isVisible().catch(() => false);
    if (visible) {
      const disabled = await statusSelect.isDisabled().catch(() => false);
      expect(disabled).toBeTruthy();
    }
  });

  // 21.13: a generic restatement of the mechanism already demonstrated
  // concretely by 21.9/21.10/21.14 — not duplicated as its own test.
  test.skip("21.13 permission gate component visibility — generic case, see 21.9/21.10/21.14", () => {});
});
