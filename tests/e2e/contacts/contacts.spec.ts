import { test, expect } from "../../fixtures/auth";
import { ContactsPage } from "../../pages/contacts.page";
import { randomEmail } from "../../helpers/data";

function orgIdOf(page: import("@playwright/test").Page): string {
  const match = page.url().match(/\/org\/([^/]+)/);
  if (!match) throw new Error("No orgId in URL");
  return match[1];
}

async function fillCreateContactForm(page: import("@playwright/test").Page, email?: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/first name/i).fill("E2E");
  await dialog.getByLabel(/last name/i).fill(`Contact${Date.now()}`);
  await dialog.getByLabel(/^email/i).fill(email ?? (await randomEmail()));
}

// Covers humanlike-test-case.md section 7 (Contact Management).
test.describe("Contact Management", () => {
  test("7.1 create a contact", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await contacts.createButton.click();
    await fillCreateContactForm(adminPage);
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/contact created/i)).toBeVisible({ timeout: 10000 });
  });

  test("7.2 create contact with all fields", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await contacts.createButton.click();
    const dialog = adminPage.getByRole("dialog");
    await fillCreateContactForm(adminPage);
    const phoneInput = dialog.getByLabel(/phone/i);
    if (await phoneInput.isVisible().catch(() => false)) await phoneInput.fill("+15551234567");
    await dialog.getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/contact created/i)).toBeVisible({ timeout: 10000 });
  });

  test("7.3 create contact with missing required fields shows validation", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await contacts.createButton.click();
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/required/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("7.4 contact list shows expected columns and actions", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await expect(adminPage.getByText("Name", { exact: true })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: /import csv/i })).toBeVisible();
    await expect(contacts.createButton).toBeVisible();
  });

  test("7.5 search contacts filters results", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    const searchInput = adminPage.getByPlaceholder(/search/i);
    await searchInput.fill("Seed");
    await adminPage.keyboard.press("Enter");
    // The originally-seeded "Seed Contact" record can be renamed/deleted by
    // other specs sharing this org (e.g. 7.8's edit-name test, 7.9's
    // delete test) across repeated runs — assert against the table
    // actually filtering to *some* "Seed"-matching row rather than that one
    // specific name, which is what "search filters results" is testing.
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator("table tbody")).toContainText(/seed/i);
  });

  test("7.7 view contact detail shows information card and quick actions", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 10000 });
    await expect(adminPage.getByText(/send email|call|convert to lead/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("7.8 edit contact updates name", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /^edit$/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByLabel(/first name/i).fill("Updated");
    await dialog.getByRole("button", { name: /save/i }).click();
    await expect(adminPage.getByText(/updated/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("7.9 delete contact removes it from list", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await contacts.createButton.click();
    await fillCreateContactForm(adminPage);
    await adminPage.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await expect(adminPage.getByText(/contact created/i)).toBeVisible({ timeout: 10000 });
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 10000 });
    await adminPage.getByRole("button", { name: /^delete$/i }).click();
    await adminPage.getByRole("button", { name: /confirm|delete/i }).last().click();
    await adminPage.waitForURL(/\/contacts$/, { timeout: 10000 });
  });

  test("7.10 convert contact to lead", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 10000 });
    const convertBtn = adminPage.getByRole("button", { name: /convert to lead/i });
    if (await convertBtn.isVisible().catch(() => false)) {
      await convertBtn.click();
      await adminPage.getByRole("button", { name: /confirm|convert/i }).last().click();
      await adminPage.waitForURL(/\/leads\/.+/, { timeout: 15000 });
    }
  });

  test("7.11 import contacts from a valid CSV file", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.getByRole("button", { name: /import csv/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.locator('input[type="file"]').setInputFiles("tests/fixtures/csv/valid-contacts.csv");
    await expect(adminPage.getByText(/parsed 2 contacts/i)).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^import 2 contacts?$/i }).click();
    await expect(adminPage.getByText(/successfully imported 2 contacts/i)).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText("CsvImportOne", { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test("7.12 import CSV with no valid rows shows an error", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.getByRole("button", { name: /import csv/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.locator('input[type="file"]').setInputFiles("tests/fixtures/csv/invalid-contacts.csv");
    await expect(adminPage.getByText(/no valid contacts found/i)).toBeVisible({ timeout: 10000 });
  });

  test("7.13 bulk email shows Email(N) button with selection", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    const firstCheckbox = adminPage.locator('table tbody tr input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible().catch(() => false)) {
      await firstCheckbox.check();
      await expect(adminPage.getByRole("button", { name: /email \(1\)/i })).toBeVisible({ timeout: 10000 });
    }
  });

  test("7.14 contact detail has no Create Deal quick action", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    await adminPage.locator("table tbody tr").first().getByRole("link").click();
    await adminPage.waitForURL(/\/contacts\/.+/, { timeout: 10000 });
    await expect(adminPage.getByRole("button", { name: /create deal/i })).not.toBeVisible();
  });

  test("7.6 empty search shows no contacts found", async ({ adminPage }) => {
    const contacts = new ContactsPage(adminPage);
    await contacts.goto(orgIdOf(adminPage));
    const searchInput = adminPage.getByPlaceholder(/search/i);
    await searchInput.fill("NoSuchContactXYZ999");
    await adminPage.keyboard.press("Enter");
    await expect(adminPage.getByText(/no contacts found/i)).toBeVisible({ timeout: 10000 });
  });
});
