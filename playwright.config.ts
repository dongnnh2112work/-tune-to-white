import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://127.0.0.1:43123",
    viewport: { width: 1080, height: 1920 },
    trace: "off",
    video: { mode: "on", size: { width: 1080, height: 1920 } },
    screenshot: "off",
  },
  webServer: {
    command: "npx next start --hostname 127.0.0.1 --port 43123",
    url: "http://127.0.0.1:43123",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1080, height: 1920 } } }],
});
