import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class NotesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgNotes(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("button", { name: "Add Note", exact: true });
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search notes/i);
  }

  get pinnedSection() {
    return this.page.getByText("Pinned", { exact: true });
  }
}
