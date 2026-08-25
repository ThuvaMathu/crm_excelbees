import { test, expect } from "../../fixtures/auth";
import { LoginPage } from "../../pages/login.page";

test.describe("Authentication - Login Page", () => {
  test("displays login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.assertOnPage();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.googleButton).toBeVisible();
    await expect(loginPage.createAccountLink).toBeVisible();
  });

  test("shows validation errors for empty fields", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillEmail("invalid@nonexistent.com");
    await loginPage.fillPassword("wrongpassword");
    await loginPage.submit();
    await loginPage.assertErrorMessage(/invalid email or password/i);
  });

  test("navigates to signup page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.createAccountLink.click();
    await page.waitForURL("**/signup");
    await expect(page.getByText(/create|register|sign up/i).first()).toBeVisible();
  });

  test("navigates to forgot password page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await page.waitForURL("**/forgot-password");
  });
});