import { NextResponse } from "next/server";
import { lireAujourdhui } from "@/lib/publication";
import { compterUneVisite } from "@/lib/visites";

/**
 * Une visite : l'appareil qui ouvre l'app pour la première fois de la journée le dit ici, sans rien d'autre. Le jour est
 * celui du serveur, à Paris ; la réponse le rend à l'appareil, qui ne revient pas avant le lendemain.
 */
export async function POST() {
  const jour = await lireAujourdhui();
  await compterUneVisite(jour);
  return NextResponse.json({ jour }, { headers: { "Cache-Control": "no-store" } });
}
