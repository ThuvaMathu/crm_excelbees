import type { Page } from "@playwright/test";

export async function waitForApp(page: Page) {
  // `networkidle` never fires here: Firestore keeps a long-lived
  // websocket/long-poll connection open for realtime listeners, so the
  // network is never idle for 500ms. Wait for DOM ready + any loading
  // spinner to clear instead.
  await page.waitForLoadState("domcontentloaded");
  await waitForLoadingSpinner(page);
}

export async function waitForLoadingSpinner(
  page: Page,
  timeout = 15000,
) {
  const spinner = page.locator(".animate-spin").first();
  try {
    await spinner.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    // no spinner appeared
  }
  await spinner.waitFor({ state: "hidden", timeout }).catch(() => {
    // spinner may have disappeared or not existed
  });
}

export async function waitForToast(
  page: Page,
  text?: string,
  type?: "success" | "error",
  timeout = 10000,
) {
  const toast = page.locator("[data-sonner-toast]");
  if (type) {
    await toast
      .filter({ has: page.locator(`[data-type="${type}"]`) })
      .first()
      .waitFor({ state: "visible", timeout });
  } else {
    await toast.first().waitFor({ state: "visible", timeout });
  }
  if (text) {
    await page.getByText(text).first().waitFor({ state: "visible", timeout });
  }
}

export async function waitForToastGone(page: Page, timeout = 10000) {
  const toast = page.locator("[data-sonner-toast]").first();
  await toast.waitFor({ state: "hidden", timeout }).catch(() => {});
}

export async function verifyNoErrorToast(page: Page, timeout = 3000) {
  const errorToast = page.locator('[data-sonner-toast] [data-type="error"]');
  const count = await errorToast.count();
  if (count > 0) {
    throw new Error(
      `Unexpected error toast: ${await errorToast.first().textContent()}`,
    );
  }
}