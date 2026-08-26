import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class EmailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgEmails(orgId));
    await this.waitForReady();
    return this;
  }

  get composeButton() {
    return this.page.getByRole("button", { name: "Compose", exact: true });
  }

  get sentTab() {
    return this.page.getByRole("tab", { name: /^Sent/i });
  }

  get draftsTab() {
    return this.page.getByRole("tab", { name: /^Drafts/i });
  }

  get templatesTab() {
    return this.page.getByRole("tab", { name: /^Templates/i });
  }

  get newTemplateButton() {
    return this.page.getByRole("button", { name: "New Template", exact: true });
  }
}
