import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type Candidat = { id: string; nom: string; parti: string };
export type Option = { id: string; libelle: string };
export type Question = {
  numero: number;
  date: string;
  question: string;
  options: Option[];
  positions: Record<string, string>;
};

const RACINE = path.join(process.cwd(), "content");

export function lireCandidats(): Candidat[] {
  return parse(readFileSync(path.join(RACINE, "candidats.yaml"), "utf8"));
}

export function lireQuestions(): Question[] {
  const dossier = path.join(RACINE, "questions");
  return readdirSync(dossier)
    .filter((fichier) => fichier.endsWith(".yaml"))
    .map((fichier) => parse(readFileSync(path.join(dossier, fichier), "utf8")) as Question)
    .map((q) => ({ ...q, date: String(q.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
