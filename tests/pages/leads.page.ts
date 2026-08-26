import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class LeadsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgLeads(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    // Scoped to an exact match: the page-level trigger is "Add Lead", while
    // the dialog's submit button is "Create Lead" — a loose regex matches
    // both and trips Playwright's strict mode.
    return this.page.getByRole("button", { name: "Add Lead", exact: true });
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search/i);
  }

  get table() {
    return this.page.locator("table").first();
  }

  async clickLead(name: string) {
    await this.page.getByText(name, { exact: false }).first().click();
    return this;
  }

  async assertLeadVisible(name: string) {
    await this.page.getByText(name, { exact: false }).first().waitFor({ state: "visible", timeout: 10000 });
    return this;
  }
}