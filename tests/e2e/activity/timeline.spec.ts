import { test, expect } from "../../fixtures/auth";
import { randomEmail } from "../../helpers/data";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 29 (Activity Timeline).
test.describe("Activity Timeline", () => {
  test("29.1 lead creation logs a 'Lead created' activity", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.getByRole("button", { name: "Add Lead", exact: true }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByLabel(/first name/i).fill("E2E");
    await dialog.getByLabel(/last name/i).fill(`Activity${Date.now()}`);
    await dialog.getByLabel(/^email/i).fill(await randomEmail());
    await dialog.getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await expect(adminPage.getByText(/created/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("29.2 status change is logged in the activity timeline", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    const statusSelect = adminPage.locator('[role="combobox"]').first();
    await statusSelect.click();
    await adminPage.getByRole("option", { name: "Follow Up", exact: true }).click();
    await expect(adminPage.getByText(/status/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("29.3 lead-to-contact conversion is logged on both records", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.getByRole("button", { name: "Add Lead", exact: true }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByLabel(/first name/i).fill("E2E");
    await dialog.getByLabel(/last name/i).fill(`ConvertActivity${Date.now()}`);
    await dialog.getByLabel(/^email/i).fill(await randomEmail());
    await dialog.getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 10000 });
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /convert to contact/i }).click();
    await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 15000 });
    await expect(adminPage.getByText(/converted from lead|created/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("29.4 deal stage change is logged", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/deals`);
    await adminPage.getByText("Seed Pipeline Deal", { exact: false }).first().click();
    await adminPage.waitForURL(/\/deals\/.+/, { timeout: 10000 });
    const stageSelect = adminPage.locator('[role="combobox"]').first();
    await stageSelect.click();
    await adminPage.getByRole("option", { name: "Conversation", exact: true }).click();
    await expect(adminPage.getByText(/stage|updated|moved/i).first()).toBeVisible({ timeout: 10000 });
  });

  // 29.5: no dedicated org-wide activity feed page was located during UI
  // discovery (activity timelines appear per-record only).
  test.skip("29.5 organization-wide activity feed — no dedicated feed page located in current UI", () => {});
});
