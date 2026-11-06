import type { Metadata } from "next";
import { Suspense } from "react";
import { PageEnAttente } from "@/components/PageEnAttente";
import { Presentation } from "@/components/Presentation";
import { lireLaPresentation } from "@/lib/presentation";
import { lireQuestionsPubliees } from "@/lib/publication";
import "./presentation.css";

export const metadata: Metadata = {
  title: "Au crible 2027 : les sujets de la présidentielle, un par un",
  description: "Tu choisis ta réponse avant de savoir quels candidats la défendent. Gratuit, sans compte et sans pub.",
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
