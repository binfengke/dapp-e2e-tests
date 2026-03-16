import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  grepInvert: process.env.CI ? /@manual/ : undefined,
  workers: 1,
  reporter: [
    ["list"],
    ...(process.env.CI ? [["github"]] : []),
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: process.env.DAPP_URL || "http://localhost:3000",
    testIdAttribute: "data-testid",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: process.env.CI ? "on-first-retry" : "off",
    screenshot: process.env.CI ? "only-on-failure" : "off",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
