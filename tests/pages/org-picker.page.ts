import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class OrgPickerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(URLS.ORG);
    await this.waitForReady();
    return this;
  }

  get newOrgButton() {
    return this.page.getByRole("button", { name: "New organization", exact: true });
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search organizations/i);
  }

  get gridViewToggle() {
    return this.page.getByLabel("Grid view", { exact: true });
  }

  get listViewToggle() {
    return this.page.getByLabel("List view", { exact: true });
  }

  orgCard(name: string) {
    return this.page.locator("div.grid button, div.space-y-2 button").filter({ hasText: name }).first();
  }
}
