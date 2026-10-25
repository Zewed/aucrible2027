import { melanger, tirerGraine } from "@/lib/melange";

/**
 * L'ordre des questions de cet appareil (SPEC.md, « Boucle principale ») : tiré au hasard la première fois, puis
 * gardé dans le stockage local du navigateur. Une question qui arrive ensuite est tirée à son tour, à la suite.
 */
const CLE = "aucrible:ordre";

/**
 * L'ordre gardé, complété des questions qu'il ne connaît pas encore (une chaîne stable entre deux lectures). Sans
 * stockage utilisable, l'ordre des numéros, pour que la page s'affiche quand même.
 */
export function lireOrdre(numeros: number[]): string {
  try {
    const garde: number[] = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    const nouveaux = numeros.filter((n) => !garde.includes(n));
    if (nouveaux.length > 0) localStorage.setItem(CLE, JSON.stringify([...garde, ...melanger(nouveaux, tirerGraine())]));
    return localStorage.getItem(CLE) ?? JSON.stringify(numeros);
  } catch {
    return JSON.stringify(numeros);
  }
}

/** La prochaine question sans réponse, dans l'ordre de l'appareil, ou undefined s'il n'en reste aucune. */
export function prochaineQuestion(ordre: string, numeros: number[], repondues: number[]): number | undefined {
  return (JSON.parse(ordre) as number[]).find((n) => numeros.includes(n) && !repondues.includes(n));
}
