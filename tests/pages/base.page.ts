import type { Page } from "@playwright/test";
import { waitForApp } from "../helpers/wait";

export class BasePage {
  constructor(protected page: Page) {}

  async waitForReady() {
    await waitForApp(this.page);
    return this;
  }

  async clickButton(label: string | RegExp) {
    await this.page.getByRole("button", { name: label }).first().click();
    return this;
  }

  async fillInput(placeholder: string, value: string) {
    await this.page.locator(`input[placeholder="${placeholder}"]`).fill(value);
    return this;
  }

  async selectOption(label: string, value: string) {
    const trigger = this.page
      .locator('[role="combobox"], select')
      .filter({ hasText: label })
      .first();
    await trigger.click();
    await this.page.getByRole("option", { name: value }).click();
    return this;
  }

  async confirmDialog(title?: string, action = "Confirm") {
    if (title) {
      await this.page
        .getByRole("dialog")
        .filter({ hasText: title })
        .waitFor({ state: "visible", timeout: 5000 });
    }
    await this.page.getByRole("button", { name: action }).click();
    return this;
  }

  async cancelDialog() {
    await this.page.getByRole("button", { name: /cancel/i }).click();
    return this;
  }

  async expectTextVisible(text: string | RegExp, timeout = 10000) {
    await this.page.getByText(text).first().waitFor({ state: "visible", timeout });
    return this;
  }

  async expectHeading(text: string | RegExp, timeout = 10000) {
    await this.page.getByRole("heading", { name: text }).first().waitFor({ state: "visible", timeout });
    return this;
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/screenshots/${name}-${Date.now()}.png`, fullPage: true });
    return this;
  }
}