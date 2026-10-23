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

/** Les types d'erreur du formulaire, « Un chiffre » choisi au départ (maquettes/signaler.html). */
const TYPES = [
  { valeur: "chiffre", nom: "Un chiffre" },
  { valeur: "position", nom: "La position d'un candidat" },
  { valeur: "formulation", nom: "Une formulation qui penche" },
  { valeur: "autre", nom: "Autre" },
];

/** « C'est quel genre d'erreur ? » : un seul type à la fois, des boutons radio en pastilles, sans script. */
function TypeDErreur() {
  return (
    <fieldset className="f-block f-set">
      <legend className="f-label">C&apos;est quel genre d&apos;erreur ?</legend>
      <div className="chips-row">
        {TYPES.map(({ valeur, nom }, i) => (
          <label key={valeur} className="chip">
            <input type="radio" name="type" value={valeur} defaultChecked={i === 0} />
            <span>
              <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {nom}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * « Signaler une erreur » (maquettes/signaler.html) : le titre, l'introduction, puis le formulaire, rempli de la
 * fiche d'où vient l'électeur (`?question=N`, une question déjà publiée). Sans fiche connue, « Sur quelle fiche ? »
 * n'apparaît pas : ce cas reste à trancher. Le reste du formulaire et l'envoi viennent avec les tickets 163 à 170.
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
            <TypeDErreur />
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
