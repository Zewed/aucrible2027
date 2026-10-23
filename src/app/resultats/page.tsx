import Link from "next/link";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { ApercuDeLaCarte } from "@/components/Carte";
import { Classement } from "@/components/Classement";
import { Plateau } from "@/components/Plateau";
import { GrandCamembert, TesThemes } from "@/components/Themes";
import { lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireCandidatsEnLice, lireLesCandidats, lireQuestionsDuCalcul } from "@/lib/publication";
import "./resultats-vide.css";

/**
 * « Mes résultats » : le titre, puis le classement calculé sur l'appareil à partir de ses réponses. Le classement
 * et la carte ne comptent que les candidats en lice ; ce que deviennent le plateau et les thèmes après un retrait
 * reste à trancher, ils gardent tous les candidats.
 */
async function Resultats() {
  const [jour, duCalcul, candidats, enLice] = await Promise.all([
    lireAujourdhui(),
    lireQuestionsDuCalcul(),
    lireLesCandidats(),
    lireCandidatsEnLice(),
  ]);
  const themes = lireThemes();
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="res">
        <section className="res-hero">
          <div className="res-top">
            <div>
              <h1>
                Mes résultats<span>.</span>
              </h1>
              <p className="notpoll">
                <b>Ce n&apos;est pas un sondage</b> : seulement tes réponses, gardées sur ton téléphone.
              </p>
            </div>
            <GrandCamembert questions={duCalcul} themes={themes} />
          </div>
        </section>
        <div className="res-grid">
          <Classement questions={duCalcul} candidats={enLice} />
          <Plateau questions={duCalcul} candidats={candidats} />
        </div>
        <TesThemes questions={duCalcul} themes={themes} candidats={candidats} />
        <ApercuDeLaCarte questions={duCalcul} candidats={enLice} themes={themes} />
        {/* « Signaler une erreur », avant le retour dans la maquette, attend son formulaire. */}
        <footer className="res-foot">
          <span className="tag">Ce n&apos;est pas un sondage</span>
          <nav>
            <Link href="/">Retour à la question du jour</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}

export default function PageResultats() {
  return (
    <Suspense>
      <Resultats />
    </Suspense>
  );
}
