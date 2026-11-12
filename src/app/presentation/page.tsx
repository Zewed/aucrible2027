import type { Metadata } from "next";
import { Suspense } from "react";
import { PageEnAttente } from "@/components/PageEnAttente";
import { Presentation } from "@/components/Presentation";
import { lireLaPresentation } from "@/lib/presentation";
import { lireQuestionsPubliees } from "@/lib/publication";
import "./presentation.css";

export const metadata: Metadata = {
  title: "Décrypte 2027 : tout ça est dans les programmes",
  description: "L'âge de ta retraite, ton SMIC, ton loyer, ton médecin : sujet par sujet, ce que chaque proposition change, chiffres et sources à l'appui.",
};

/** La landing à son adresse propre, à partager : l'accueil la montre aussi, mais seulement à un appareil sans réponse. */
async function Contenu() {
  return <Presentation {...await lireLaPresentation(await lireQuestionsPubliees())} />;
}

export default function PagePresentation() {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Contenu />
    </Suspense>
  );
}
