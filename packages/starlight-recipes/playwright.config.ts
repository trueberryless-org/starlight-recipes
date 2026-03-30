import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.test.ts",
  timeout: 120000,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  webServer: [
    {
      command:
        "PLAYWRIGHT=true pnpm run build && PLAYWRIGHT=true pnpm run preview",
      cwd: "../../docs",
      reuseExistingServer: !process.env["CI"],
      url: "http://127.0.0.1:4321",
      timeout: 600000,
    },
  ],
});
