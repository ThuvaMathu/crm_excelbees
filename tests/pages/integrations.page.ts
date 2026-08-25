import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class IntegrationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgIntegrations(orgId));
    await this.waitForReady();
    return this;
  }

  async gotoSmtp(orgId: string) {
    await this.page.goto(`/org/${orgId}/integrations/smtp`);
    await this.waitForReady();
    return this;
  }

  get configureSmtpButton() {
    return this.page.getByRole("button", { name: "Configure", exact: true });
  }

  get saveConfigButton() {
    return this.page.getByRole("button", { name: "Save Configuration", exact: true });
  }
}
