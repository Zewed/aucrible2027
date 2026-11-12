import { estLAuteur } from "@/lib/auteur";
import { base } from "@/lib/base";

/**
 * Les statistiques de visite (SPEC.md, « Données » : anonymes, sans les réponses) : pour chaque jour, à Paris, le nombre
 * d'appareils qui ont ouvert l'app, et leur genre (téléphone, tablette, ordinateur). Un appareil compte une fois par
 * jour ; il le sait lui-même (components/Visite.tsx), et le serveur ne garde ni cookie, ni identifiant, ni réponse :
 * seulement « une visite » et son genre, lu dans l'en-tête User-Agent puis oublié. Les robots, et les navigateurs que
 * pilote un programme, sont comptés à part, hors des visites.
 */
export type Appareil = "telephone" | "tablette" | "ordinateur" | "robot";

/** Les robots d'indexation, d'aperçu de lien et de mesure, et les navigateurs sans écran que pilote un programme. */
const ROBOT = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|vercel|curl|wget|python|node-fetch|axios|go-http|java\/|okhttp|playwright|puppeteer|selenium|phantom/i;

/** Le genre d'appareil d'après son User-Agent ; sans User-Agent, un robot. */
export function genreDAppareil(agent: string | null): Appareil {
  if (!agent || ROBOT.test(agent)) return "robot";
  if (/iPad|Tablet|Kindle|Silk|PlayBook/i.test(agent) || (/Android/i.test(agent) && !/Mobile/i.test(agent))) return "tablette";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(agent)) return "telephone";
  return "ordinateur";
}

export async function compterUneVisite(jour: string, appareil: Appareil) {
  const sql = await base();
  if (appareil === "robot") {
    await sql`INSERT INTO visites (jour, nombre, robot) VALUES (${jour}, 0, 1) ON CONFLICT (jour) DO UPDATE SET robot = visites.robot + 1`;
    return;
  }
  const colonne = sql(appareil);
  await sql`
    INSERT INTO visites (jour, nombre, ${colonne}) VALUES (${jour}, 1, 1)
    ON CONFLICT (jour) DO UPDATE SET nombre = visites.nombre + 1, ${colonne} = visites.${colonne} + 1`;
}

export type VisitesDuJour = { jour: string; nombre: number; telephone: number; tablette: number; ordinateur: number; robot: number };

/** Les visites des 60 derniers jours qui en ont, les plus récents d'abord. Réservé à l'auteur, comme sa boîte. */
export async function lireLesVisites(): Promise<VisitesDuJour[]> {
  if (!(await estLAuteur())) throw new Error("Les statistiques de visite sont réservées à l'auteur.");
  const sql = await base();
  return sql<VisitesDuJour[]>`
    SELECT to_char(jour, 'YYYY-MM-DD') AS jour, nombre, telephone, tablette, ordinateur, robot
    FROM visites ORDER BY jour DESC LIMIT 60`;
}
