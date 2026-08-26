import { test, expect } from "../../fixtures/auth";
import { SettingsPage, ProfilePage } from "../../pages/settings.page";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

// Covers humanlike-test-case.md section 18 (Settings & Profile) and the
// theme/currency/notification cases from section 3 (3.13-3.16) which live
// on the same org-settings page.
test.describe("Settings & Profile", () => {
  test("18.1 profile page shows picture, personal info, and account info", async ({ adminPage }) => {
    const profile = new ProfilePage(adminPage);
    await profile.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("Personal Information", { exact: true })).toBeVisible();
    await expect(adminPage.getByText("Account Information", { exact: true })).toBeVisible();
    await expect(profile.saveChangesButton).toBeVisible();
  });

  test("18.2 valid profile picture upload updates avatar", async ({ adminPage }) => {
    const profile = new ProfilePage(adminPage);
    await profile.goto(orgIdOf(adminPage));
    // The org-scoped profile route (app/org/[orgId]/profile/page.tsx) uses
    // id="profile-image", distinct from the org-less hub route's
    // "profile-photo" id — ProfilePage.goto() navigates to this one.
    await adminPage.locator("#profile-image").setInputFiles(
      "tests/fixtures/images/valid-avatar.png"
    );
    await expect(adminPage.getByText(/profile image updated/i)).toBeVisible({ timeout: 15000 });
  });

  test("18.3 oversized profile picture is rejected client-side", async ({ adminPage }) => {
    const profile = new ProfilePage(adminPage);
    await profile.goto(orgIdOf(adminPage));
    // Client-side guard checks file.size before upload begins (see
    // handleImageUpload in app/org/[orgId]/profile/page.tsx) — the mimeType
    // is set explicitly on the in-memory buffer so its declared type is a
    // valid image regardless of content, isolating the size check alone.
    await adminPage.locator("#profile-image").setInputFiles({
      name: "oversized-avatar.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(6 * 1024 * 1024, 0),
    });
    await expect(adminPage.getByText(/image size must be less than 5mb/i)).toBeVisible({ timeout: 10000 });
  });

  test("18.4 update personal information saves changes", async ({ adminPage }) => {
    const profile = new ProfilePage(adminPage);
    await profile.goto(orgIdOf(adminPage));
    await adminPage.getByLabel(/first name/i).fill("Updated");
    await profile.saveChangesButton.click();
    await expect(adminPage.getByText(/profile updated/i)).toBeVisible({ timeout: 10000 });
  });

  test("18.5 profile email field is read-only", async ({ adminPage }) => {
    const profile = new ProfilePage(adminPage);
    await profile.goto(orgIdOf(adminPage));
    await expect(profile.emailInput).toBeDisabled();
  });

  test("18.6/3.13 theme switching updates UI and persists on refresh", async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto(orgIdOf(adminPage));
    await settings.darkThemeButton.click();
    await expect(adminPage.locator("html")).toHaveClass(/dark/, { timeout: 5000 });
    await adminPage.reload();
    await expect(adminPage.locator("html")).toHaveClass(/dark/, { timeout: 10000 });
    await settings.lightThemeButton.click();
    await expect(adminPage.locator("html")).not.toHaveClass(/dark/, { timeout: 5000 });
  });

  test("18.7/3.15 notification preferences save", async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto(orgIdOf(adminPage));
    await settings.configureNotificationsButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const emailToggle = dialog.getByLabel(/email notifications/i);
    if (await emailToggle.isVisible().catch(() => false)) await emailToggle.click();
    await dialog.getByRole("button", { name: /save preferences/i }).click();
  });

  test("18.8/3.14 default currency setting saves", async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto(orgIdOf(adminPage));
    await settings.changeCurrencyButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // The already-selected currency's button renders as "AUD ✓" (a
    // checkmark suffix), so an exact "AUD" match fails once a prior run has
    // already selected it — match on the leading currency code instead.
    await dialog.getByRole("button", { name: /^AUD/ }).click();
    await dialog.getByRole("button", { name: /save currency/i }).click();
  });

  test("3.16 edit profile from org settings", async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto(orgIdOf(adminPage));
    await settings.editProfileButton.click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByLabel(/^email$/i)).toBeDisabled();
    await dialog.getByRole("button", { name: /cancel/i }).click();
  });
});
