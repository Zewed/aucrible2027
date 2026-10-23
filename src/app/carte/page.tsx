import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { CarteAvecCandidat } from "@/components/Carte";
import { lireCandidats, lireThemes } from "@/lib/contenu";
import { lireAujourdhui, lireQuestionsDuCalcul } from "@/lib/publication";
import "./carte-story.css";

/** « Ta carte » : la carte de résultat au format story, dessinée sur l'appareil à partir de ses réponses. */
async function Carte() {
  const [jour, questions] = await Promise.all([lireAujourdhui(), lireQuestionsDuCalcul()]);
  return (
    <>
      <BandeauRetour jour={jour} vers="/resultats" libelle="Mes résultats" />
      <main className="sp">
        <section className="sp-hero" aria-labelledby="h-carte">
          <h1 id="h-carte">
            Ta carte<i>.</i>
          </h1>
          <p className="sp-lead">Une image au format story (9:16), prête pour Instagram ou TikTok. Tu choisis ce qu&apos;elle montre.</p>
        </section>
        <CarteAvecCandidat questions={questions} candidats={lireCandidats()} themes={lireThemes()} />
      </main>
    </>
  );
}

export default function PageCarte() {
  return (
    <Suspense>
      <Carte />
    </Suspense>
  );
}
