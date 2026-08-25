import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.test first, fall back to .env.local for Firebase config
dotenv.config({ path: path.resolve("./.env.test") });
dotenv.config({ path: path.resolve("./.env.local"), override: false });

// Overridable via PLAYWRIGHT_TEST_PORT — port 3000 on this machine has been
// observed getting reclaimed by an unrelated project ("InvestEase Buyers
// Agent") that auto-restarts under a new PID even after being killed, so a
// fixed 3000 isn't reliable here.
const PORT = Number(process.env.PLAYWRIGHT_TEST_PORT) || 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 1 worker locally: this is a Next dev server that lazily compiles each
  // route on first hit, and many specs open extra browser contexts within
  // the test body — running workers in parallel causes compile contention
  // that manifests as spurious "login form never appeared" timeouts.
  workers: process.env.CI ? 4 : 1,
  timeout: 90000,
  expect: {
    timeout: 15000,
  },

  reporter: [
    ["html", { outputFolder: "tests/reports", open: "never" }],
    ["list"],
    ...(process.env.CI ? [["json", { outputFile: "tests/reports/results.json" }] as const] : []),
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 20000,
    navigationTimeout: 45000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: !!process.env.CI || true },
    },
  ],

  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },

  outputDir: "tests/test-results",
});