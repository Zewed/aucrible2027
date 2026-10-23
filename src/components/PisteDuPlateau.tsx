/** Les cases de la piste autour du plateau, reprises telles quelles de maquettes/resultats.html : x, y, largeur, hauteur, arrondi, couleur. */
const CASES: [number, number, number, number, number, string][] = [
  [0, 0, 7, 7, 0, "var(--chalk)"],
  [7.35, 0.35, 8.86, 6.3, 0.8, "var(--eco)"],
  [16.91, 0.35, 8.86, 6.3, 0.8, "var(--trav)"],
  [26.46, 0.35, 8.86, 6.3, 0.8, "var(--ecol)"],
  [36.02, 0.35, 8.86, 6.3, 0.8, "var(--immi)"],
  [45.57, 0.35, 8.86, 6.3, 0.8, "var(--secu)"],
  [55.13, 0.35, 8.86, 6.3, 0.8, "var(--sante)"],
  [64.68, 0.35, 8.86, 6.3, 0.8, "var(--educ)"],
  [74.24, 0.35, 8.86, 6.3, 0.8, "var(--loge)"],
  [83.79, 0.35, 8.86, 6.3, 0.8, "var(--euro)"],
  [93, 0, 7, 7, 0, "var(--chalk)"],
  [93.35, 7.35, 6.3, 8.86, 0.8, "var(--inst)"],
  [93.35, 16.91, 6.3, 8.86, 0.8, "var(--soc)"],
  [93.35, 26.46, 6.3, 8.86, 0.8, "var(--eco)"],
  [93.35, 36.02, 6.3, 8.86, 0.8, "var(--trav)"],
  [93.35, 45.57, 6.3, 8.86, 0.8, "var(--ecol)"],
  [93.35, 55.13, 6.3, 8.86, 0.8, "var(--immi)"],
  [93.35, 64.68, 6.3, 8.86, 0.8, "var(--secu)"],
  [93.35, 74.24, 6.3, 8.86, 0.8, "var(--sante)"],
  [93.35, 83.79, 6.3, 8.86, 0.8, "var(--educ)"],
  [93, 93, 7, 7, 0, "var(--chalk)"],
  [83.79, 93.35, 8.86, 6.3, 0.8, "var(--loge)"],
  [74.24, 93.35, 8.86, 6.3, 0.8, "var(--euro)"],
  [64.68, 93.35, 8.86, 6.3, 0.8, "var(--inst)"],
  [55.13, 93.35, 8.86, 6.3, 0.8, "var(--soc)"],
  [45.57, 93.35, 8.86, 6.3, 0.8, "var(--eco)"],
  [36.02, 93.35, 8.86, 6.3, 0.8, "var(--trav)"],
  [26.46, 93.35, 8.86, 6.3, 0.8, "var(--ecol)"],
  [16.91, 93.35, 8.86, 6.3, 0.8, "var(--immi)"],
  [7.35, 93.35, 8.86, 6.3, 0.8, "var(--secu)"],
  [0, 93, 7, 7, 0, "var(--chalk)"],
  [0.35, 83.79, 6.3, 8.86, 0.8, "var(--sante)"],
  [0.35, 74.24, 6.3, 8.86, 0.8, "var(--educ)"],
  [0.35, 64.68, 6.3, 8.86, 0.8, "var(--loge)"],
  [0.35, 55.13, 6.3, 8.86, 0.8, "var(--euro)"],
  [0.35, 45.57, 6.3, 8.86, 0.8, "var(--inst)"],
  [0.35, 36.02, 6.3, 8.86, 0.8, "var(--soc)"],
  [0.35, 26.46, 6.3, 8.86, 0.8, "var(--eco)"],
  [0.35, 16.91, 6.3, 8.86, 0.8, "var(--trav)"],
  [0.35, 7.35, 6.3, 8.86, 0.8, "var(--ecol)"],
];

/** La piste colorée autour du plateau (décorative). */
export function PisteDuPlateau() {
  return (
    <svg className="track" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {CASES.map(([x, y, largeur, hauteur, arrondi, couleur], i) => (
        <rect key={i} x={x} y={y} width={largeur} height={hauteur} rx={arrondi || undefined} style={{ fill: couleur }} />
      ))}
    </svg>
  );
}
