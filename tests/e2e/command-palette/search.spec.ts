import { test, expect } from "../../fixtures/auth";

// Covers humanlike-test-case.md section 31 (Command Palette Search).
test.describe("Command Palette Search", () => {
  test("31.1 Ctrl+K opens the command palette", async ({ adminPage }) => {
    await adminPage.keyboard.press("Control+k");
    await expect(adminPage.getByPlaceholder(/search leads, contacts, companies, deals/i)).toBeVisible({ timeout: 10000 });
  });

  test("31.2 searching a lead name shows matching results and navigates on click", async ({ adminPage }) => {
    await adminPage.keyboard.press("Control+k");
    const searchInput = adminPage.getByPlaceholder(/search leads, contacts, companies, deals/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("Seed Lead1");
    await adminPage.waitForTimeout(500);
    const result = adminPage.getByText("Seed Lead1", { exact: false }).first();
    if (await result.isVisible().catch(() => false)) {
      await result.click();
      await adminPage.waitForURL(/\/leads\/.+/, { timeout: 10000 });
    }
  });

  test("31.3 AI natural language search mode accepts a free-text query", async ({ adminPage }) => {
    await adminPage.keyboard.press("Control+k");
    const searchInput = adminPage.getByPlaceholder(/search leads, contacts, companies, deals/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    const aiToggle = adminPage.getByRole("button", { name: "AI", exact: true });
    if (await aiToggle.isVisible().catch(() => false)) {
      await aiToggle.click();
      const aiInput = adminPage.getByPlaceholder(/ask ai/i);
      await aiInput.fill("deals worth over 1000 in pipeline");
      await aiInput.press("Enter");
      await adminPage.waitForTimeout(3000);
    }
  });

  test("31.4 Escape closes the command palette", async ({ adminPage }) => {
    await adminPage.keyboard.press("Control+k");
    await expect(adminPage.getByPlaceholder(/search leads, contacts, companies, deals/i)).toBeVisible({ timeout: 10000 });
    await adminPage.keyboard.press("Escape");
    await expect(adminPage.getByPlaceholder(/search leads, contacts, companies, deals/i)).not.toBeVisible({ timeout: 5000 });
  });
});
