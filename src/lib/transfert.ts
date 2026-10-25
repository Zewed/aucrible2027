import { tirerGraine } from "@/lib/melange";
import type { Reponse } from "@/lib/reponses";

/**
 * Les réponses d'un appareil, écrites pour voyager vers un autre (SPEC.md, « Données » ; décision du 25 octobre 2026) :
 * après le `#` d'une adresse du site, que le navigateur n'envoie jamais au serveur. Une version, puis une réponse par
 * entrée, dans l'ordre où elles ont été données : « numéro.option.importance.AAAAMMJJ » (importance 0 : aucune).
 */
const VERSION = "1";

export function encoderLesReponses(reponses: Record<number, Reponse>): string {
  const dans = Object.entries(reponses).sort(([na, a], [nb, b]) => (a.rang ?? 0) - (b.rang ?? 0) || Number(na) - Number(nb));
  return [VERSION, ...dans.map(([numero, r]) => `${numero}.${r.option}.${r.importance ?? 0}.${r.jour.replaceAll("-", "")}`)].join(",");
}

/** Les réponses lues dans un fragment, ou null s'il n'en contient pas de lisibles. Une nouvelle graine pour chacune. */
export function decoderLesReponses(fragment: string): Record<number, Reponse> | null {
  const [version, ...entrees] = fragment.replace(/^#/, "").split(",");
  if (version !== VERSION || entrees.length === 0) return null;
  const reponses: Record<number, Reponse> = {};
  for (const [rang, entree] of entrees.entries()) {
    const morceaux = /^(\d+)\.([A-E]|nsp)\.([0-3])\.(\d{4})(\d{2})(\d{2})$/.exec(entree);
    if (!morceaux) return null;
    const [, numero, option, importance, a, m, j] = morceaux;
    reponses[Number(numero)] = { option, importance: Number(importance) || null, graine: tirerGraine(), jour: `${a}-${m}-${j}`, rang: rang + 1 };
  }
  return reponses;
}
