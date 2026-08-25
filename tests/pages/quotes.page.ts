import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class QuotesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgQuotes(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    // Both the page header and the empty-state action render a "New
    // Proposal" button; when the list is empty both are visible at once.
    // Header button is always present regardless of list state.
    return this.page.getByRole("button", { name: "New Proposal", exact: true }).first();
  }

  get searchInput() {
    return this.page.getByPlaceholder(/proposal number, company/i);
  }
}
