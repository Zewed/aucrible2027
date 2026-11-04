import { Suspense } from "react";
import { PageEnAttente } from "@/components/PageEnAttente";
import { lireVideosVerrouillees } from "@/lib/contenu";
import { lireQuestionsPubliees } from "@/lib/publication";
import "./verrous.css";

/** Les questions publiées, celles dont la vidéo est verrouillée marquées. */
async function Verrous() {
  const questions = (await lireQuestionsPubliees()).sort((a, b) => a.numero - b.numero);
  const verrouillees = new Set(lireVideosVerrouillees());
  const faites = questions.filter((q) => verrouillees.has(q.numero)).length;
  return (
    <main className="verrous">
      <h1>
        Vidéos verrouillées<span>.</span>
      </h1>
      <p className="verrous-compte">
        {faites} sur {questions.length}
      </p>
      <ol>
        {questions.map((q) => (
          <li key={q.numero} className={verrouillees.has(q.numero) ? "faite" : undefined}>
            <span className="verrous-num">{String(q.numero).padStart(3, "0")}</span>
            <span>{q.question}</span>
            {verrouillees.has(q.numero) && <span className="verrous-etat">Verrouillée</span>}
          </li>
        ))}
      </ol>
    </main>
  );
}

/** Repère provisoire d'Antoine : où en sont les vidéos « constat ». À retirer avant le lancement du site. */
export default function PageVerrous() {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Verrous />
    </Suspense>
  );
}
