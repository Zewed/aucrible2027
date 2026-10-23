import { defineConfig, devices } from "@playwright/test";

const PORT = 3127;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [
    { name: "telephone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/favicon.ico`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
