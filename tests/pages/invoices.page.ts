import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class InvoicesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgInvoices(orgId));
    await this.waitForReady();
    return this;
  }

  async gotoCreate(orgId: string) {
    await this.page.goto(`/org/${orgId}/invoices/create`);
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("link", { name: "New Invoice", exact: true });
  }

  get settingsButton() {
    return this.page.getByRole("button", { name: "Settings", exact: true });
  }

  get detailsTab() {
    return this.page.getByRole("tab", { name: "Details", exact: true });
  }

  get lineItemsTab() {
    return this.page.getByRole("tab", { name: "Line Items", exact: true });
  }

  get settingsTab() {
    return this.page.getByRole("tab", { name: "Settings", exact: true });
  }

  get saveDraftButton() {
    return this.page.getByRole("button", { name: "Save Draft", exact: true });
  }

  get createAndSendButton() {
    return this.page.getByRole("button", { name: "Create & Send", exact: true });
  }
}
