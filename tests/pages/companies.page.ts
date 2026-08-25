import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class CompaniesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgCompanies(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("button", { name: "Add Company", exact: true });
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search companies/i);
  }

  get table() {
    return this.page.locator("table").first();
  }
}
