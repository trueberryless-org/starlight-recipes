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
    baseURL: "http://127.0.0.1:4321",
  },
  webServer: [
    {
      command: "pnpm run build && pnpm dlx netlify serve",
      cwd: "../../docs",
      reuseExistingServer: !process.env["CI"],
      url: "http://127.0.0.1:8888",
      timeout: 60000,
    },
  ],
});
