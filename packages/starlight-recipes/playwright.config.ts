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
    baseURL: "http://localhost:4321",
  },
  webServer: [
    {
      command:
        "PLAYWRIGHT=true pnpm run build && PLAYWRIGHT=true pnpm run preview",
      cwd: "../../docs",
      reuseExistingServer: !process.env["CI"],
      url: "http://localhost:4321",
      timeout: 100000,
    },
  ],
});
