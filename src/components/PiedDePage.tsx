"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BoutonDuMode } from "@/components/BoutonDuMode";

// « Changer d'appareil » n'y est plus (retour d'Antoine du 4 novembre) : la page /appareil reste, sans lien ici.
const LIENS = [
  ["/rattrapage", "Toutes les questions"],
  ["/methode", "Méthode de calcul"],
  ["/a-propos", "À propos"],
  ["/journal", "Journal des corrections"],
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
 * Le pied de page commun à tous les écrans (maquettes/introuvable.html) : les quatre pages secondaires, la sienne marquée,
 * sur une ligne. « Rattraper les questions » de la maquette s'appelle « Toutes les questions », comme dans le menu, depuis
 * que toutes les questions se font d'un coup (décision du 25 octobre).
 */
export function PiedDePage({ videosVerrouillees }: { videosVerrouillees: number }) {
  return (
    <footer className="site-foot">
      <Suspense fallback={<Liens chemin={null} />}>
        <LiensDeLaPage />
      </Suspense>
      <BoutonDuMode />
      {/* Repère provisoire d'Antoine, à retirer avant le lancement avec la page /verrous. */}
      <Link className="repere-verrous" href="/verrous">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="currentColor" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        {videosVerrouillees} {videosVerrouillees > 1 ? "vidéos verrouillées" : "vidéo verrouillée"}
      </Link>
    </footer>
  );
}
