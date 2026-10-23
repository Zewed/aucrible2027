import { useId } from "react";

/** Les 11 parts du camembert, une par thème, dans l'ordre de content/themes.yaml, à partir du haut. */
const PARTS = 11;

const point = (rayon: number, angle: number) =>
  `${(100 + rayon * Math.cos(angle)).toFixed(2)} ${(100 + rayon * Math.sin(angle)).toFixed(2)}`;
const angleDe = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / PARTS;

/**
 * Le camembert de maquettes/resultats.html : 11 parts entre un rayon `interieur` et 90, séparées de traits
 * blancs. `couleurs` donne la couleur de chaque part gagnée, dans l'ordre des thèmes ; une part sans
 * couleur reste vide. Le grand camembert (`grand`) fait apparaître ses parts gagnées une à une.
 */
export function Camembert({
  couleurs = [],
  interieur = 22,
  grand = false,
  enJeu,
  description,
}: {
  couleurs?: (string | null)[];
  interieur?: number;
  grand?: boolean;
  /** La part en jeu, rayée à la couleur de son thème (`couleur`), comme sur maquettes/index.html. */
  enJeu?: { part: number; couleur: string };
  description?: string;
}) {
  const rayures = `rayures-${useId()}`;
  let gagnees = 0;
  return (
    <svg
      viewBox="0 0 200 200"
      className={grand ? "token-pop" : undefined}
      role={description ? "img" : undefined}
      aria-label={description}
      aria-hidden={description ? undefined : true}
    >
      {enJeu && (
        <defs>
          <pattern id={rayures} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" style={{ fill: `color-mix(in srgb, ${enJeu.couleur} 30%, #fff)` }} />
            <rect width="4" height="8" style={{ fill: enJeu.couleur }} />
          </pattern>
        </defs>
      )}
      <circle cx="100" cy="100" r="99" style={{ fill: "#fff" }} />
      {Array.from({ length: PARTS }, (_, i) => {
        const [debut, fin] = [angleDe(i), angleDe(i + 1)];
        const d = `M${point(90, debut)}A90 90 0 0 1 ${point(90, fin)}L${point(interieur, fin)}A${interieur} ${interieur} 0 0 0 ${point(interieur, debut)}Z`;
        const couleur = couleurs[i];
        if (enJeu?.part === i)
          return [
            <path key={i} d={d} style={{ fill: "var(--slot)" }} />,
            <path key={`${i}-en-jeu`} className="wedge next" d={d} style={{ fill: `url(#${rayures})` }} />,
          ];
        if (!couleur) return <path key={i} d={d} style={{ fill: "var(--slot)" }} />;
        const delai = grand ? `${(0.25 + 0.09 * gagnees++).toFixed(2)}s` : undefined;
        return <path key={i} className="wedge on" d={d} style={{ fill: couleur, animationDelay: delai }} />;
      })}
      {Array.from({ length: PARTS }, (_, i) => {
        const [x1, y1] = point(interieur - 2, angleDe(i)).split(" ");
        const [x2, y2] = point(92, angleDe(i)).split(" ");
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" }} />;
      })}
      <circle cx="100" cy="100" r={interieur} style={{ fill: "#fff" }} />
    </svg>
  );
}
