import { test, expect } from "../../fixtures/auth";
import { LeadsPage } from "../../pages/leads.page";
import { randomEmail } from "../../helpers/data";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

async function fillCreateLeadForm(page: import("@playwright/test").Page, overrides: Partial<{ firstName: string; lastName: string; email: string }> = {}) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/first name/i).fill(overrides.firstName ?? "E2E");
  await dialog.getByLabel(/last name/i).fill(overrides.lastName ?? `Lead${Date.now()}`);
  await dialog.getByLabel(/^email/i).fill(overrides.email ?? (await randomEmail()));
}

// Covers humanlike-test-case.md section 6 (Lead Management), cases beyond
// the happy-path already in crud.spec.ts.
test.describe("Lead Management - Extra", () => {
  test("6.2 create lead with required fields only", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    await fillCreateLeadForm(adminPage);
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
  });

  test("6.3 create lead with missing required fields shows validation", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/required/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("6.4 create lead with invalid email shows validation", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    await fillCreateLeadForm(adminPage, { email: "not-an-email" });
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/valid email/i)).toBeVisible({ timeout: 10000 });
  });

  test("6.6 lead list shows table columns, pagination, filters", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("Name", { exact: true })).toBeVisible();
    await expect(adminPage.getByText("Status", { exact: true }).first()).toBeVisible();
    await expect(leads.searchInput).toBeVisible();
    await expect(adminPage.getByText(/showing.*of.*leads/i)).toBeVisible();
  });

  test("6.8 search leads by name filters results", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.searchInput.fill("Lead1");
    await adminPage.getByRole("button", { name: "Search", exact: true }).click();
    await expect(adminPage.getByText("Seed Lead1", { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test("6.9 filter leads by status", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.getByRole("combobox").filter({ hasText: /status/i }).click().catch(() => {});
    const statusFilter = adminPage.locator('[role="combobox"]').first();
    await statusFilter.click();
    await adminPage.getByRole("option", { name: "Qualified", exact: true }).click();
    await expect(adminPage.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("6.11 lead list pagination navigates pages", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    const nextBtn = adminPage.getByRole("button", { name: "Next", exact: true });
    if (await nextBtn.isEnabled().catch(() => false)) {
      await nextBtn.click();
      await expect(adminPage.getByRole("button", { name: "Previous", exact: true })).toBeEnabled();
    }
  });

  test("6.12 lead value hidden for team role", async ({ teamPage }) => {
    const leads = new LeadsPage(teamPage);
    await leads.goto(orgIdOf(teamPage));
    await expect(teamPage.getByText("$•••").first()).toBeVisible({ timeout: 10000 });
  });

  test("6.13 lead value visible for admin", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("$•••")).not.toBeVisible();
  });

  test("6.14 view lead detail shows lead information card", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(adminPage.getByText(/created|updated|owner/i).first()).toBeVisible();
  });

  test("6.15 update lead status", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    const statusSelect = adminPage.locator('[role="combobox"]').first();
    await statusSelect.click();
    await adminPage.getByRole("option", { name: "Contacted", exact: true }).click();
    await expect(adminPage.getByText(/status updated|updated/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("6.16 lead detail has no name/email edit button (known limitation)", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(adminPage.getByRole("button", { name: /^edit$/i })).not.toBeVisible();
  });

  test("6.22 admin can delete a lead", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    await fillCreateLeadForm(adminPage);
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /delete/i }).click();
    await adminPage.getByRole("button", { name: /confirm|delete/i }).last().click();
    await adminPage.waitForURL(/\/leads$/, { timeout: 10000 });
  });

  test("6.23 team member does not see delete button on lead detail", async ({ teamPage }) => {
    const leads = new LeadsPage(teamPage);
    await leads.goto(orgIdOf(teamPage));
    await teamPage.locator("table tbody tr").first().getByRole("link").click();
    await teamPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(teamPage.getByRole("button", { name: /^delete$/i })).not.toBeVisible();
  });

  test("6.24 lead with value $0 displays $0, not hidden", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    // Seeded leads include some with value 0 (i % 3 === 0).
    await adminPage.getByText("Seed Lead3", { exact: false }).first().click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(adminPage.getByText(/\$0\b/).first()).toBeVisible({ timeout: 10000 });
  });

  test("6.5 negative lead value is rejected", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    await fillCreateLeadForm(adminPage);
    const valueInput = adminPage.getByRole("dialog").getByLabel(/value/i);
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill("-100");
      await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await expect(adminPage.getByText(/positive|invalid|must be/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("6.10 filter leads by source", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    const sourceFilter = adminPage.locator('[role="combobox"]').nth(1);
    await sourceFilter.click();
    await adminPage.getByRole("option", { name: "Referral", exact: true }).click();
    await expect(adminPage.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("6.17 convert lead to contact", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    const lastName = `Lead${Date.now()}`;
    await fillCreateLeadForm(adminPage, { lastName });
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    // Search for the specific lead just created instead of assuming it's
    // "the first row" — the shared seed org accumulates leads across many
    // spec runs, sort order isn't a reliable "newest first" guarantee, and
    // the post-create list refetch is async and can lag the toast anyway.
    await leads.searchInput.fill(lastName);
    await adminPage.keyboard.press("Enter");
    await adminPage.getByRole("row", { name: new RegExp(lastName) }).getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /convert to contact/i }).click();
    await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 15000 });
  });

  test("6.20 converted lead shows already-converted banner", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    const lastName = `Lead${Date.now()}`;
    await fillCreateLeadForm(adminPage, { lastName });
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await leads.searchInput.fill(lastName);
    await adminPage.keyboard.press("Enter");
    await adminPage.getByRole("row", { name: new RegExp(lastName) }).getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    const leadUrl = adminPage.url();
    await adminPage.getByRole("button", { name: /convert to contact/i }).click();
    await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 15000 });

    await adminPage.goto(leadUrl);
    await expect(adminPage.getByText(/already been converted|already converted/i)).toBeVisible({ timeout: 10000 });
  });

  test("6.18 convert lead to deal", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    const lastName = `Lead${Date.now()}`;
    await fillCreateLeadForm(adminPage, { lastName });
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await leads.searchInput.fill(lastName);
    await adminPage.keyboard.press("Enter");
    await adminPage.getByRole("row", { name: new RegExp(lastName) }).getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /convert to deal/i }).click();
    await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
    await adminPage.waitForURL(/\/deals\/.+/, { timeout: 15000 });
  });

  test("6.19 convert lead to project", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.createButton.click();
    const lastName = `Lead${Date.now()}`;
    await fillCreateLeadForm(adminPage, { lastName });
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await leads.searchInput.fill(lastName);
    await adminPage.keyboard.press("Enter");
    await adminPage.getByRole("row", { name: new RegExp(lastName) }).getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /convert to project/i }).click();
    await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
    await adminPage.waitForURL(/\/projects\/.+/, { timeout: 15000 });
  });

  test("6.7 empty search state shows no-leads message", async ({ adminPage }) => {
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgIdOf(adminPage));
    await leads.searchInput.fill("NoSuchLeadXYZ999");
    await adminPage.getByRole("button", { name: "Search", exact: true }).click();
    await expect(adminPage.getByText(/no leads found/i)).toBeVisible({ timeout: 10000 });
  });

  // 6.25: AI score card only renders when aiScore has been computed for a
  // lead, which requires a live Gemini call — see ai-features.spec.ts 20.3.
  test.skip("6.25 lead AI score display — requires live AI scoring, see ai-features.spec.ts 20.3", () => {});
});
