import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5191",
    channel: "chrome",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npx vite --port 5191 --strictPort",
    url: "http://localhost:5191",
    reuseExistingServer: true,
  },
})
