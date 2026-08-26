import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class ProjectsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgProjects(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("button", { name: "New Project", exact: true });
  }

  get activeTab() {
    return this.page.getByRole("tab", { name: /active development/i });
  }

  get maintenanceTab() {
    return this.page.getByRole("tab", { name: /maintenance.*completed/i });
  }
}
