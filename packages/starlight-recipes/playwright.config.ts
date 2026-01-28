import { type PlaywrightTestConfig, defineConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests/e2e",
  testMatch: "**/*.test.ts",
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4321",
  },
};

if (!process.env.PLAYWRIGHT_BASE_URL) {
  config.webServer = {
    command:
      'pnpm -C "../../docs" dev --host 127.0.0.1 --port 4321 --strictPort',
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
  };
}

export default defineConfig(config);
