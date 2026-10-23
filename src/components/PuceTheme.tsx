import type { Theme } from "@/lib/contenu";

export function PuceTheme({ theme }: { theme: Theme }) {
  return (
    <p className="theme-chip">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 10 L10 1 A9 9 0 0 1 18.5 7 Z" fill="currentColor" />
      </svg>
      {theme.nom}
    </p>
  );
}
