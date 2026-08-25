import { test, expect } from "../../fixtures/auth";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Admin Permissions - Dashboard Access", () => {
  test("admin can access dashboard", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.assertOnPage();
    await expect(adminPage.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("manager can access dashboard", async ({ managerPage }) => {
    const dashboard = new DashboardPage(managerPage);
    await dashboard.assertOnPage();
    await expect(managerPage.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("team member can access dashboard", async ({ teamPage }) => {
    const dashboard = new DashboardPage(teamPage);
    await dashboard.assertOnPage();
    await expect(teamPage.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("side navigation is visible", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.assertOnPage();
    await expect(dashboard.sidebar).toBeVisible();
  });

  test("header is visible", async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.assertOnPage();
    await expect(dashboard.header).toBeVisible();
  });
});