import type { Page } from "@playwright/test";
import { waitForApp } from "../helpers/wait";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForSelector("input[type=\"email\"]", {
      state: "visible",
      // Generous timeout: against `next dev`, an on-demand route compile
      // (especially under parallel test load) can take well over 15s.
      timeout: 30000,
    });
    return this;
  }

  get emailInput() {
    return this.page.locator("input[type=\"email\"]");
  }

  get passwordInput() {
    return this.page.locator("input[type=\"password\"]");
  }

  get submitButton() {
    return this.page.locator("button[type=\"submit\"]");
  }

  get googleButton() {
    return this.page.getByRole("button", { name: /continue with google/i });
  }

  get createAccountLink() {
    return this.page.locator('a[href="/signup"]');
  }

  get forgotPasswordLink() {
    return this.page.locator('a[href="/forgot-password"]');
  }

  get passwordToggle() {
    return this.page.locator('button[aria-label="Show password"]');
  }

  get heading() {
    return this.page.getByRole("heading", { name: /welcome back/i });
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
    return this;
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
    return this;
  }

  async submit() {
    await this.submitButton.click();
    return this;
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    // Login always lands on the /org workspace picker first — there is no
    // auto-redirect to a dashboard, even for single-org users. Click through
    // to the seeded "Playwright Test Org" specifically (by slug text) rather
    // than "the first card" — stray duplicate-named orgs created by earlier
    // test runs (or a user's own other workspaces) make "first" ambiguous
    // and non-deterministic, which silently landed fixtures on the wrong
    // (empty) org.
    await this.page.waitForURL("**/org", { timeout: 20000 });
    const orgCard = this.page.locator("button").filter({ hasText: "/playwright-test-org" }).first();
    await orgCard.waitFor({ state: "visible", timeout: 15000 });
    await orgCard.click();
    await this.page.waitForURL("**/dashboard", { timeout: 20000 });
    await waitForApp(this.page);
    return this;
  }

  async assertErrorMessage(expectedText: string | RegExp) {
    const toast = this.page.locator("[data-sonner-toast]");
    await toast
      .filter({ hasText: expectedText })
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    return this;
  }

  async assertOnPage() {
    await this.heading.waitFor({ state: "visible" });
    return this;
  }
}