"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { Logo } from "@/components/Logo";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";

const TRAIT = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Les écrans principaux, en icônes : leur nom se lit au survol et par les lecteurs d'écran (décision du 25 octobre 2026). */
const ECRANS = [
  {
    adresse: "/",
    nom: "Répondre",
    icone: (
      <>
        <rect x="4" y="5" width="12" height="16" rx="2.5" style={TRAIT} />
        <path d="M8 3h10a2 2 0 0 1 2 2v13" style={TRAIT} />
      </>
    ),
  },
  { adresse: "/resultats", nom: "Mes résultats", icone: <path d="M5 20V11M12 20V5M19 20v-7" style={TRAIT} /> },
  { adresse: "/rattrapage", nom: "Toutes les questions", icone: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" style={TRAIT} /> },
  {
    adresse: "/methode",
    nom: "Méthode",
    icone: (
      <>
        <path d="M5 4h10l4 4v12H5z" style={TRAIT} />
        <path d="M9 12h6M9 16h4" style={TRAIT} />
      </>
    ),
  },
];

/** Le menu des écrans principaux, celui de la page où l'on est mis en avant quand on la connaît. */
function Menu({ chemin }: { chemin: string | null }) {
  return (
    <nav className="topnav" aria-label="Navigation">
      {ECRANS.map(({ adresse, nom, icone }) => (
        <Link key={adresse} href={adresse} aria-label={nom} title={nom} aria-current={chemin === adresse ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {icone}
          </svg>
        </Link>
      ))}
    </nav>
  );
}

/** Le menu, qui lit l'adresse de la page : il vit sous un <Suspense>, comme le veut Next pour les données d'URL. */
function MenuDeLaPage() {
  return <Menu chemin={usePathname()} />;
}

/**
 * Le menu de l'app : sur ordinateur, une colonne d'icônes à gauche, avec le compte à rebours en bas, pour laisser toute
 * la hauteur à la page ; au téléphone, une barre en haut. Le logo ramène à la prochaine question.
 */
export function EnTete() {
  const jour = useCoteClient(() => aujourdhuiAParis());
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <Logo />
        <span>
          Au crible <b>2027</b>
        </span>
      </Link>
      <Suspense fallback={<Menu chemin={null} />}>
        <MenuDeLaPage />
      </Suspense>
      <div className="rail-cd">{jour && <CompteARebours jour={jour} court />}</div>
    </header>
  );
}
