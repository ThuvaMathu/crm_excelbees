import { test as base, type Page } from "@playwright/test";
import { USERS, type TestUser } from "../data/users";
import { LoginPage } from "../pages/login.page";
import { isLoggedIn } from "../helpers/auth";

interface AuthFixtures {
  adminPage: Page;
  managerPage: Page;
  teamPage: Page;
  scannerPage: Page;
  authenticatedPage: Page;
}

async function authenticate(page: Page, user: TestUser) {
  if (await isLoggedIn(page)) return;

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
}

function getOrCreateOrgId(page: Page): string {
  const url = page.url();
  const match = url.match(/\/org\/([^/]+)/);
  if (match) return match[1];
  throw new Error(
    "No orgId found in URL. Make sure you are on an org workspace page.",
  );
}

export const test = base.extend<AuthFixtures & { getOrgId: (page: Page) => string }>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await authenticate(page, USERS.admin);
    await use(page);
    await context.close();
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await authenticate(page, USERS.manager);
    await use(page);
    await context.close();
  },

  teamPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await authenticate(page, USERS.team);
    await use(page);
    await context.close();
  },

  scannerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await authenticate(page, USERS.scanner);
    await use(page);
    await context.close();
  },

  authenticatedPage: async ({ adminPage }, use) => {
    await use(adminPage);
  },

  getOrgId: async ({}, use) => {
    await use(getOrCreateOrgId);
  },
});

export { expect } from "@playwright/test";