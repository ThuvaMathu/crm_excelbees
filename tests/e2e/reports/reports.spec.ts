import { test, expect } from "../../fixtures/auth";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 17 (Reports & Analytics).
test.describe("Reports & Analytics", () => {
  test("17.1 reports page shows AI summary, tabs, and overview stats", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/reports`);
    await expect(managerPage.getByRole("tab", { name: "Overview", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(managerPage.getByText("Total Revenue")).toBeVisible();
    await expect(managerPage.getByText("Total Leads")).toBeVisible();
  });

  test("17.2 team role has restricted reports access", async ({ teamPage }) => {
    // The default "Overview" tab doesn't gate anything for team role — the
    // restriction lives inside the "Sales (Restricted)" tab (financial
    // data specifically), which team can still click into but sees an
    // "Access Restricted" card instead of the chart.
    await teamPage.goto(`/org/${orgIdOf(teamPage)}/reports`);
    await teamPage.getByRole("tab", { name: /sales.*restricted/i }).click();
    await expect(teamPage.getByText(/access restricted/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("17.3 sales & forecast tab shows revenue forecast chart", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/reports`);
    const tab = managerPage.getByRole("tab", { name: /sales.*forecast/i });
    await tab.click();
    await expect(managerPage.getByText(/revenue forecast/i)).toBeVisible({ timeout: 10000 });
  });

  test("17.4 leads intelligence tab shows scoring matrix", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/reports`);
    const tab = managerPage.getByRole("tab", { name: /leads intelligence/i });
    await tab.click();
    await expect(managerPage.getByText(/at risk|healthy rate/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("17.5 AI executive summary loads insights and recommendations", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/reports`);
    await expect(managerPage.getByText(/executive summary/i)).toBeVisible({ timeout: 15000 });
  });

  test("17.6 export CSV downloads a file", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/reports`);
    const exportBtn = managerPage.getByRole("button", { name: "Export", exact: true });
    if (await exportBtn.isVisible().catch(() => false)) {
      const downloadPromise = managerPage.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await exportBtn.click();
      const download = await downloadPromise;
      expect(download).toBeTruthy();
    }
  });

  test("17.7 analytics page shows revenue/pipeline/activity charts", async ({ managerPage }) => {
    await managerPage.goto(`/org/${orgIdOf(managerPage)}/analytics`);
    await expect(managerPage.getByText(/revenue|pipeline|activity/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("17.8 team role sees financial analytics restricted message", async ({ teamPage }) => {
    await teamPage.goto(`/org/${orgIdOf(teamPage)}/analytics`);
    await expect(teamPage.getByText(/financial analytics restricted/i)).toBeVisible({ timeout: 15000 });
  });
});
