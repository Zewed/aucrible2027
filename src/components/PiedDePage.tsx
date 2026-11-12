"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BoutonDuMode } from "@/components/BoutonDuMode";
import { Reseaux } from "@/components/Reseaux";

// « Changer d'appareil » revient (retour d'Antoine du 12 novembre, après l'avoir retiré le 4) : emporter ses réponses.
// Tant qu'aucune correction n'est publiée, le journal n'a pas de lien (retour d'Antoine du 12 novembre).
const LIENS = [
  ["/rattrapage", "Toutes les questions"],
  ["/methode", "Méthode de calcul"],
  ["/a-propos", "À propos"],
  ["/journal", "Journal des corrections"],
  ["/appareil", "Changer d'appareil"],
] as const;

function Liens({ chemin, journal }: { chemin: string | null; journal: boolean }) {
  return (
    <nav aria-label="Pied de page">
      {LIENS.filter(([adresse]) => journal || adresse !== "/journal").map(([adresse, nom]) => (
        <Link key={adresse} href={adresse} aria-current={chemin === adresse ? "page" : undefined}>
          {nom}
        </Link>
      ))}
    </nav>
  );
}

/** Les liens du menu lisent l'adresse de la page : sous un <Suspense>, comme le veut Next pour les données d'URL. */
function LiensDeLaPage({ journal }: { journal: boolean }) {
  return <Liens chemin={usePathname()} journal={journal} />;
}

/**
 * Le pied de page commun à tous les écrans (maquettes/introuvable.html) : les pages secondaires, la sienne marquée,
 * sur une ligne, puis les réseaux de l'auteur. « Rattraper les questions » de la maquette s'appelle « Toutes les questions », comme dans le menu, depuis
 * que toutes les questions se font d'un coup (décision du 25 octobre).
 */
export function PiedDePage({ videosVerrouillees, journal }: { videosVerrouillees: number; journal: boolean }) {
  return (
    <footer className="site-foot">
      <Suspense fallback={<Liens chemin={null} journal={journal} />}>
        <LiensDeLaPage journal={journal} />
      </Suspense>
      <BoutonDuMode />
      <Reseaux className="reseaux" />
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
