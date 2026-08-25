import { test, expect } from "../../fixtures/auth";
import { IntegrationsPage } from "../../pages/integrations.page";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 19 (Integrations).
test.describe("Integrations", () => {
  test("19.1 integrations page shows SMTP with Configure and Coming Soon cards", async ({ adminPage }) => {
    const integrations = new IntegrationsPage(adminPage);
    await integrations.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText(/email \(smtp\)/i)).toBeVisible();
    await expect(integrations.configureSmtpButton).toBeVisible();
    await expect(adminPage.getByText(/coming soon/i).first()).toBeVisible();
  });

  test("19.2 configure Gmail SMTP", async ({ adminPage }) => {
    const integrations = new IntegrationsPage(adminPage);
    await integrations.gotoSmtp(orgIdOf(adminPage));
    const providerSelect = adminPage.locator("select").first();
    await providerSelect.selectOption({ label: "Gmail" });
    await adminPage.getByLabel(/email address/i).fill("e2e.smtp@playwright.test");
    await adminPage.getByLabel(/app password/i).fill("dummy-app-password-1234");
    await integrations.saveConfigButton.click();
    await expect(adminPage.getByText(/smtp configuration saved/i)).toBeVisible({ timeout: 15000 });
  });

  test("19.3 configure custom SMTP", async ({ adminPage }) => {
    const integrations = new IntegrationsPage(adminPage);
    await integrations.gotoSmtp(orgIdOf(adminPage));
    const providerSelect = adminPage.locator("select").first();
    await providerSelect.selectOption({ label: "Custom SMTP Server" });
    await adminPage.getByLabel(/smtp host/i).fill("smtp.example.test");
    await adminPage.getByLabel(/port/i).fill("587");
    await adminPage.getByLabel(/email address/i).fill("custom@playwright.test");
    await adminPage.getByLabel(/app password|password/i).first().fill("dummy-password");
    await integrations.saveConfigButton.click();
    await expect(adminPage.getByText(/saved/i)).toBeVisible({ timeout: 15000 });
  });

  test("19.4 view existing SMTP config shows masked password", async ({ adminPage }) => {
    const integrations = new IntegrationsPage(adminPage);
    await integrations.gotoSmtp(orgIdOf(adminPage));
    const passwordInput = adminPage.getByLabel(/app password|password/i).first();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("19.5 manager cannot access SMTP settings directly", async ({ managerPage }) => {
    // RBACGuard (requiredRole="admin") silently redirects unauthorized
    // users to /org — it doesn't render any "access denied" text.
    const integrations = new IntegrationsPage(managerPage);
    await integrations.gotoSmtp(orgIdOf(managerPage));
    await managerPage.waitForURL(/\/org$/, { timeout: 15000 });
  });
});
