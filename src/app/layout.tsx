import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Suspense } from "react";
import { EnTete } from "@/components/EnTete";
import { JaugeDesQuestions } from "@/components/JaugeDesQuestions";
import { PiedDePage } from "@/components/PiedDePage";
import { SansReseau } from "@/components/SansReseau";
import { Visite } from "@/components/Visite";
import { lireThemes, lireVideosVerrouillees } from "@/lib/contenu";
import { SCRIPT_DU_MODE } from "@/lib/mode";
import { lireQuestionsPubliees } from "@/lib/publication";
import { SCRIPT_DU_NOUVEAU_VENU } from "@/lib/reponses";
import "./kit.css";
import "./globals.css";

const affiche = Bricolage_Grotesque({ subsets: ["latin"], variable: "--police-affiche", axes: ["opsz", "wdth"] });
const texte = Instrument_Sans({ subsets: ["latin"], variable: "--police-texte" });

export const metadata: Metadata = {
  title: "Au crible 2027",
  description: "Des questions concrètes pour savoir de quels candidats tu es proche, chiffres et sources à l'appui.",
  // Version alpha : le site se partage par lien, les moteurs de recherche ne le référencent pas.
  robots: { index: false, follow: false },
};

/** La jauge en haut de chaque page, sur les questions publiées au jour de la requête. */
async function Jauge() {
  const questions = await lireQuestionsPubliees();
  return <JaugeDesQuestions questions={questions.map(({ numero, theme }) => ({ numero, theme }))} themes={lireThemes()} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${affiche.variable} ${texte.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DU_MODE + SCRIPT_DU_NOUVEAU_VENU }} />
      </head>
      <body>
        <EnTete />
        <Suspense fallback={<div className="jauge"></div>}>
          <Jauge />
        </Suspense>
        {children}
        <PiedDePage videosVerrouillees={lireVideosVerrouillees().length} />
        <SansReseau />
        <Visite />
      </body>
    </html>
  );
}
