import type { Candidat } from "@/lib/contenu";
import { aujourdhuiAParis, dateCourte } from "@/lib/date";
import { classement, reponsesComptees, type Proximite, type QuestionDuCalcul } from "@/lib/proximite";
import { JE_NE_SAIS_PAS, type Reponse } from "@/lib/reponses";
import type { ReponseLue } from "@/lib/reponses-partagees";

/**
 * L'analyse des réponses partagées, pour l'espace de l'auteur : chaque session (un onglet, jamais une personne) refait le
 * calcul publié (lib/proximite.ts) sur ses propres réponses, puis les sessions s'additionnent. Rien ici ne relie deux
 * sessions entre elles : il n'y a rien pour le faire.
 */

/**
 * Une session, résumée : ses réponses, celles qui comptent (« Je ne sais pas » non compris), ses jours, l'heure de sa
 * première et de sa dernière réponse (aucune pour les réponses d'avant le 12/11/2026) et son classement.
 */
export type SessionAnalysee = {
  session: string;
  reponses: ReponseLue[];
  comptees: number;
  premierJour: string;
  dernierJour: string;
  debut: Date | null;
  fin: Date | null;
  classement: Proximite[];
};

/** Pour un candidat, sur les sessions retenues : sa proximité moyenne, et la part des sessions où il arrive en tête. */
export type CandidatAnalyse = { candidat: Candidat; moyenne: number | null; enTete: number; sessions: number };

/** Les réponses d'une session, au format du calcul. */
function enReponses(reponses: ReponseLue[]): Record<number, Reponse> {
  return Object.fromEntries(reponses.map((r) => [r.question, { option: r.option, importance: r.importance, graine: 0, jour: r.jour }]));
}

/** Regroupe les réponses (rangées par session) en sessions, chacune avec son classement ; les plus récentes d'abord. */
export function analyserLesSessions(reponses: ReponseLue[], questions: QuestionDuCalcul[], candidats: Candidat[]): SessionAnalysee[] {
  const parSession = new Map<string, ReponseLue[]>();
  for (const r of reponses) {
    const liste = parSession.get(r.session);
    if (liste) liste.push(r);
    else parSession.set(r.session, [r]);
  }
  return [...parSession]
    .map(([session, liste]) => {
      const calcul = enReponses(liste);
      const jours = liste.map((r) => r.jour).sort();
      const heures = liste.flatMap((r) => (r.recueLe ? [r.recueLe] : [])).sort((a, b) => a.getTime() - b.getTime());
      return {
        session,
        reponses: liste,
        comptees: reponsesComptees(questions, calcul),
        premierJour: jours[0],
        dernierJour: jours.at(-1)!,
        debut: heures[0] ?? null,
        fin: heures.at(-1) ?? null,
        classement: classement(questions, calcul, candidats),
      };
    })
    .sort((a, b) => b.dernierJour.localeCompare(a.dernierJour) || (b.fin?.getTime() ?? 0) - (a.fin?.getTime() ?? 0) || b.comptees - a.comptees);
}

/**
 * Les candidats sur les sessions retenues : la moyenne de leurs proximités (sur les sessions où ils en ont une), et la
 * part des sessions où ils arrivent en tête (à égalité en tête, chacun des ex æquo compte). Du plus proche au moins proche.
 */
export function analyserLesCandidats(sessions: SessionAnalysee[], candidats: Candidat[]): CandidatAnalyse[] {
  const totaux = new Map(candidats.map((c) => [c.id, { somme: 0, sessions: 0, enTete: 0 }]));
  let classees = 0;
  for (const { classement: rangs } of sessions) {
    const meilleur = rangs[0]?.pourcentage;
    if (meilleur == null) continue;
    classees++;
    for (const { candidat, pourcentage } of rangs) {
      if (pourcentage == null) continue;
      const total = totaux.get(candidat.id)!;
      total.somme += pourcentage;
      total.sessions++;
      if (pourcentage === meilleur) total.enTete++;
    }
  }
  return candidats
    .map((candidat) => {
      const { somme, sessions, enTete } = totaux.get(candidat.id)!;
      return { candidat, moyenne: sessions ? somme / sessions : null, enTete: classees ? (100 * enTete) / classees : 0, sessions };
    })
    .sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1) || a.candidat.nom.localeCompare(b.candidat.nom, "fr"));
}

/** Les sessions et les réponses de chaque jour : une session compte le jour de sa première réponse. */
export function sessionsParJour(sessions: SessionAnalysee[]): Map<string, { sessions: number; reponses: number }> {
  const parJour = new Map<string, { sessions: number; reponses: number }>();
  const du = (jour: string) => parJour.get(jour) ?? parJour.set(jour, { sessions: 0, reponses: 0 }).get(jour)!;
  for (const s of sessions) {
    du(s.premierJour).sessions++;
    for (const r of s.reponses) du(r.jour).reponses++;
  }
  return parJour;
}

/** La part des réponses « Je ne sais pas », sur toutes les réponses. */
export const partDesJeNeSaisPas = (sessions: SessionAnalysee[]) => {
  const toutes = sessions.flatMap((s) => s.reponses);
  return toutes.length ? (100 * toutes.filter((r) => r.option === JE_NE_SAIS_PAS).length) / toutes.length : 0;
};

const LE_JOUR_ET_L_HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });
const L_HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", timeStyle: "short" });

/**
 * Quand a eu lieu la session : « 12 nov. 2026, 14:32 », l'heure de sa première réponse ; seulement le jour pour les
 * réponses d'avant le 12/11/2026, qui n'ont pas d'heure. Avec `jusqua`, l'heure de la dernière : « … 14:32 → 15:10 ».
 */
export function quand(session: SessionAnalysee, jusqua = false): string {
  if (!session.debut || !session.fin) {
    const { premierJour: de, dernierJour: a } = session;
    return de === a || !jusqua ? dateCourte(de) : `${dateCourte(de)} → ${dateCourte(a)}`;
  }
  const debut = LE_JOUR_ET_L_HEURE.format(session.debut);
  if (!jusqua || session.fin.getTime() === session.debut.getTime()) return debut;
  const memeJour = aujourdhuiAParis(session.debut) === aujourdhuiAParis(session.fin);
  return `${debut} → ${memeJour ? L_HEURE.format(session.fin) : LE_JOUR_ET_L_HEURE.format(session.fin)}`;
}

/** Les huit premiers caractères d'une session : assez pour la reconnaître d'un coup d'œil. */
export const sessionCourte = (session: string) => session.slice(0, 8);
