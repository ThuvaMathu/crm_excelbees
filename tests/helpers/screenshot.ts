import type { Page } from "@playwright/test";
import * as path from "path";

const SCREENSHOT_DIR = path.resolve("tests/screenshots");

export async function screenshot(
  page: Page,
  name: string,
) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`),
    fullPage: true,
  });
}

export async function screenshotOnFailure(
  page: Page,
  testName: string,
) {
  const sanitized = testName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  await screenshot(page, `failure-${sanitized}`);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}