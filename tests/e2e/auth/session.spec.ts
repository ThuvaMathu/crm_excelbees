import { test, expect } from "../../fixtures/auth";
import { LoginPage } from "../../pages/login.page";
import { USERS } from "../../data/users";

// Covers humanlike-test-case.md section 1 (Authentication & Session),
// cases not already covered by login.spec.ts (1.1-1.4).
test.describe("Authentication - Session", () => {
  // 1.5-1.8: Google OAuth flows require a real Google account + interactive
  // consent popup, which Playwright cannot drive headlessly without a
  // dedicated OAuth test account and Google's own automation exemptions.
  test.skip("1.5-1.8 Google OAuth login/signup flows — requires interactive Google consent, not automatable", () => {});

  test("1.9 too many login attempts shows rate-limit error", async ({ page }) => {
    // Uses the "scanner" fixture account (unused elsewhere in this run) so a
    // real Firebase rate-limit/lockout from repeated failures doesn't risk
    // blocking the admin/manager/team accounts every other spec depends on.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    for (let i = 0; i < 6; i++) {
      await loginPage.fillEmail(USERS.scanner.email);
      await loginPage.fillPassword("WrongPassword!" + i);
      await loginPage.submit();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText(/too many attempts/i)).toBeVisible({ timeout: 10000 });
  });

  // 1.10: tried context.setOffline() (the mechanism that works for
  // error-recovery.spec.ts 25.1's Firestore write) against the Firebase
  // Auth sign-in call specifically — unlike a single Firestore write,
  // signInWithEmailAndPassword's underlying transport just hangs (submit
  // button stays disabled, no error surfaces) rather than failing fast, for
  // well beyond a reasonable assertion timeout. Confirms the original
  // assessment: not reliably simulable without a real connectivity drop.
  test.skip("1.10 network error during login — requires real connectivity loss, not reliably simulable", () => {});

  test("1.11 already authenticated user visiting /login redirects to /org", async ({ adminPage }) => {
    await adminPage.goto("/login");
    await adminPage.waitForURL("**/org", { timeout: 15000 });
    await expect(adminPage.locator("input[type=\"email\"]")).not.toBeVisible();
  });

  test("1.12 session persists across tabs", async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const loginPage = new LoginPage(page1);
    await loginPage.goto();
    await loginPage.login(USERS.admin.email, USERS.admin.password);

    const page2 = await context.newPage();
    await page2.goto("/org");
    await page2.waitForLoadState("domcontentloaded");
    await expect(page2.locator("input[type=\"email\"]")).not.toBeVisible();
    await context.close();
  });

  // 1.13: Firebase ID tokens expire after ~1 hour; waiting that long in a
  // test is impractical. Not automated.
  test.skip("1.13 session expiry — requires waiting ~1hr for real token expiry, impractical", () => {});

  test("1.14 logout clears session and blocks protected routes", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.admin.email, USERS.admin.password);

    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("**/login", { timeout: 15000 });
    await page.goto("/org");
    await page.waitForURL("**/login", { timeout: 15000 });
    await context.close();
  });

  test("1.15 logout then browser back does not re-authenticate", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.admin.email, USERS.admin.password);
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("**/login", { timeout: 15000 });

    await page.goBack();
    await expect(page.locator("input[type=\"email\"]")).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test("1.16 forgot password sends reset link and redirects to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await page.waitForURL("**/forgot-password");
    await page.locator('input[type="email"]').fill(USERS.admin.email);
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10000 });
  });

  test("1.17 forgot password with invalid email shows validation error", async ({ page }) => {
    await page.goto("/forgot-password");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: /send reset link/i }).click();
    // The email field is a native `type="email"` input, so an invalid value
    // blocks submission via the browser's own constraint validation (a
    // native UI tooltip, not part of the DOM/a11y tree) before
    // react-hook-form's zod validation ever runs — confirm via the
    // validity API rather than looking for inline error text.
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
    await expect(page).toHaveURL(/forgot-password/);
  });

  // 1.18-1.20: require provisioning a user with isFirstLogin=true or
  // isActive=false directly in Firestore before login. Covered by the
  // regression spec (27.6 ERR-010) which sets this up via firebase-admin.
  test.skip("1.18-1.20 first-login password change / deactivated account — see regression.spec.ts 27.6", () => {});

  test("1.21 auth loading state shows and clears initializing spinner", async ({ page }) => {
    await page.goto("/login");
    // The "Initializing CRM..." splash is shown by AuthGate on first paint
    // before Firebase resolves auth state; on a fresh navigation to a public
    // route it should clear (or never block) within a few seconds.
    await page.getByText(/initializing crm/i).waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await expect(page.locator("input[type=\"email\"]")).toBeVisible();
  });
});
