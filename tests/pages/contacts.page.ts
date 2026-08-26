import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class ContactsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgContacts(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("button", { name: /add contact|new contact|create contact/i });
  }
}