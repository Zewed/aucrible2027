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
