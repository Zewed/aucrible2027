import { lAuteur } from "@/lib/auteur";
import { base } from "@/lib/base";

/**
 * Les statistiques de visite (SPEC.md, « Données » : anonymes, sans les réponses) : pour chaque jour, à Paris, le nombre
 * d'appareils qui ont ouvert l'app. Un appareil compte une fois par jour ; il le sait lui-même (components/Visite.tsx),
 * et le serveur ne reçoit ni cookie, ni identifiant, ni réponse : seulement « une visite ».
 */
export async function compterUneVisite(jour: string) {
  const sql = await base();
  await sql`INSERT INTO visites (jour, nombre) VALUES (${jour}, 1) ON CONFLICT (jour) DO UPDATE SET nombre = visites.nombre + 1`;
}

export type VisitesDuJour = { jour: string; nombre: number };

/** Les visites des 60 derniers jours qui en ont, les plus récents d'abord. Réservé à l'auteur, comme sa boîte. */
export async function lireLesVisites(): Promise<VisitesDuJour[]> {
  const auteur = await lAuteur();
  if (!auteur || auteur === "refuse") throw new Error("Les statistiques de visite sont réservées à l'auteur.");
  const sql = await base();
  return sql<VisitesDuJour[]>`SELECT to_char(jour, 'YYYY-MM-DD') AS jour, nombre FROM visites ORDER BY jour DESC LIMIT 60`;
}
