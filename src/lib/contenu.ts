import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type Candidat = { id: string; nom: string; parti: string };
export type Option = { id: string; libelle: string; implique: string; defenseurs: string; critiques: string };
export type Source = { organisme: string; document?: string; annee: number };
export type Chiffre = { valeur: string; unite?: string; legende: string; source: Source };
export type Theme = { id: string; nom: string; classe: string };
export type Question = {
  numero: number;
  date: string;
  theme: string;
  question: string;
  contexte: string[];
  chiffres: Chiffre[];
  options: Option[];
  positions: Record<string, string>;
};

const RACINE = path.join(process.cwd(), "content");

export function lireCandidats(): Candidat[] {
  return parse(readFileSync(path.join(RACINE, "candidats.yaml"), "utf8"));
}

export function lireThemes(): Theme[] {
  return parse(readFileSync(path.join(RACINE, "themes.yaml"), "utf8"));
}

export function lireQuestions(): Question[] {
  const dossier = path.join(RACINE, "questions");
  return readdirSync(dossier)
    .filter((fichier) => fichier.endsWith(".yaml"))
    .map((fichier) => parse(readFileSync(path.join(dossier, fichier), "utf8")) as Question)
    .map((q) => ({ ...q, date: String(q.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
