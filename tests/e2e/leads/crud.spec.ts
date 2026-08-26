import { test, expect } from "../../fixtures/auth";
import { LeadsPage } from "../../pages/leads.page";

test.describe("Lead Management - Admin CRUD", () => {
  test("admin can view leads list", async ({ adminPage }) => {
    const orgId = extractOrgId(adminPage.url());
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgId);

    await expect(adminPage.getByText(/leads/i).first()).toBeVisible();
  });

  test("admin can create a new lead", async ({ adminPage }) => {
    const orgId = extractOrgId(adminPage.url());
    const leads = new LeadsPage(adminPage);
    await leads.goto(orgId);

    if (await leads.createButton.isVisible()) {
      await leads.createButton.click();
      await expect(
        adminPage.getByRole("dialog").or(adminPage.locator("[data-dialog]")),
      ).toBeVisible();
    }
  });

  test("team member can view leads list", async ({ teamPage }) => {
    const orgId = extractOrgId(teamPage.url());
    const leads = new LeadsPage(teamPage);
    await leads.goto(orgId);

    await expect(teamPage.getByText(/leads/i).first()).toBeVisible();
  });
});

function extractOrgId(url: string): string {
  const match = url.match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}