import Link from "next/link";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { Classement } from "@/components/Classement";
import { lireCandidats } from "@/lib/contenu";
import type { QuestionDuCalcul } from "@/lib/proximite";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";

/** « Mes résultats » : le titre, puis le classement calculé sur l'appareil à partir de ses réponses. */
async function Resultats() {
  const [jour, questions] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  // Le navigateur ne reçoit des fiches publiées que ce que le calcul lit.
  const duCalcul: QuestionDuCalcul[] = questions.map((q) => ({
    numero: q.numero,
    options: q.options.map((o) => ({ id: o.id, horsEchelle: o.horsEchelle })),
    positions: Object.fromEntries(Object.entries(q.positions).map(([id, p]) => [id, { option: p.option }])),
  }));
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
          </div>
        </section>
        <div className="res-grid">
          <Classement questions={duCalcul} candidats={lireCandidats()} />
        </div>
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
