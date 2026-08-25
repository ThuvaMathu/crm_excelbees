import type { Page } from "@playwright/test";
import { URLS } from "../data/urls";

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToDashboard(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgDashboard(orgId));
}

export async function navigateToLeads(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgLeads(orgId));
}

export async function navigateToContacts(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgContacts(orgId));
}

export async function navigateToCompanies(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgCompanies(orgId));
}

export async function navigateToDeals(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgDeals(orgId));
}

export async function navigateToProjects(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgProjects(orgId));
}

export async function navigateToTasks(page: Page, orgId: string) {
  await navigateTo(page, URLS.orgTasks(orgId));
}

export async function clickSidebarLink(
  page: Page,
  linkName: string,
) {
  const sidebar = page.locator("nav, aside, [data-sidebar], .sidebar").first();
  await sidebar.getByText(linkName, { exact: false }).first().click();
  await page.waitForLoadState("domcontentloaded");
}

export async function clickBreadcrumb(
  page: Page,
  label: string,
) {
  await page
    .locator("nav[aria-label='breadcrumb'] a, .breadcrumbs a")
    .filter({ hasText: label })
    .first()
    .click();
  await page.waitForLoadState("domcontentloaded");
}