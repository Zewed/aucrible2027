import { existsSync, readdirSync, readFileSync } from "node:fs";
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
/** Un côté du débat, pour l'image 5 du carrousel : son titre (« Pour relever l'âge ») et l'argument que ses défenseurs signeraient. */
export type Cote = { titre: string; argument: string };
/** Un choix de l'autocollant « Et toi ? » de la story : « 62 ans », et en plus petit « ou moins ». */
export type ChoixDeStory = { choix: string; precision?: string };
/** La vidéo explicative de la fiche, montrée à la première étape quand elle existe. */
export type VideoExplicative = { url: string; duree: string };
export type Question = {
  numero: number;
  date: string;
  theme: string;
  question: string;
  contexte: string[];
  chiffres: Chiffre[];
  options: Option[];
  positions: Record<string, Position>;
  video?: VideoExplicative;
  /** Le sujet en quelques mots, sur la vignette de la vidéo : « L'installation des médecins ». */
  titreCourt?: string;
  /** 2 à 3 liens vers les organismes qui documentent le sujet. */
  pourAllerPlusLoin?: Lien[];
  /** Les deux côtés de l'image 5 du carrousel, que l'auteur écrit dans la fiche (décision du 25 octobre). */
  cotes?: [Cote, Cote];
  /** Les deux choix de l'autocollant « Et toi ? » de la story, que l'auteur écrit aussi dans la fiche. */
  story?: [ChoixDeStory, ChoixDeStory];
};

const RACINE = path.join(process.cwd(), "content");

/**
 * Les candidats de content/candidats.yaml. Pour les tests de bout en bout seulement, des ajouts de test
 * (e2e/fiches/candidats/<nom>.yaml) les complètent candidat par candidat, par exemple d'un retrait ; un ajout qui
 * « remplace » un candidat prend sa place et garde son parti, et un ajout d'un autre identifiant entre dans la liste,
 * comme un candidat qui se déclare.
 */
export function lireCandidats(ajoutsDeTest?: string): Candidat[] {
  const candidats: Candidat[] = parse(readFileSync(path.join(RACINE, "candidats.yaml"), "utf8"));
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  if (!test || !ajoutsDeTest || !/^[a-z-]+$/.test(ajoutsDeTest)) return candidats;
  const ajouts: Partial<Candidat>[] = parse(readFileSync(path.join(process.cwd(), test, "candidats", `${ajoutsDeTest}.yaml`), "utf8"));
  const entrants = ajouts.filter((a) => !a.remplace && !candidats.some((c) => c.id === a.id)) as Candidat[];
  return candidats
    .map((c) => {
      const remplacant = ajouts.find((a) => a.remplace === c.id);
      if (remplacant) return { id: c.id, nom: c.nom, parti: c.parti, initiales: c.initiales, ...remplacant };
      return { ...c, ...ajouts.find((a) => a.id === c.id) };
    })
    .concat(entrants);
}

/**
 * La liste officielle du Conseil constitutionnel (SPEC.md, « Candidats ») : son jour de publication et ses candidats.
 * Un candidat déjà dans content/candidats.yaml n'y est nommé que par son identifiant ; un nouveau y a tout ce que sa
 * fiche montre.
 */
export type ListeOfficielle = { date: string; candidats: (Pick<Candidat, "id"> & Partial<Candidat>)[] };

/**
 * La liste officielle de content/liste-officielle.yaml, ou rien tant que l'auteur ne l'a pas ajoutée. Pour les tests de
 * bout en bout seulement, une liste de test (e2e/fiches/listes/<nom>.yaml) la remplace.
 */
export function lireListeOfficielle(jeuDeTest?: string): ListeOfficielle | null {
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  const fichier =
    test && jeuDeTest && /^[a-z-]+$/.test(jeuDeTest)
      ? path.join(process.cwd(), test, "listes", `${jeuDeTest}.yaml`)
      : path.join(RACINE, "liste-officielle.yaml");
  if (!existsSync(fichier)) return null;
  const liste: ListeOfficielle = parse(readFileSync(fichier, "utf8"));
  return { ...liste, date: String(liste.date) };
}

/**
 * Une correction publiée dans le journal : son jour (AAAA-MM-JJ), son type, le thème de la fiche corrigée, la question
 * telle qu'à la correction (numéro et titre), et le candidat quand c'est sa fiche qui est corrigée.
 */
export type Correction = {
  date: string;
  type: "chiffre" | "position" | "formulation" | "source";
  theme: string;
  question: { numero: number; titre: string };
  candidat?: string;
  /** Ce qui a changé : une valeur et une précision facultative ; entre ==…==, la partie surlignée. */
  avant: CoteDeLaCorrection;
  apres: CoteDeLaCorrection;
  /** Pourquoi la correction a été faite, en une phrase. */
  pourquoi: string;
  /** Qui l'a repérée : un signalement d'utilisateur, ou le contrôle de neutralité. Jamais rien de la personne. */
  origine: "utilisateur" | "controle";
};
export type CoteDeLaCorrection = { valeur: string; precision?: string };

/**
 * Les corrections de content/corrections.yaml. Pour les tests de bout en bout seulement, un jeu de corrections de test
 * (e2e/fiches/corrections/<nom>.yaml) les remplace.
 */
export function lireCorrections(jeuDeTest?: string): Correction[] {
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  const fichier =
    test && jeuDeTest && /^[a-z-]+$/.test(jeuDeTest)
      ? path.join(process.cwd(), test, "corrections", `${jeuDeTest}.yaml`)
      : path.join(RACINE, "corrections.yaml");
  return (parse(readFileSync(fichier, "utf8")) as Correction[]).map((c) => ({ ...c, date: String(c.date) }));
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
 * Un test peut aussi choisir un jeu de fiches à lui (un sous-dossier du dossier de test), qui remplace tout le reste,
 * et des surcharges (e2e/fiches/surcharges/<nom>/), des fiches partielles dont les positions s'ajoutent à celles de
 * la fiche du même numéro.
 */
export function lireQuestions(jeuDeTest?: string, surchargesDeTest?: string): Question[] {
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  const valide = (nom?: string): nom is string => !!test && !!nom && /^[a-z-]+$/.test(nom);
  const dossiers = valide(jeuDeTest)
    ? [path.join(process.cwd(), test!, jeuDeTest)]
    : [path.join(RACINE, "questions"), ...(test ? [path.join(process.cwd(), test)] : [])];
  const surcharges = valide(surchargesDeTest) ? lireDossier(path.join(process.cwd(), test!, "surcharges", surchargesDeTest)) : [];
  return dossiers
    .flatMap(lireDossier)
    .map((q) => {
      const surcharge = surcharges.find((s) => s.numero === q.numero);
      return surcharge ? { ...q, positions: { ...q.positions, ...surcharge.positions } } : q;
    })
    .map((q) => ({ ...q, date: String(q.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Les fiches d'un dossier. */
function lireDossier(dossier: string): Question[] {
  return readdirSync(dossier)
    .filter((fichier) => fichier.endsWith(".yaml"))
    .flatMap((fichier) => lireFiche(path.join(dossier, fichier)));
}
