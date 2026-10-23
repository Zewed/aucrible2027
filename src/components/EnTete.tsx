"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { De } from "@/components/De";
import { Logo } from "@/components/Logo";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";
import { joursDAffilee } from "@/lib/serie";

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
 * La barre du haut : le logo, qui ramène à la question du jour ; le menu des deux écrans principaux, celui où l'on
 * est mis en avant ; la série de jours d'affilée.
 */
export function EnTete() {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = Object.values(lesReponses(useCoteClient(lireReponses, abonnerAuxReponses)));
  const serie = jour ? joursDAffilee(reponses, jour) : 0;

  // La série déjà affichée par cet en-tête, qui reste monté d'une page à l'autre : le dé ne roule que
  // si elle augmente sous ses yeux, pas au chargement d'une page.
  const [affichee, setAffichee] = useState<number | null>(null);
  const [roule, setRoule] = useState(false);
  if (jour && affichee !== serie) {
    if (affichee !== null && serie > affichee) setRoule(true);
    setAffichee(serie);
  }

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
      {serie > 0 && (
        <div className="streak">
          <De roule={roule} onRoule={() => setRoule(false)} />
          <span>
            <b>
              {serie} {serie > 1 ? "jours" : "jour"}
            </b>{" "}
            <small>d&apos;affilée</small>
          </span>
        </div>
      )}
    </header>
  );
}
