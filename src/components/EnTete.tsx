"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";

/** Les deux écrans principaux, dans le menu de l'en-tête (visible à partir de 900 px, comme la maquette). */
const ECRANS = [
  { adresse: "/", nom: "Question du jour" },
  { adresse: "/resultats", nom: "Mes résultats" },
];

/** Le menu des deux écrans principaux, celui de la page où l'on est mis en avant quand on la connaît. */
function Menu({ chemin }: { chemin: string | null }) {
  return (
    <nav className="topnav" aria-label="Navigation">
      {ECRANS.map(({ adresse, nom }) => (
        <Link key={adresse} href={adresse} aria-current={chemin === adresse ? "page" : undefined}>
          {nom}
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
 * La barre du haut : le logo, qui ramène à la question du jour, et le menu des deux écrans principaux, celui où l'on
 * est mis en avant. La série de jours d'affilée n'existe plus (décision de l'auteur, 25 octobre 2026).
 */
export function EnTete() {
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
    </header>
  );
}
