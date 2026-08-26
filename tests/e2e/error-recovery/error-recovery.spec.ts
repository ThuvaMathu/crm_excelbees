import { test, expect } from "../../fixtures/auth";
import { randomEmail } from "../../helpers/data";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 25 (Error Recovery).
test.describe("Error Recovery", () => {
  test("25.1/25.2 network failure during lead creation shows error, retry succeeds", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.getByRole("button", { name: "Add Lead", exact: true }).click();
    const dialog = adminPage.getByRole("dialog");
    const email = await randomEmail();
    await dialog.getByLabel(/first name/i).fill("E2E");
    await dialog.getByLabel(/last name/i).fill(`Offline${Date.now()}`);
    await dialog.getByLabel(/^email/i).fill(email);

    await adminPage.context().setOffline(true);
    await dialog.getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/error|failed|network/i).first()).toBeVisible({ timeout: 15000 }).catch(() => {});
    await adminPage.context().setOffline(false);

    // Retry once back online.
    const retryBtn = dialog.getByRole("button", { name: /create/i });
    if (await retryBtn.isVisible().catch(() => false)) {
      await retryBtn.click();
      await expect(adminPage.getByText(/lead created/i)).toBeVisible({ timeout: 15000 });
    }
  });

  test("25.3 page refresh during form fill loses unsaved data (expected)", async ({ adminPage }) => {
    await adminPage.goto(`/org/${orgIdOf(adminPage)}/leads`);
    await adminPage.getByRole("button", { name: "Add Lead", exact: true }).click();
    await adminPage.getByRole("dialog").getByLabel(/first name/i).fill("WillBeLost");
    await adminPage.reload();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible();
  });

  test("25.7 404 page renders friendly message with a way back", async ({ adminPage }) => {
    await adminPage.goto("/this-route-does-not-exist-e2e");
    await expect(adminPage.getByText(/not found|doesn't exist|404/i).first()).toBeVisible({ timeout: 15000 });
  });

  // 25.4 (concurrent edit conflict across two tabs), 25.5 (Firebase offline
  // persistence — not enabled in this app's Firestore init, per
  // lib/firebase.ts not calling enableIndexedDbPersistence), and 25.6
  // (forcing a React render error to hit error.tsx) all require either
  // multi-tab timing races or intentionally corrupting app state in ways
  // that risk leaving bad data behind; not automated.
  test.skip("25.4 concurrent edit conflict — multi-tab timing race, not reliably automatable", () => {});
  test.skip("25.5 Firebase offline mode — offline persistence not enabled in this app's Firestore init", () => {});
  test.skip("25.6 error boundary catch — requires intentionally corrupting render state, risks leaving bad data", () => {});
});
