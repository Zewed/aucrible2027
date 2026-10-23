import type { Theme } from "@/lib/contenu";

/** La part du camembert, à la couleur du thème de son parent (maquettes/index.html). */
export function PartDuTheme() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 92L26.33 11.40A84 84 0 0 1 73.67 11.40Z"
        style={{ fill: "var(--theme)", stroke: "var(--theme)", strokeWidth: 10, strokeLinejoin: "round" }}
      />
    </svg>
  );
}

/** La pastille du thème : sa part du camembert, puis son nom. */
export function PuceTheme({ theme }: { theme: Theme }) {
  return (
    <p className="theme-chip">
      <PartDuTheme />
      {theme.nom}
    </p>
  );
}
