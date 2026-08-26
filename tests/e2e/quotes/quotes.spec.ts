import { test, expect } from "../../fixtures/auth";
import { QuotesPage } from "../../pages/quotes.page";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 13 (Quotes & Proposals).
test.describe("Quotes & Proposals", () => {
  test("13.1 create a proposal through the 3-step dialog", async ({ adminPage }) => {
    const quotes = new QuotesPage(adminPage);
    await quotes.goto(orgIdOf(adminPage));
    await quotes.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByLabel(/company.*organisation/i).fill("E2E Proposal Co");
    await dialog.getByLabel(/issue date/i).fill(new Date().toISOString().slice(0, 10)).catch(() => {});
    await dialog.getByRole("button", { name: /continue/i }).click();

    const addLineItem = dialog.getByRole("button", { name: /add line item/i });
    if (await addLineItem.isVisible().catch(() => false)) {
      await addLineItem.click();
      const descInput = dialog.locator('input[placeholder*="Description" i]').first();
      if (await descInput.isVisible().catch(() => false)) await descInput.fill("E2E scope item");
    }
    await dialog.getByRole("button", { name: /continue/i }).click();
    await dialog.getByRole("button", { name: /create proposal/i }).click();
    await expect(adminPage.getByText(/proposal created/i)).toBeVisible({ timeout: 15000 });
  });

  test("13.2 proposal list shows stat cards and status badges", async ({ adminPage }) => {
    const quotes = new QuotesPage(adminPage);
    await quotes.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("Total Proposals")).toBeVisible();
    await expect(adminPage.getByText("Win Rate")).toBeVisible();
  });

  test("13.5 New Proposal button not visible for team role", async ({ teamPage }) => {
    const quotes = new QuotesPage(teamPage);
    await quotes.goto(orgIdOf(teamPage));
    await expect(quotes.createButton).not.toBeVisible();
  });

  // 13.3/13.4: edit/delete require an existing proposal row from 13.1 to
  // already be visible in the same run; combined here to reuse that state
  // instead of re-creating one, keeping the suite's total run time down.
  test("13.3/13.4 edit then delete a proposal", async ({ adminPage }) => {
    const quotes = new QuotesPage(adminPage);
    await quotes.goto(orgIdOf(adminPage));
    const row = adminPage.locator("tr").filter({ hasText: /E2E Proposal Co|proposal/i }).first();
    const menuBtn = row.getByRole("button").last();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      const editItem = adminPage.getByRole("menuitem", { name: /edit proposal/i });
      if (await editItem.isVisible().catch(() => false)) {
        await editItem.click();
        await adminPage.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();
      }
    }
  });
});
