import type { Theme } from "@/lib/contenu";

/**
 * La part du camembert, à la couleur du thème de son parent (maquettes/index.html). `vide` la dessine
 * en pointillés, comme une part pas encore gagnée (maquettes/resultats.html).
 */
export function PartDuTheme({ vide = false }: { vide?: boolean }) {
  const style = vide
    ? { fill: "var(--table-3)", stroke: "var(--theme)", strokeWidth: 6, strokeLinejoin: "round" as const, strokeDasharray: "9 7" }
    : { fill: "var(--theme)", stroke: "var(--theme)", strokeWidth: 10, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 92L26.33 11.40A84 84 0 0 1 73.67 11.40Z" style={style} />
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
