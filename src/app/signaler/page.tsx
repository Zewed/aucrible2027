import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { PuceTheme } from "@/components/PuceTheme";
import { lireThemes, type Question, type Theme } from "@/lib/contenu";
import { lireAujourdhui, lireQuestionsPubliees } from "@/lib/publication";
import "./signaler.css";

/** « Sur quelle fiche ? », rempli d'après la fiche d'où vient l'électeur. */
function SurQuelleFiche({ question, theme }: { question: Question; theme: Theme }) {
  return (
    <div className="f-block">
      <p className="f-label" id="l-card">
        Sur quelle fiche ?
      </p>
      <div className="qref" role="group" aria-labelledby="l-card">
        <PuceTheme theme={theme} />
        <p className="qref-t">
          <b>Question n°&nbsp;{question.numero}</b> — {question.question}
        </p>
      </div>
      {/* « Ce n'est pas la bonne fiche ? » de la maquette n'est porté par aucun ticket. */}
      <p className="f-help">Rempli pour toi.</p>
    </div>
  );
}

/**
 * « Signaler une erreur » (maquettes/signaler.html) : le titre, l'introduction, puis le formulaire, rempli de la
 * fiche d'où vient l'électeur (`?question=N`, une question déjà publiée). Sans fiche connue, « Sur quelle fiche ? »
 * n'apparaît pas : ce cas reste à trancher. Le reste du formulaire et l'envoi viennent avec les tickets 162 à 170.
 */
async function Signaler({ numero }: { numero?: string }) {
  const [jour, publiees] = await Promise.all([lireAujourdhui(), lireQuestionsPubliees()]);
  const question = publiees.find((q) => String(q.numero) === numero);
  const theme = question && lireThemes().find((t) => t.id === question.theme);
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className={theme ? `sig ${theme.classe}` : "sig"}>
        <section className="sig-head">
          <h1>
            Signaler une erreur<span>.</span>
          </h1>
          <p className="sig-intro">
            Un chiffre faux, une position mal attribuée, une phrase qui penche&nbsp;? <span className="nb">Dis-le-nous</span>&nbsp;: on
            vérifie et on corrige.
          </p>
        </section>
        {question && theme && (
          <form className="sig-card">
            <SurQuelleFiche question={question} theme={theme} />
          </form>
        )}
      </main>
    </>
  );
}

export default function PageSignaler({ searchParams }: PageProps<"/signaler">) {
  return (
    <Suspense>
      {searchParams.then(({ question }) => (
        <Signaler numero={typeof question === "string" ? question : undefined} />
      ))}
    </Suspense>
  );
}
