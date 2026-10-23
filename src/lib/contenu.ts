import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

/** Où en est la candidature : son état (« Candidature déclarée ») et ce qui suit, en une phrase. */
export type StatutDeCandidature = { etat: string; suite?: string };
/**
 * Le retrait d'un candidat : son jour (AAAA-MM-JJ), le candidat qu'il soutient s'il en nomme un, et l'accord de
 * « retiré », que l'auteur du contenu écrit ; sans accord, la fiche écrit « retiré·e », comme SPEC.md.
 */
export type Retrait = { date: string; soutien?: string; accord?: "feminin" | "masculin" };
export type Candidat = {
  id: string;
  nom: string;
  parti: string;
  initiales: string;
  statut?: StatutDeCandidature;
  retrait?: Retrait;
  /** Le candidat qu'il remplace dans le même parti (SPEC.md, « Remplacement ») : il reprend ses positions. */
  remplace?: string;
};
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

/**
 * Les candidats de content/candidats.yaml. Pour les tests de bout en bout seulement, des ajouts de test
 * (e2e/fiches/candidats/<nom>.yaml) les complètent candidat par candidat, par exemple d'un retrait ; un ajout qui
 * « remplace » un candidat prend sa place et garde son parti.
 */
export function lireCandidats(ajoutsDeTest?: string): Candidat[] {
  const candidats: Candidat[] = parse(readFileSync(path.join(RACINE, "candidats.yaml"), "utf8"));
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  if (!test || !ajoutsDeTest || !/^[a-z-]+$/.test(ajoutsDeTest)) return candidats;
  const ajouts: Partial<Candidat>[] = parse(readFileSync(path.join(process.cwd(), test, "candidats", `${ajoutsDeTest}.yaml`), "utf8"));
  return candidats.map((c) => {
    const remplacant = ajouts.find((a) => a.remplace === c.id);
    if (remplacant) return { id: c.id, nom: c.nom, parti: c.parti, initiales: c.initiales, ...remplacant };
    return { ...c, ...ajouts.find((a) => a.id === c.id) };
  });
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

/**
 * Les fiches de content/questions, plus, pour les tests de bout en bout seulement, celles du dossier de test.
 * Un test peut aussi choisir un jeu de fiches à lui (un sous-dossier du dossier de test), qui remplace tout le reste.
 */
export function lireQuestions(jeuDeTest?: string): Question[] {
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  const dossiers =
    test && jeuDeTest && /^[a-z-]+$/.test(jeuDeTest)
      ? [path.join(process.cwd(), test, jeuDeTest)]
      : [path.join(RACINE, "questions"), ...(test ? [path.join(process.cwd(), test)] : [])];
  return dossiers
    .flatMap((dossier) =>
      readdirSync(dossier)
        .filter((fichier) => fichier.endsWith(".yaml"))
        .flatMap((fichier) => lireFiche(path.join(dossier, fichier))),
    )
    .map((q) => ({ ...q, date: String(q.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
