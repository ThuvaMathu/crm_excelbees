import { test, expect } from "../../fixtures/auth";
import { createDoc, setMemberFields, getUserIdByEmail } from "../../helpers/admin";
import { USERS } from "../../data/users";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 28 (Cross-Organization Isolation).
test.describe("Cross-Organization Isolation", () => {
  test("28.1 a lead created in org A is not visible when the user is not a member of org B", async ({ adminPage }) => {
    const orgAId = orgIdOf(adminPage);
    // Create a second, separate org the admin fixture user is NOT a member
    // of, and a lead inside it, then confirm the admin fixture can't see it
    // from org A's leads list (organizationId-scoped queries).
    const orgBId = await createDoc("organizations", {
      name: "E2E Isolation Org B",
      slug: `e2e-isolation-org-b-${Date.now()}`,
      ownerId: "seed-script",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const leadName = `IsolationLead${Date.now()}`;
    await createDoc("leads", {
      organizationId: orgBId,
      ownerId: "seed-script",
      firstName: "Isolated",
      lastName: leadName,
      email: `isolated${Date.now()}@playwright.test`,
      status: "New",
      source: "Other",
      value: 0,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await adminPage.goto(`/org/${orgAId}/leads`);
      await expect(adminPage.getByText(leadName)).not.toBeVisible({ timeout: 5000 });

      // And the admin fixture shouldn't even be able to open org B directly.
      // Actual copy is "Access denied" / "Missing or insufficient
      // permissions." (see RBACGuard) — broaden the regex to match it
      // instead of the "do not have access" phrasing this assertion
      // originally guessed at.
      await adminPage.goto(`/org/${orgBId}/leads`);
      // .first(): the access-denied screen renders both "Access denied"
      // and "Missing or insufficient permissions." as separate elements,
      // both of which this regex matches — without .first() that's a
      // strict-mode violation (2 matches for a single-element assertion).
      await expect(adminPage.getByText(/access denied|do not have access|insufficient permissions|could not be found/i).first()).toBeVisible({ timeout: 15000 });
    } finally {
      const { deleteDoc } = await import("../../helpers/admin");
      await deleteDoc("organizations", orgBId).catch(() => {});
    }
  });

  test("28.2 user belongs to multiple orgs with different data in each", async ({ browser }) => {
    const { createEphemeralUser, deleteEphemeralUser, setDocWithId } = await import("../../helpers/admin");
    const user = await createEphemeralUser({ emailPrefix: "e2e.twoorgdata", password: "Password1!", displayName: "Two Org Data User" });
    const orgAId = await createDoc("organizations", { name: "E2E Data Org A", slug: `e2e-data-org-a-${Date.now()}`, ownerId: user.uid, createdAt: new Date(), updatedAt: new Date() });
    const orgBId = await createDoc("organizations", { name: "E2E Data Org B", slug: `e2e-data-org-b-${Date.now()}`, ownerId: user.uid, createdAt: new Date(), updatedAt: new Date() });
    for (const orgId of [orgAId, orgBId]) {
      await setDocWithId("organization_members", `${orgId}_${user.uid}`, {
        organizationId: orgId, userId: user.uid, role: "admin", status: "active",
        displayName: user.email, joinedAt: new Date(), updatedAt: new Date(),
      });
    }
    const leadA = `OrgALead${Date.now()}`;
    const leadB = `OrgBLead${Date.now()}`;
    await createDoc("leads", { organizationId: orgAId, ownerId: user.uid, firstName: "E2E", lastName: leadA, email: `a${Date.now()}@playwright.test`, status: "New", source: "Other", value: 0, tags: [], createdAt: new Date(), updatedAt: new Date() });
    await createDoc("leads", { organizationId: orgBId, ownerId: user.uid, firstName: "E2E", lastName: leadB, email: `b${Date.now()}@playwright.test`, status: "New", source: "Other", value: 0, tags: [], createdAt: new Date(), updatedAt: new Date() });

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const { LoginPage } = await import("../../pages/login.page");
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword("Password1!");
      await loginPage.submit();
      await page.waitForURL("**/org", { timeout: 20000 });

      await page.goto(`/org/${orgAId}/leads`);
      await expect(page.getByText(leadA, { exact: false })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(leadB, { exact: false })).not.toBeVisible();

      await page.goto(`/org/${orgBId}/leads`);
      await expect(page.getByText(leadB, { exact: false })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(leadA, { exact: false })).not.toBeVisible();
    } finally {
      const { deleteDoc } = await import("../../helpers/admin");
      await deleteDoc("organizations", orgAId).catch(() => {});
      await deleteDoc("organizations", orgBId).catch(() => {});
      await deleteEphemeralUser(user.uid);
      await context.close();
    }
  });

  test("28.3 member removed from org loses access but keeps other orgs (single-org fixture caveat)", async ({ browser }) => {
    const uid = await getUserIdByEmail(USERS.scanner.email);
    const context = await browser.newContext();
    const page = await context.newPage();
    const { LoginPage } = await import("../../pages/login.page");
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.scanner.email, USERS.scanner.password);
    const orgId = orgIdOf(page);

    await setMemberFields(orgId, uid, { status: "suspended" });
    await page.goto(`/org/${orgId}/dashboard`);
    await expect(page.getByText(/do not have access|suspended|could not be found/i)).toBeVisible({ timeout: 15000 });

    await setMemberFields(orgId, uid, { status: "active" });
    await context.close();
  });
});
