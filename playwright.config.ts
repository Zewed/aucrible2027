import { defineConfig, devices } from "@playwright/test";

const PORT = 3127;
// La base Postgres des tests (scripts/base-locale.sh), jamais une autre : le serveur des tests y écrit, les tests y
// relisent ce qui est arrivé.
process.env.DATABASE_URL = "postgres://aucrible:aucrible@127.0.0.1:5447/aucrible_test";
// L'espace de l'auteur (/admin) en test : un secret de session et une app OAuth GitHub de test, jamais les vrais. Les
// tests fabriquent une session avec ce secret, comme si l'auteur s'était connecté ; l'app n'a pas d'autre porte.
process.env.AUTH_SECRET = "secret-des-tests-de-bout-en-bout-seulement-0123456789";
process.env.AUTH_GITHUB_ID = "app-oauth-de-test";

export default defineConfig({
  testDir: "./e2e",
  // Démarre la base Postgres locale avant les tests.
  globalSetup: "./e2e/base.setup.ts",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [
    { name: "telephone", use: { ...devices["Pixel 7"] }, testIgnore: /video\.spec\.ts/ },
    // Les vrais rendus de la vidéo du jour, longs et gourmands : après les autres tests, pour ne pas les ralentir.
    { name: "video", testMatch: /video\.spec\.ts/, dependencies: ["telephone"] },
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
