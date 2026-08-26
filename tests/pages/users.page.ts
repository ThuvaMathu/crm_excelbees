import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class UsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgUsers(orgId));
    await this.waitForReady();
    return this;
  }

  get addMemberButton() {
    return this.page.getByRole("button", { name: "Add Team Member", exact: true });
  }

  get table() {
    return this.page.locator("table").first();
  }

  editButtonForRow(rowText: string) {
    return this.page.locator("tr").filter({ hasText: rowText }).getByRole("button", { name: /edit/i });
  }
}
