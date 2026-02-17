import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.test.ts",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
  use: {
    baseURL: "http://172.0.0.1:4321",
  },
  webServer: [
    {
      command: "pnpm run build && pnpm run preview",
      cwd: "../../docs",
      reuseExistingServer: !process.env["CI"],
      url: "http://localhost:4321",
      timeout: 60000,
    },
  ],
});
