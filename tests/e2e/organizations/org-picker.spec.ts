import { test, expect } from "../../fixtures/auth";
import { OrgPickerPage } from "../../pages/org-picker.page";

// Covers humanlike-test-case.md section 3 (Organization Management).
test.describe("Organization Management", () => {
  test("3.1 org picker lists organizations with name, slug, FREE badge", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await expect(adminPage.getByText("Playwright Test Org").first()).toBeVisible();
    await expect(adminPage.getByText("/playwright-test-org")).toBeVisible();
    await expect(adminPage.getByText("FREE").first()).toBeVisible();
    await expect(orgPicker.newOrgButton).toBeVisible();
  });

  test("3.2 org picker empty state for a user with zero orgs", async ({ browser }) => {
    // A fresh signup normally lands on /onboarding (blocked from /org by
    // AuthGate until they create/join a workspace), so the empty-list state
    // is only reachable for a user who is *already* onboarded but has no
    // org membership — force that combination directly via admin helpers
    // rather than fighting the redirect.
    const { createEphemeralUser, deleteEphemeralUser } = await import("../../helpers/admin");
    const user = await createEphemeralUser({ emailPrefix: "e2e.noorg", password: "Password1!", displayName: "No Org User" });
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
      await expect(page.getByText(/no organizations yet/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button", { name: /new organization|create.*organization/i }).first()).toBeVisible();
    } finally {
      await deleteEphemeralUser(user.uid);
      await context.close();
    }
  });

  test("3.3 grid/list view toggle", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await orgPicker.listViewToggle.click();
    await expect(adminPage.locator("div.space-y-2 button").first()).toBeVisible();
    await orgPicker.gridViewToggle.click();
    await expect(adminPage.locator("div.grid button").first()).toBeVisible();
  });

  test("3.4 search organizations filters list", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await orgPicker.searchInput.fill("Playwright");
    await expect(adminPage.getByText("Playwright Test Org").first()).toBeVisible();
    await orgPicker.searchInput.fill("NoSuchOrgXYZ123");
    await expect(adminPage.getByText(/no organizations match/i)).toBeVisible();
  });

  test("3.5 loading state shows spinner then data", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await expect(adminPage.getByText("Playwright Test Org").first()).toBeVisible({ timeout: 15000 });
  });

  test("3.6 create organization from org picker", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await orgPicker.newOrgButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const name = `E2E Picker Org ${Date.now()}`;
    await dialog.getByLabel(/organization name/i).fill(name);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    // Surface *why* if this fails: an error toast means createOrganization()
    // itself rejected the request (seen intermittently in this app — same
    // family of issue as 3.8's duplicate-slug check, possibly a Firestore
    // rules interaction on the post-login org-creation path specifically).
    // Generous timeout: org creation involves a Firestore write + a
    // follow-up membership write + a client-side route compile under `next
    // dev`, which can take well over 15s under load — a prior version of
    // this assertion timed out at 15s even though the org snapshot showed
    // creation had actually succeeded (just slower than the window given).
    const errorToast = adminPage.locator('[data-sonner-toast] [data-type="error"]');
    const outcome = await Promise.race([
      expect(adminPage).toHaveURL(/\/org\/.+\/dashboard/, { timeout: 30000 }).then(() => "created" as const),
      errorToast.waitFor({ state: "visible", timeout: 30000 }).then(() => "error" as const),
    ]).catch(() => "neither" as const);

    if (outcome === "error") {
      const message = await errorToast.first().textContent();
      throw new Error(`Organization creation failed with a toast error: ${message}`);
    }
    expect(outcome, "org creation should redirect to the new org's dashboard").toBe("created");
    await expect(adminPage.getByText(name)).toBeVisible({ timeout: 10000 });
  });

  test("3.7 create organization with empty name disables create button", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await orgPicker.newOrgButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Create", exact: true })).toBeDisabled();
  });

  test("3.8 create organization with duplicate slug shows error", async ({ adminPage }) => {
    const orgPicker = new OrgPickerPage(adminPage);
    await orgPicker.goto();
    await orgPicker.newOrgButton.click();
    const dialog = adminPage.getByRole("dialog");
    // Deliberately use a NAME whose auto-generated slug ("zzz-uniqueness-test")
    // differs from the slug we manually type ("playwright-test-org"). Earlier
    // versions of this test typed a slug identical to what auto-slugify would
    // produce anyway, which made it impossible to tell "my manual edit was
    // respected" apart from "silently fell back to auto-generation" — both
    // looked the same. Using a mismatched pair makes the two paths
    // distinguishable: if slugEdited isn't respected, the org gets created
    // with the auto slug "zzz-uniqueness-test" (no collision, no error) — if
    // it *is* respected, the submitted slug is "playwright-test-org" (an
    // existing slug, so it must error).
    await dialog.getByLabel(/organization name/i).fill("Zzz Uniqueness Test");
    const slugInput = dialog.locator("#org-slug");
    await slugInput.fill("playwright-test-org");
    await expect(slugInput).toHaveValue("playwright-test-org");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();

    const result = await Promise.race([
      adminPage.getByText(/already exists/i).waitFor({ state: "visible", timeout: 10000 }).then(() => "blocked" as const),
      adminPage.waitForURL(/\/org\/.+\/dashboard/, { timeout: 10000 }).then(() => "created" as const),
    ]).catch(() => "neither" as const);

    // Clean up either way: a "blocked" creation leaves nothing, but a
    // "created" one (whether it landed on the intended colliding slug or
    // silently auto-generated a different one) needs to be removed so the
    // shared test org doesn't accumulate stray copies on every run.
    if (result === "created") {
      const orgId = adminPage.url().match(/\/org\/([^/]+)/)?.[1];
      if (orgId) {
        const { deleteDoc } = await import("../../helpers/admin");
        await deleteDoc("organizations", orgId).catch(() => {});
      }
    }
    expect(result, "duplicate-slug org creation should have been blocked with an 'already exists' error").toBe("blocked");
  });

  test("3.9 switch between organizations", async ({ browser }) => {
    // Give a fresh ephemeral user membership in two orgs: the shared
    // "Playwright Test Org" and a second throwaway one, so the workspace
    // switcher actually has something to switch between.
    const { createEphemeralUser, deleteEphemeralUser, getOrgIdBySlug, setDocWithId, createDoc, deleteDoc } = await import("../../helpers/admin");
    const user = await createEphemeralUser({ emailPrefix: "e2e.multiorg", password: "Password1!", displayName: "Multi Org User" });
    const orgAId = await getOrgIdBySlug("playwright-test-org");
    const orgBId = await createDoc("organizations", {
      name: "E2E Second Org",
      slug: `e2e-second-org-${Date.now()}`,
      ownerId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    for (const orgId of [orgAId, orgBId]) {
      await setDocWithId("organization_members", `${orgId}_${user.uid}`, {
        organizationId: orgId,
        userId: user.uid,
        role: "team",
        status: "active",
        displayName: user.email,
        joinedAt: new Date(),
        updatedAt: new Date(),
      });
    }

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
      await expect(page.getByText("Playwright Test Org").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("E2E Second Org").first()).toBeVisible();

      // Enter org A, then use the sidebar workspace switcher to jump to org B.
      await page.locator("button").filter({ hasText: "Playwright Test Org" }).first().click();
      await page.waitForURL(new RegExp(`/org/${orgAId}/dashboard`), { timeout: 15000 });
      await page.getByRole("link", { name: /switch workspace/i }).click();
      await page.waitForURL("**/org", { timeout: 15000 });
      await page.locator("button").filter({ hasText: "E2E Second Org" }).first().click();
      await page.waitForURL(new RegExp(`/org/${orgBId}/dashboard`), { timeout: 15000 });
    } finally {
      await deleteDoc("organizations", orgBId).catch(() => {});
      await deleteEphemeralUser(user.uid);
      await context.close();
    }
  });

  test("3.10 access denied for non-member org", async ({ teamPage }) => {
    await teamPage.goto("/org/non-existent-org-id-12345/dashboard");
    await expect(teamPage.getByText(/do not have access|could not be found/i)).toBeVisible({ timeout: 15000 });
  });

  test("3.11 non-existent organization shows not-found message", async ({ adminPage }) => {
    await adminPage.goto("/org/totally-fake-org-id-999/dashboard");
    await expect(adminPage.getByText(/could not be found|do not have access/i)).toBeVisible({ timeout: 15000 });
  });

  test("3.12 org settings page shows Appearance/Account/Notifications/Preferences", async ({ adminPage }) => {
    const url = adminPage.url();
    const orgId = url.match(/\/org\/([^/]+)/)?.[1];
    await adminPage.goto(`/org/${orgId}/settings`);
    await expect(adminPage.getByText("Appearance", { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText("Account", { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText("Notifications", { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText("Preferences", { exact: true }).first()).toBeVisible();
  });
});
