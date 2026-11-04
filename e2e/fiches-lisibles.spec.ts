import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

// En YAML, une phrase sans guillemets qui contient « : » devient un objet, et la fiche fait planter la page.
test("chaque phrase du contexte des fiches de content/questions est un texte", () => {
  for (const fichier of readdirSync("content/questions")) {
    const fiche = parse(readFileSync(`content/questions/${fichier}`, "utf8"));
    for (const phrase of fiche.contexte) expect(typeof phrase, `${fichier} : ${JSON.stringify(phrase)}`).toBe("string");
  }
});

// La neutralité d'une fenêtre « plus » : aucune option n'a plus d'arguments qu'une autre, pour comme contre.
test("les options d'une fiche ont toutes autant d'arguments, pour et contre", () => {
  for (const fichier of readdirSync("content/questions")) {
    const { options } = parse(readFileSync(`content/questions/${fichier}`, "utf8"));
    if (!options.some((option: { detail?: unknown }) => option.detail)) continue;
    const comptes = options.flatMap((option: { detail: { defenseurs: unknown[]; critiques: unknown[] } }) => [option.detail.defenseurs.length, option.detail.critiques.length]);
    expect(new Set(comptes).size, `${fichier} : ${comptes}`).toBe(1);
  }
});
