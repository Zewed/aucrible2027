import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

/** Les noms des candidats, tels que content/candidats.yaml les écrit. */
const NOMS: string[] = parse(readFileSync("content/candidats.yaml", "utf8")).map((c: { nom: string }) => c.nom);

test("la landing n'a pas de menu : le logo en haut, et le bouton mène au questionnaire", async ({ page }) => {
  await page.goto("/presentation");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Les sujets de la présidentielle, un par un.");
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Au crible 2027" })).toBeVisible();
  await page.getByRole("link", { name: "Commencer le questionnaire" }).first().click();
  await expect(page).toHaveURL(/\/questionnaire$/);
});

test("la landing ne nomme aucun candidat", async ({ page }) => {
  await page.goto("/presentation");
  await expect(page.getByRole("heading", { name: "Tu n'as rien à croire sur parole." })).toBeVisible();
  const texte = await page.locator("main").innerText();
  for (const nom of NOMS) expect(texte, nom).not.toContain(nom);
});

test("une option de la question en exemple ouvre sa fiche", async ({ page }) => {
  await page.goto("/presentation");
  await page.getByRole("link", { name: /^A / }).click();
  await expect(page).toHaveURL(/\/question\/\d+$/);
});
