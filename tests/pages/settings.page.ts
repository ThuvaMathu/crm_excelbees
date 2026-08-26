import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { URLS } from "../data/urls";

export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgSettings(orgId));
    await this.waitForReady();
    return this;
  }

  get lightThemeButton() {
    return this.page.getByRole("button", { name: "Light", exact: true });
  }

  get darkThemeButton() {
    return this.page.getByRole("button", { name: "Dark", exact: true });
  }

  get systemThemeButton() {
    return this.page.getByRole("button", { name: "System", exact: true });
  }

  get editProfileButton() {
    return this.page.getByRole("button", { name: "Edit Profile", exact: true });
  }

  get configureNotificationsButton() {
    return this.page.getByRole("button", { name: "Configure Notifications", exact: true });
  }

  get changeCurrencyButton() {
    return this.page.getByRole("button", { name: "Change Currency", exact: true });
  }
}

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(orgId: string) {
    await this.page.goto(URLS.orgProfile(orgId));
    await this.waitForReady();
    return this;
  }

  get uploadPhotoButton() {
    return this.page.getByRole("button", { name: "Upload Photo", exact: true });
  }

  get saveChangesButton() {
    return this.page.getByRole("button", { name: "Save Changes", exact: true });
  }

  get emailInput() {
    return this.page.getByLabel(/^email$/i);
  }
}
