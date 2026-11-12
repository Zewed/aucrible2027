import { NextResponse } from "next/server";
import { lireAujourdhui } from "@/lib/publication";
import { compterUneVisite, genreDAppareil } from "@/lib/visites";

/**
 * Une visite : l'appareil qui ouvre l'app pour la première fois de la journée le dit ici, sans rien d'autre. Le jour est
 * celui du serveur, à Paris ; la réponse le rend à l'appareil, qui ne revient pas avant le lendemain. Seul le site en
 * production compte : les déploiements de prévisualisation, qui partagent sa base, n'y ajoutent rien.
 */
export async function POST(requete: Request) {
  const jour = await lireAujourdhui();
  if (process.env.VERCEL_ENV !== "preview") await compterUneVisite(jour, genreDAppareil(requete.headers.get("user-agent")));
  return NextResponse.json({ jour }, { headers: { "Cache-Control": "no-store" } });
}
