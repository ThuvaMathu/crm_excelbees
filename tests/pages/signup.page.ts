import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class SignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(URLS.SIGNUP);
    await this.waitForReady();
    return this;
  }

  get fullNameInput() {
    return this.page.getByPlaceholder("John Smith");
  }

  get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput() {
    return this.page.getByPlaceholder(/min\. 8 characters/i);
  }

  get confirmPasswordInput() {
    return this.page.locator('input[type="password"]').nth(1);
  }

  get submitButton() {
    return this.page.getByRole("button", { name: "Create Account", exact: true });
  }

  async register(name: string, email: string, password: string) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitButton.click();
    return this;
  }
}

export class OnboardingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(URLS.ONBOARDING);
    await this.waitForReady();
    return this;
  }

  // Step 1 — Your Profile
  get firstNameInput() {
    return this.page.getByPlaceholder("Jane");
  }

  get phoneInput() {
    return this.page.getByPlaceholder(/\+61 400 000 000/);
  }

  get jobTitleInput() {
    return this.page.getByPlaceholder(/sales manager/i);
  }

  get continueButton() {
    return this.page.getByRole("button", { name: "Continue", exact: true });
  }

  // Step 2 — Your Workspace
  get orgNameInput() {
    return this.page.getByPlaceholder(/excelbees pty ltd/i);
  }

  get createWorkspaceButton() {
    return this.page.getByRole("button", { name: "Create Workspace", exact: true });
  }

  get backButton() {
    return this.page.getByRole("button", { name: "Back", exact: true });
  }
}
