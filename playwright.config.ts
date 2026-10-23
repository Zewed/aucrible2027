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
    // Laisse les tests fixer le jour côté serveur, comme ils le fixent dans le navigateur,
    // et ajoute aux fiches de démonstration les fiches de test (jours de silence électoral…).
    env: { AUCRIBLE_HORLOGE_DE_TEST: "1", AUCRIBLE_FICHES_DE_TEST: "e2e/fiches" },
    timeout: 180_000,
  },
});
