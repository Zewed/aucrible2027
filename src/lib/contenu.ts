import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

/** Où en est la candidature : son état (« Candidature déclarée ») et ce qui suit, en une phrase. */
export type StatutDeCandidature = { etat: string; suite?: string };
export type Candidat = { id: string; nom: string; parti: string; initiales: string; statut?: StatutDeCandidature };
export type Option = {
  id: string;
  libelle: string;
  implique: string;
  defenseurs: string;
  critiques: string;
  /** L'option ne se range pas sur l'échelle des autres : elle compte tout ou rien dans le classement. */
  horsEchelle?: boolean;
  /** Ses notes sur le plateau, de −2 à +2, sur l'un des axes, les deux ou aucun. */
  axes?: Axes;
};

/** Les deux axes du plateau (SPEC.md, « Résultats ») : −2 pour plus de redistribution, ou progressiste ; +2 pour plus de marché, ou conservateur. */
export type Axes = { economie?: number; societe?: number };
export type Source = { organisme: string; document?: string; annee: number };
export type Chiffre = { valeur: string; unite?: string; legende: string; source: Source };
export type Theme = { id: string; nom: string; classe: string };
/** Ce qu'un candidat défend sur une fiche, et d'où on le sait. */
export type Position = { option: string; source: string; statut: "officielle" | "deduite" };
export type Lien = { titre: string; url: string };
export type Question = {
  numero: number;
  date: string;
  theme: string;
  question: string;
  contexte: string[];
  chiffres: Chiffre[];
  options: Option[];
  positions: Record<string, Position>;
  /** 2 à 3 liens vers les organismes qui documentent le sujet. */
  pourAllerPlusLoin?: Lien[];
};

const RACINE = path.join(process.cwd(), "content");

export function lireCandidats(): Candidat[] {
  return parse(readFileSync(path.join(RACINE, "candidats.yaml"), "utf8"));
}

export function lireThemes(): Theme[] {
  return parse(readFileSync(path.join(RACINE, "themes.yaml"), "utf8"));
}

/** Une fiche, ou rien si elle a été retirée entre la lecture du dossier et la sienne. */
function lireFiche(chemin: string): Question[] {
  try {
    return [parse(readFileSync(chemin, "utf8")) as Question];
  } catch (erreur) {
    if ((erreur as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw erreur;
  }
}

/** Les fiches de content/questions, plus, pour les tests de bout en bout seulement, celles du dossier de test. */
export function lireQuestions(): Question[] {
  const dossiers = [path.join(RACINE, "questions")];
  if (process.env.AUCRIBLE_FICHES_DE_TEST) dossiers.push(path.join(process.cwd(), process.env.AUCRIBLE_FICHES_DE_TEST));
  return dossiers
    .flatMap((dossier) =>
      readdirSync(dossier)
        .filter((fichier) => fichier.endsWith(".yaml"))
        .flatMap((fichier) => lireFiche(path.join(dossier, fichier))),
    )
    .map((q) => ({ ...q, date: String(q.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
