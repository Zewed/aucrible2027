import Link from "next/link";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { ApercuDeLaCarte } from "@/components/Carte";
import { Classement } from "@/components/Classement";
import { Fiabilite } from "@/components/Fiabilite";
import { PageEnAttente } from "@/components/PageEnAttente";
import { Recommencer } from "@/components/Recommencer";
import { GrandCamembert } from "@/components/Themes";
import { lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireCandidatsEnLice, lireQuestionsDuCalcul } from "@/lib/publication";
import "./resultats-vide.css";

/**
 * « Mes résultats » : le titre, puis le classement calculé sur l'appareil à partir de ses réponses, en grille, thème par
 * thème. Le classement et la carte ne comptent que les candidats en lice. La grille remplace le plateau à deux axes et la
 * liste des thèmes (décision de l'auteur, 9 novembre 2026) : les candidats y formaient deux blocs, quelles que soient les
 * réponses.
 */
async function Resultats() {
  const [jour, duCalcul, enLice] = await Promise.all([lireAujourdhui(), lireQuestionsDuCalcul(), lireCandidatsEnLice()]);
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
              <Fiabilite questions={duCalcul} />
              <p className="notpoll">
                <b>Ce n&apos;est pas un sondage</b> : seulement tes réponses, gardées sur ton téléphone.
              </p>
            </div>
            <GrandCamembert questions={duCalcul} themes={themes} />
          </div>
        </section>
        <Classement questions={duCalcul} candidats={enLice} themes={themes} />
        <ApercuDeLaCarte questions={duCalcul} candidats={enLice} themes={themes} />
        {/* « Signaler une erreur », avant le retour dans la maquette, attend son formulaire. */}
        <footer className="res-foot">
          <span className="tag">Ce n&apos;est pas un sondage</span>
          <nav>
            <Link href="/questionnaire">Retour aux questions</Link>
            <Recommencer />
          </nav>
        </footer>
      </main>
    </>
  );
}

export default function PageResultats() {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Resultats />
    </Suspense>
  );
}
