import { estLAuteur } from "@/lib/auteur";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import { JE_NE_SAIS_PAS } from "@/lib/reponses";
import { enregistrerUneReponsePartagee, UNE_SESSION } from "@/lib/reponses-partagees";

/**
 * Une réponse partagée (lib/reponses-partagees.ts) : la fiche l'envoie ici dès qu'elle est validée. Elle ne vaut que pour
 * une question publiée, une de ses options avec une importance de 1 à 3, ou « Je ne sais pas » (gardé sans importance) ;
 * le reste est refusé sans rien garder. Le jour est celui du serveur, à Paris. Celle de l'auteur, connecté à /admin, est
 * acceptée sans être gardée : ses essais ne comptent pas.
 */
export async function POST(requete: Request) {
  const { session, question, option, importance } = await requete.json().catch(() => ({}));
  const fiche = (await lireQuestionsPubliees()).find((q) => q.numero === question);
  const nsp = option === JE_NE_SAIS_PAS;
  const optionConnue = nsp || fiche?.options.some((o) => o.id === option);
  if (typeof session !== "string" || !UNE_SESSION.test(session) || !fiche || !optionConnue || !(nsp || [1, 2, 3].includes(importance))) {
    return new Response(null, { status: 400 });
  }
  if (!(await estLAuteur().catch(() => false))) {
    await enregistrerUneReponsePartagee({ session, question, option, importance: nsp ? null : importance, jour: await lireAujourdhui() });
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
