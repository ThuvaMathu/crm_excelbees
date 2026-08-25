import { test, expect } from "../../fixtures/auth";
import type { Page } from "@playwright/test";

// Client-side auth/org resolution runs through a couple of sequential
// loading states ("Initializing CRM...", then "Loading workspace...")
// before the RBAC guard either renders the page or redirects. Wait for
// both to clear before asserting on the outcome.
async function waitForGuardResolved(page: Page) {
  for (const text of [/initializing crm/i, /loading workspace/i, /redirecting/i]) {
    await page.getByText(text).first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }
}

test.describe("Permission Guards - RBAC Enforcement", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/org/test-org-id/dashboard");
    await page.waitForURL("**/login", { timeout: 15000 });
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
  });

  test("team member cannot access reports", async ({ teamPage }) => {
    const orgId = extractOrgId(teamPage.url());
    await teamPage.goto(`/org/${orgId}/reports`);
    await waitForGuardResolved(teamPage);

    // Team role does not have reports access - should be redirected or see access denied
    const redirected = teamPage.url().includes("/org") && !teamPage.url().includes("/reports");
    const denied = await teamPage.getByText(/access denied|permission denied|not authorized/i).isVisible().catch(() => false);
    expect(redirected || denied).toBeTruthy();
  });

  test("team member cannot access invoices", async ({ teamPage }) => {
    const orgId = extractOrgId(teamPage.url());
    await teamPage.goto(`/org/${orgId}/invoices`);
    await waitForGuardResolved(teamPage);

    const redirected = teamPage.url().includes("/org") && !teamPage.url().includes("/invoices");
    expect(redirected).toBeTruthy();
  });
});

function extractOrgId(url: string): string {
  const match = url.match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}