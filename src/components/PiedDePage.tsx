"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LIENS = [
  ["/rattrapage", "Toutes les questions"],
  ["/methode", "Méthode de calcul"],
  ["/a-propos", "À propos"],
  ["/journal", "Journal des corrections"],
  ["/appareil", "Changer d'appareil"],
] as const;

function Liens({ chemin }: { chemin: string | null }) {
  return (
    <nav aria-label="Pied de page">
      {LIENS.map(([adresse, nom]) => (
        <Link key={adresse} href={adresse} aria-current={chemin === adresse ? "page" : undefined}>
          {nom}
        </Link>
      ))}
    </nav>
  );
}

/** Les liens du menu lisent l'adresse de la page : sous un <Suspense>, comme le veut Next pour les données d'URL. */
function LiensDeLaPage() {
  return <Liens chemin={usePathname()} />;
}

/**
 * Le pied de page commun à tous les écrans (maquettes/introuvable.html) : les cinq pages secondaires, la sienne marquée.
 * « Rattraper les questions » de la maquette s'appelle « Toutes les questions », comme dans le menu, depuis que toutes
 * les questions se font d'un coup (décision du 25 octobre).
 */
export function PiedDePage() {
  return (
    <footer className="site-foot">
      <Suspense fallback={<Liens chemin={null} />}>
        <LiensDeLaPage />
      </Suspense>
    </footer>
  );
}
