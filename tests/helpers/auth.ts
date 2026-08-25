import type { Page } from "@playwright/test";
import { waitForApp, waitForToast } from "./wait";

export async function login(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.waitForSelector("input[type=\"email\"]", {
    state: "visible",
    timeout: 15000,
  });

  await page.fill("input[type=\"email\"]", email);
  await page.fill("input[type=\"password\"]", password);
  await page.click("button[type=\"submit\"]");

  // Login always lands on the /org workspace picker first (no dashboard
  // auto-redirect, even for single-org users) — click through to the
  // seeded "Playwright Test Org" specifically (see login.page.ts for why
  // "first card" is unsafe).
  await page.waitForURL("**/org", { timeout: 20000 });
  const orgCard = page.locator("button").filter({ hasText: "/playwright-test-org" }).first();
  await orgCard.waitFor({ state: "visible", timeout: 15000 });
  await orgCard.click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  await waitForApp(page);
}

export async function logout(page: Page) {
  const userMenu = page.locator("[data-user-menu], .user-menu").first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    const signOut = page.getByRole("button", { name: /sign out|logout/i });
    if (await signOut.isVisible()) {
      await signOut.click();
    }
  }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return (
    currentUrl.includes("/dashboard") ||
    currentUrl.includes("/leads") ||
    currentUrl.includes("/contacts") ||
    currentUrl.includes("/companies")
  );
}

export async function assertLoggedIn(page: Page) {
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
  const url = page.url();
  if (url.includes("/login")) {
    throw new Error("User is not logged in — still on login page");
  }
}

export async function assertPermissionDenied(page: Page) {
  await waitForToast(page, undefined, "error", 5000);
  const deniedIndicator =
    (await page
      .getByText(/permission denied|access denied|unauthorized/i)
      .isVisible()
      .catch(() => false)) ||
    (await page.url().includes("/org") && page.url() === page.url());
  return deniedIndicator;
}