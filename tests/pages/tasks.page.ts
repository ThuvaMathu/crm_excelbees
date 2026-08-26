import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class TasksPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgTasks(orgId));
    await this.waitForReady();
    return this;
  }

  get createButton() {
    return this.page.getByRole("button", { name: "New Task", exact: true });
  }

  get aiPriorityButton() {
    return this.page.getByRole("button", { name: "AI Priority", exact: true });
  }

  get viewArchivedButton() {
    return this.page.getByRole("button", { name: "View Archived", exact: true });
  }

  get listViewTab() {
    return this.page.getByRole("tab", { name: "List", exact: true });
  }

  get calendarViewTab() {
    return this.page.getByRole("tab", { name: "Calendar", exact: true });
  }

  get kanbanViewTab() {
    return this.page.getByRole("tab", { name: "Kanban", exact: true });
  }

  column(name: "To Do" | "In Progress" | "Review" | "Done") {
    return this.page.locator("[data-column], .kanban-column, section, div").filter({ hasText: name }).first();
  }
}
