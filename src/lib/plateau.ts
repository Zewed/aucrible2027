import type { QuestionDuCalcul } from "@/lib/proximite";
import { JE_NE_SAIS_PAS, type Reponse } from "@/lib/reponses";

/** Une place sur le plateau : de −2 à +2 sur chaque axe (−2 : plus de redistribution, progressiste). */
export type Place = { economie: number; societe: number };

type Axe = keyof Place;
/** Une note comptée sur un axe : son thème, sa valeur et son poids. */
type Note = { theme: string; note: number; poids: number };

/** La moyenne pondérée d'une liste de notes, ou 0 sans aucune note. */
function moyenne(notes: { note: number; poids: number }[]) {
  const poids = notes.reduce((somme, n) => somme + n.poids, 0);
  return poids > 0 ? notes.reduce((somme, n) => somme + n.poids * n.note, 0) / poids : 0;
}

/**
 * La place sur un axe : la moyenne de chaque thème, puis la moyenne des thèmes. Chaque thème pèse autant, quel que soit
 * son nombre de fiches ; sans cela, les thèmes les plus fournis décideraient seuls de l'axe.
 */
function moyenneDesThemes(notes: Note[]) {
  const themes = [...new Set(notes.map((n) => n.theme))];
  return moyenne(themes.map((theme) => ({ note: moyenne(notes.filter((n) => n.theme === theme)), poids: 1 })));
}

/**
 * La place de l'électeur (SPEC.md, « Méthode de calcul », Carte) : sur chaque axe, la note des options qu'il a choisies,
 * pondérée par l'importance donnée (×1 sans importance), chaque thème pesant autant. « Je ne sais pas » et une option
 * sans note sur cet axe n'y entrent pas. Sans aucune note, il reste au centre de cet axe.
 */
export function placeDeLElecteur(questions: QuestionDuCalcul[], reponses: Record<number, Reponse>): Place {
  const notes: Record<Axe, Note[]> = { economie: [], societe: [] };
  for (const question of questions) {
    const reponse = reponses[question.numero];
    if (!reponse || reponse.option === JE_NE_SAIS_PAS) continue;
    const axes = question.options.find((o) => o.id === reponse.option)?.axes;
    for (const axe of ["economie", "societe"] as const) {
      const note = axes?.[axe];
      if (note !== undefined) notes[axe].push({ theme: question.theme, note, poids: reponse.importance ?? 1 });
    }
  }
  return { economie: moyenneDesThemes(notes.economie), societe: moyenneDesThemes(notes.societe) };
}

/**
 * La place d'un candidat, par la même formule, sur toutes les questions publiées où sa position est connue, chacune ×1
 * (un candidat ne donne pas d'importance). Sans aucune note, il reste au centre de cet axe.
 */
export function placeDuCandidat(questions: QuestionDuCalcul[], candidat: string): Place {
  const notes: Record<Axe, Note[]> = { economie: [], societe: [] };
  for (const question of questions) {
    const option = question.positions[candidat]?.option;
    const axes = option ? question.options.find((o) => o.id === option)?.axes : undefined;
    for (const axe of ["economie", "societe"] as const) {
      const note = axes?.[axe];
      if (note !== undefined) notes[axe].push({ theme: question.theme, note, poids: 1 });
    }
  }
  return { economie: moyenneDesThemes(notes.economie), societe: moyenneDesThemes(notes.societe) };
}

/** Le cadre du plateau, sur chaque axe : son milieu et sa demi-largeur, dans l'échelle des notes. */
export type Cadre = Record<Axe, { milieu: number; demi: number }>;
const SANS_CADRE: Cadre = { economie: { milieu: 0, demi: 2 }, societe: { milieu: 0, demi: 2 } };

/**
 * Le plateau se cadre sur les candidats : sur chaque axe, il va du premier au dernier, et son centre est le milieu entre
 * les deux. Le même cadre vaut pour tous les pions et pour l'électeur : les écarts s'agrandissent, l'ordre ne change pas.
 */
export function cadreDuPlateau(questions: QuestionDuCalcul[], candidats: { id: string }[]): Cadre {
  const places = candidats.filter((c) => aUneNote(questions, c.id)).map((c) => placeDuCandidat(questions, c.id));
  const cadrer = (axe: Axe) => {
    const valeurs = places.map((p) => p[axe]);
    const [bas, haut] = [Math.min(...valeurs), Math.max(...valeurs)];
    return haut > bas ? { milieu: (bas + haut) / 2, demi: (haut - bas) / 2 } : SANS_CADRE[axe];
  };
  return { economie: cadrer("economie"), societe: cadrer("societe") };
}

/** La part du champ que les candidats occupent de part et d'autre du centre, en % : le reste garde les pions lisibles. */
const ETENDUE = 44;

/** Où poser une place sur le champ du plateau, en % : redistribution à gauche, progressiste en haut. */
export function surLeChamp(place: Place, cadre: Cadre = SANS_CADRE) {
  const poser = (axe: Axe) => Math.min(97, Math.max(3, 50 + ((place[axe] - cadre[axe].milieu) / cadre[axe].demi) * ETENDUE));
  return { x: poser("economie"), y: poser("societe") };
}

/** Un candidat a-t-il au moins une note sur l'un des axes ? Sans aucune, il n'a pas de place à lui (pas de pion). */
export function aUneNote(questions: QuestionDuCalcul[], candidat: string): boolean {
  return questions.some((question) => {
    const option = question.positions[candidat]?.option;
    const axes = option ? question.options.find((o) => o.id === option)?.axes : undefined;
    return axes?.economie !== undefined || axes?.societe !== undefined;
  });
}

type Point = { x: number; y: number };
/** Une place qui ne bouge pas (« TOI », son étiquette) et l'écart à garder autour d'elle. */
type Fixe = Point & { ecart: number };

/**
 * Écarte, en % du champ, les pions trop proches pour qu'on lise chacun : deux pions de candidats d'au moins `ecart`, et
 * chaque pion d'au moins l'écart de chaque place fixe (« TOI » et son étiquette, qui ne bougent pas). Les pions ne
 * bougent que de ce qu'il faut et restent sur le champ ; deux pions à la même place partent dans des directions fixes,
 * pour que l'écart soit le même à chaque affichage. Ils gardent `marge` le long des bords, où sont écrits les axes.
 */
export function ecarter(pions: Point[], fixes: Fixe[], ecart: number, marge = 3): Point[] {
  const garder = (p: Point) => {
    p.x = Math.min(100 - marge, Math.max(marge, p.x));
    p.y = Math.min(100 - marge, Math.max(marge, p.y));
  };
  const places = pions.map((p) => ({ ...p }));
  places.forEach(garder);
  for (let tour = 0; tour < 80; tour++) {
    let bouge = false;
    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        const [a, b] = [places[i], places[j]];
        let [dx, dy] = [b.x - a.x, b.y - a.y];
        let d = Math.hypot(dx, dy);
        if (d >= ecart) continue;
        if (d < 1e-6) [dx, dy, d] = [Math.cos(i * 2.4 + j), Math.sin(i * 2.4 + j), 1];
        const pousse = (ecart - Math.hypot(b.x - a.x, b.y - a.y)) / 2 + 0.01;
        a.x -= (dx / d) * pousse;
        a.y -= (dy / d) * pousse;
        b.x += (dx / d) * pousse;
        b.y += (dy / d) * pousse;
        garder(a);
        garder(b);
        bouge = true;
      }
      for (const fixe of fixes) {
        const p = places[i];
        let [dx, dy] = [p.x - fixe.x, p.y - fixe.y];
        let d = Math.hypot(dx, dy);
        if (d >= fixe.ecart) continue;
        if (d < 1e-6) [dx, dy, d] = [Math.cos(i * 2.4), Math.sin(i * 2.4), 1];
        const pousse = fixe.ecart - Math.hypot(p.x - fixe.x, p.y - fixe.y) + 0.01;
        p.x += (dx / d) * pousse;
        p.y += (dy / d) * pousse;
        garder(p);
        bouge = true;
      }
    }
    if (!bouge) break;
  }
  return places;
}
