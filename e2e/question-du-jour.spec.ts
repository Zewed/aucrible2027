import { expect, test, type Page } from "@playwright/test";

const CANDIDATS = [
  "Marine Le Pen", "Jean-Luc Mélenchon", "Édouard Philippe", "Raphaël Glucksmann",
  "Bruno Retailleau", "David Lisnard", "Gabriel Attal", "Éric Zemmour",
  "Marine Tondelier", "Fabien Roussel", "Nicolas Dupont-Aignan", "François Ruffin",
  "Nathalie Arthaud",
];

/** Choisir une option comme le fait l'électeur : en touchant sa carte. */
async function choisir(page: Page, libelle: string) {
  await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).click();
  await expect(page.getByRole("radio", { name: libelle })).toBeChecked();
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-23T09:00:00+02:00"));
});

test("le 23 octobre 2026, l'accueil affiche la question du jour, ses cinq options et aucun nom de candidat", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
  for (const option of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    await expect(page.getByRole("radio", { name: option })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
  for (const nom of CANDIDATS) {
    await expect(page.getByText(nom)).toHaveCount(0);
  }
});

test("valider « À la carte, avec un système à points » révèle Nicolas Dupont-Aignan et Édouard Philippe", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "À la carte, avec un système à points");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  await expect(page).toHaveURL(/\/revelation$/);
  const defenseurs = page.getByRole("list", { name: "Ils défendent ton option" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(2);
  await expect(defenseurs.getByText("Nicolas Dupont-Aignan")).toBeVisible();
  await expect(defenseurs.getByText("Édouard Philippe")).toBeVisible();
});

test("valider « 62 ans » révèle Marine Le Pen, Marine Tondelier et Raphaël Glucksmann", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "62 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  const defenseurs = page.getByRole("list", { name: "Ils défendent ton option" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(3);
  for (const nom of ["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]) {
    await expect(defenseurs.getByText(nom)).toBeVisible();
  }
  await expect(defenseurs.getByText("Édouard Philippe")).toHaveCount(0);
});

test("la carte de la question n° 24 affiche la puce « Travail & retraites » au-dessus de la question", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const puce = carte.getByText("Travail & retraites", { exact: true });
  await expect(puce).toBeVisible();
  const question = carte.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const [hautPuce, hautQuestion] = await Promise.all([puce.boundingBox(), question.boundingBox()]);
  expect(hautPuce!.y).toBeLessThan(hautQuestion!.y);
});

test("une question d'un autre thème affiche son propre thème dans la puce", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
  await page.goto("/");
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  await expect(carte.getByText("Écologie & énergie", { exact: true })).toBeVisible();
  await expect(carte.getByText("Travail & retraites", { exact: true })).toHaveCount(0);
});

const ORANGE = "rgb(255, 122, 26)";
const VERT = "rgb(34, 184, 90)";
const fond = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);

test("la question n° 24 (Travail & retraites) s'affiche en orange", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(ORANGE);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(ORANGE);
});

test("une question d'Écologie & énergie s'affiche en vert, et les 11 thèmes ont 11 couleurs", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T09:00:00+02:00"));
  await page.goto("/");
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(VERT);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(VERT);

  const couleurs = await page.evaluate(() =>
    ["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"].map((t) => {
      const el = document.createElement("div");
      el.className = `theme-${t}`;
      el.style.background = "var(--theme)";
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    }),
  );
  expect(new Set(couleurs).size).toBe(11);
});
