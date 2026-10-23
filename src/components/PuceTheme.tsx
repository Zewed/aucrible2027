import type { Theme } from "@/lib/contenu";

/** La pastille du thème : la part du camembert, à la couleur du thème, puis son nom (maquettes/index.html). */
export function PuceTheme({ theme }: { theme: Theme }) {
  return (
    <p className="theme-chip">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M50 92L26.33 11.40A84 84 0 0 1 73.67 11.40Z"
          style={{ fill: "var(--theme)", stroke: "var(--theme)", strokeWidth: 10, strokeLinejoin: "round" }}
        />
      </svg>
      {theme.nom}
    </p>
  );
}
