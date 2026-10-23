/** Une graine tirée au hasard, à garder avec la réponse pour que son ordre ne bouge plus. */
export const tirerGraine = () => Math.floor(Math.random() * 2 ** 32);

/** Un tirage pseudo-aléatoire reproductible (mulberry32) : la même graine donne la même suite. */
function tirage(graine: number) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange une copie de la liste (Fisher-Yates), dans un ordre fixé par la graine. */
export function melanger<T>(liste: T[], graine: number): T[] {
  const hasard = tirage(graine);
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}
