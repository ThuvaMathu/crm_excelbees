import type { Page } from "@playwright/test";
import { waitForApp } from "../helpers/wait";
import { URLS } from "../data/urls";

export class DashboardPage {
  constructor(private page: Page) {}

  async goto(orgId: string) {
    await this.page.goto(URLS.orgDashboard(orgId));
    await waitForApp(this.page);
    return this;
  }

  get heading() {
    // The dashboard's actual h1 is "Welcome back, {name}! 👋", not "Dashboard".
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get sidebar() {
    return this.page.locator("nav, aside, [data-sidebar]").first();
  }

  get header() {
    return this.page.locator("header").first();
  }

  get userMenu() {
    return this.page.locator("[data-user-menu]").first();
  }

  async clickSidebarItem(label: string) {
    await this.sidebar.getByText(label, { exact: false }).first().click();
    await this.page.waitForLoadState("domcontentloaded");
    return this;
  }

  async assertOnPage() {
    await this.heading.waitFor({ state: "visible", timeout: 15000 });
    return this;
  }

  async getOrgIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/org\/([^/]+)/);
    if (!match) throw new Error("Could not extract orgId from URL");
    return match[1];
  }
}