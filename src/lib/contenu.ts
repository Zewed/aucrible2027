import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

/** Où en est la candidature : son état (« Candidature déclarée ») et ce qui suit, en une phrase. */
export type StatutDeCandidature = { etat: string; suite?: string };
/**
 * Le retrait d'un candidat : son jour (AAAA-MM-JJ), le candidat qu'il soutient s'il en nomme un, et l'accord de
 * « retiré », que l'auteur du contenu écrit ; sans accord, la fiche écrit « retiré·e », comme SPEC.md.
 */
export type Retrait = { date: string; soutien?: string; accord?: "feminin" | "masculin" };
/** Le crédit d'une photo de Wikimedia Commons : son auteur, sa licence, et sa page sur Commons. */
export type Photo = { auteur: string; licence: string; page: string };
export type Candidat = {
  id: string;
  nom: string;
  parti: string;
  initiales: string;
  /** Sa photo, public/candidats/<id>.jpg : une vignette de Wikimedia Commons, créditée sur la page Méthode. */
  photo?: Photo;
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
  /** Tout ce qu'on sait d'elle, dans la fenêtre du « + » de sa carte ; sans lui, la fenêtre reprend la carte. Autant d'arguments pour et contre, d'une option à l'autre. */
  detail?: { chiffrage: { texte: string; source: Source }; defenseurs: Argument[]; critiques: Argument[] };
  /** L'option ne se range pas sur l'échelle des autres : elle compte tout ou rien dans le classement. */
  horsEchelle?: boolean;
  /**
   * Ses notes sur les deux axes, de −2 à +2, sur l'un, les deux ou aucun. Elles plaçaient l'électeur sur le plateau, retiré
   * du site le 9 novembre 2026 : gardées dans les fiches, plus affichées nulle part.
   */
  axes?: Axes;
};

/** Les deux axes de l'ancien plateau : −2 pour plus de redistribution, ou progressiste ; +2 pour plus de marché, ou conservateur. */
export type Axes = { economie?: number; societe?: number };
export type Source = { organisme: string; document?: string; annee: number };
/** Ce que dit un camp. Seul un chiffre a une source : aucun organisme ne reprend l'argument à son compte. */
export type Argument = { texte: string; source?: Source };
export type Chiffre = { valeur: string; unite?: string; legende: string; source: Source };
export type Theme = { id: string; nom: string; classe: string };
/**
 * Ce qu'un candidat défend sur une fiche, et d'où on le sait : la source, et, quand l'étude les a relevés, la phrase
 * exacte qui fonde la position (`citation`, mot pour mot, sans guillemets) et l'adresse où la lire (`lien`).
 */
export type Position = { option: string; source: string; statut: "officielle" | "deduite" | "estimee"; citation?: string; lien?: string };
export type Lien = { titre: string; url: string };
/** Un côté du débat, pour l'image 5 du carrousel : son titre (« Pour relever l'âge ») et l'argument que ses défenseurs signeraient. */
export type Cote = { titre: string; argument: string };
/** Un choix de l'autocollant « Et toi ? » de la story : « 62 ans », et en plus petit « ou moins ». */
export type ChoixDeStory = { choix: string; precision?: string };
/** Quelques dates et leur valeur, en très grand, puis la phrase qui conclut. */
export type DatesEnGrand = { etapes: { quand: string; valeur: string; projection?: boolean }[]; chute: string };
/**
 * La réponse d'un camp à une question du reportage : ce qu'il affirme, en clair, puis la preuve, un chiffre en très
 * grand et la phrase qui le complète.
 */
export type Reponse = { affirmation: string; chiffre: string; texte: string; source: string };
/**
 * Le reportage vidéo de la fiche : un récit court, tiré de l'étude de la question (docs/etudes). Une accroche ;
 * le mécanisme en une image ; les leviers possibles, dont celui de la question ; quelques questions, chacune avec la
 * réponse des deux camps ; puis le retour aux leviers. Facultatif : sans lui, le reportage s'en tient à la question.
 */
export type Reportage = {
  /** Où en est-on, en deux ou trois dates (« Aujourd'hui : 62 ans et 9 mois »), puis la chute. */
  accroche?: DatesEnGrand;
  /** Le mécanisme : une phrase, et combien de « ceux qui paient » pour un « qui reçoit », à deux dates. */
  mecanisme?: { titre: string; texte: string; points: { annee: number; valeur: number; projection?: boolean }[]; chute: string; source: string };
  /** La taille du problème, en deux dates, et ce qui la rend discutée. */
  ecart?: DatesEnGrand & { titre: string; source: string };
  /** Les leviers possibles, présentés à égalité. */
  leviers?: { titre: string; choix: { texte: string; detail?: string }[]; chute: string; source: string };
  /** Le nom des deux camps (« POUR », « CONTRE ») et ce sur quoi ils s'opposent (« le relèvement de l'âge »). */
  camps?: { pour: string; contre: string; objet?: string };
  questions?: { question: string; pour: Reponse; contre: Reponse }[];
};
/**
 * La vidéo explicative de la fiche, montrée à la première étape quand elle existe. Pour une vidéo constat, `ecrans` donne
 * le début de chaque écran, en secondes, la question comprise (le script ecrans.mts du skill make-2027-videos) : la vidéo
 * se lit alors comme une story, d'écran en écran. `images` est le dossier de la dernière image de chaque écran (01.webp,
 * 02.webp…, le script images.mts du même skill) : on peut alors faire défiler ces images au lieu de la vidéo.
 */
export type VideoExplicative = { url: string; duree: string; ecrans?: number[]; images?: string };
export type Question = {
  numero: number;
  date: string;
  theme: string;
  question: string;
  contexte: string[];
  chiffres: Chiffre[];
  options: Option[];
  positions: Record<string, Position>;
  reportage?: Reportage;
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

/** Ce que l'écran d'une fiche lit d'une question : sans le reportage ni les positions, qu'il n'affiche pas. */
export type QuestionDeLaFiche = Pick<Question, "numero" | "theme" | "question" | "contexte" | "chiffres" | "options" | "video" | "titreCourt">;

const RACINE = path.join(process.cwd(), "content");

/** Les fichiers YAML déjà lus, avec l'heure de leur dernière modification. */
const dejaLus = new Map<string, { modifie: number; contenu: unknown }>();

/**
 * Un fichier YAML, lu une seule fois tant qu'il ne change pas : chaque page en relirait sinon des centaines de Ko.
 * Le résultat sert à toutes les requêtes ; on le copie avant de le changer, jamais en place.
 */
function lireYaml<T>(fichier: string): T {
  const modifie = statSync(fichier).mtimeMs;
  const lu = dejaLus.get(fichier);
  if (lu?.modifie === modifie) return lu.contenu as T;
  const contenu = parse(readFileSync(fichier, "utf8"));
  dejaLus.set(fichier, { modifie, contenu });
  return contenu;
}

/**
 * Les candidats de content/candidats.yaml. Pour les tests de bout en bout seulement, des ajouts de test
 * (e2e/fiches/candidats/<nom>.yaml) les complètent candidat par candidat, par exemple d'un retrait ; un ajout qui
 * « remplace » un candidat prend sa place et garde son parti, et un ajout d'un autre identifiant entre dans la liste,
 * comme un candidat qui se déclare.
 */
export function lireCandidats(ajoutsDeTest?: string): Candidat[] {
  const candidats = lireYaml<Candidat[]>(path.join(RACINE, "candidats.yaml"));
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  if (!test || !ajoutsDeTest || !/^[a-z-]+$/.test(ajoutsDeTest)) return candidats;
  const ajouts = lireYaml<Partial<Candidat>[]>(path.join(/* turbopackIgnore: true */ process.cwd(), test, "candidats", `${ajoutsDeTest}.yaml`));
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
      ? path.join(/* turbopackIgnore: true */ process.cwd(), test, "listes", `${jeuDeTest}.yaml`)
      : path.join(RACINE, "liste-officielle.yaml");
  if (!existsSync(fichier)) return null;
  const liste = lireYaml<ListeOfficielle>(fichier);
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
      ? path.join(/* turbopackIgnore: true */ process.cwd(), test, "corrections", `${jeuDeTest}.yaml`)
      : path.join(RACINE, "corrections.yaml");
  return lireYaml<Correction[]>(fichier).map((c) => ({ ...c, date: String(c.date) }));
}

export function lireThemes(): Theme[] {
  return lireYaml(path.join(RACINE, "themes.yaml"));
}

/** Repère provisoire : les numéros des questions dont Antoine a verrouillé la vidéo (content/videos-verrouillees.yaml). */
export function lireVideosVerrouillees(): number[] {
  return lireYaml<number[]>(path.join(RACINE, "videos-verrouillees.yaml"));
}

/** La musique du reportage d'un thème : un morceau Pixabay, son tempo et la seconde de son premier temps fort. */
export type Musique = { titre: string; auteur: string; page: string; mp3: string; tempo: number; premierTemps: number };

/** La musique de chaque thème, par identifiant de thème (content/musiques.yaml). */
export function lireMusiques(): Record<string, Musique> {
  return lireYaml(path.join(RACINE, "musiques.yaml"));
}

/** Une fiche, ou rien si elle a été retirée entre la lecture du dossier et la sienne. */
function lireFiche(chemin: string): Question[] {
  try {
    return [lireYaml<Question>(chemin)];
  } catch (erreur) {
    if ((erreur as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw erreur;
  }
}

/**
 * Les fiches de content/questions, plus, pour les tests de bout en bout seulement, celles du dossier de test. En test,
 * les fiches de content/questions sont remplacées par leur copie figée (<dossier de test>/contenu/) : le contenu réel
 * peut grandir sans changer ce que les tests attendent.
 * Un test peut aussi choisir un jeu de fiches à lui (un sous-dossier du dossier de test), qui remplace tout le reste,
 * et des surcharges (e2e/fiches/surcharges/<nom>/), des fiches partielles dont les positions s'ajoutent à celles de
 * la fiche du même numéro.
 */
export function lireQuestions(jeuDeTest?: string, surchargesDeTest?: string): Question[] {
  const test = process.env.AUCRIBLE_FICHES_DE_TEST;
  const valide = (nom?: string): nom is string => !!test && !!nom && /^[a-z-]+$/.test(nom);
  const dossiers = valide(jeuDeTest)
    ? [path.join(/* turbopackIgnore: true */ process.cwd(), test!, jeuDeTest)]
    : test
      ? [path.join(/* turbopackIgnore: true */ process.cwd(), test, "contenu"), path.join(/* turbopackIgnore: true */ process.cwd(), test)]
      : [path.join(RACINE, "questions")];
  const surcharges = valide(surchargesDeTest) ? lireDossier(path.join(/* turbopackIgnore: true */ process.cwd(), test!, "surcharges", surchargesDeTest)) : [];
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
