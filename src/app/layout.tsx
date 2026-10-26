import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { EnTete } from "@/components/EnTete";
import { PiedDePage } from "@/components/PiedDePage";
import { SansReseau } from "@/components/SansReseau";
import { Visite } from "@/components/Visite";
import "./kit.css";
import "./globals.css";

const affiche = Bricolage_Grotesque({ subsets: ["latin"], variable: "--police-affiche", axes: ["opsz", "wdth"] });
const texte = Instrument_Sans({ subsets: ["latin"], variable: "--police-texte" });

export const metadata: Metadata = {
  title: "Au crible 2027",
  description: "Des questions concrètes pour savoir de quels candidats tu es proche, chiffres et sources à l'appui.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${affiche.variable} ${texte.variable}`}>
      <body>
        <EnTete />
        {children}
        <PiedDePage />
        <SansReseau />
        <Visite />
      </body>
    </html>
  );
}
