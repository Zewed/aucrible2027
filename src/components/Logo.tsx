/**
 * Les onze barres du logo, de haut en bas : une par thème, dans l'ordre des thèmes. Chacune est [x, largeur] ; au
 * milieu, la barre est coupée en deux par le creux du D. Le dessin vient de maquettes/logos.html (piste 2, choisie
 * le 12 novembre 2026).
 */
const BARRES: { couleur: string; morceaux: [number, number][] }[] = [
  { couleur: "#FFC21F", morceaux: [[10, 54.33]] },
  { couleur: "#FF7A1A", morceaux: [[10, 66.2]] },
  { couleur: "#22B85A", morceaux: [[10, 72.88]] },
  { couleur: "#1FB2F0", morceaux: [[10, 21], [59.76, 27.23]] },
  { couleur: "#4357FF", morceaux: [[10, 21], [66.02, 23.24]] },
  { couleur: "#F2453D", morceaux: [[10, 21], [67.71, 22.29]] },
  { couleur: "#9461FF", morceaux: [[10, 21], [66.02, 23.24]] },
  { couleur: "#0E9E93", morceaux: [[10, 21], [59.76, 27.23]] },
  { couleur: "#A6D92B", morceaux: [[10, 72.88]] },
  { couleur: "#D63AC9", morceaux: [[10, 66.2]] },
  { couleur: "#FF7FB0", morceaux: [[10, 54.33]] },
];

/**
 * Le logo de Décrypte 2027 : un D fait de onze barres, une par thème, aux couleurs vives dans les deux modes.
 * Décoratif : le nom le suit en texte.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      {BARRES.map(({ couleur, morceaux }, i) =>
        morceaux.map(([x, largeur]) => (
          <rect key={`${i}-${x}`} x={x} y={7.12 + 8 * i} width={largeur} height={5.76} rx={2.88} style={{ fill: couleur }} />
        )),
      )}
    </svg>
  );
}
