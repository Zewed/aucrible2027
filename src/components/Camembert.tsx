/** Les 11 parts du camembert, une par thème, dans l'ordre de content/themes.yaml, à partir du haut. */
const PARTS = 11;

const point = (rayon: number, angle: number) =>
  `${(100 + rayon * Math.cos(angle)).toFixed(2)} ${(100 + rayon * Math.sin(angle)).toFixed(2)}`;
const angleDe = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / PARTS;

/**
 * Le camembert de maquettes/resultats.html : 11 parts entre un rayon de 22 et de 90, séparées de traits
 * blancs. `couleurs` donne la couleur de chaque part gagnée, dans l'ordre des thèmes ; une part sans
 * couleur reste vide.
 */
export function Camembert({ couleurs = [] }: { couleurs?: (string | null)[] }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="99" style={{ fill: "#fff" }} />
      {Array.from({ length: PARTS }, (_, i) => {
        const [debut, fin] = [angleDe(i), angleDe(i + 1)];
        const d = `M${point(90, debut)}A90 90 0 0 1 ${point(90, fin)}L${point(22, fin)}A22 22 0 0 0 ${point(22, debut)}Z`;
        return <path key={i} d={d} style={{ fill: couleurs[i] ?? "var(--slot)" }} />;
      })}
      {Array.from({ length: PARTS }, (_, i) => {
        const [x1, y1] = point(20, angleDe(i)).split(" ");
        const [x2, y2] = point(92, angleDe(i)).split(" ");
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />;
      })}
      <circle cx="100" cy="100" r="22" style={{ fill: "#fff" }} />
    </svg>
  );
}
