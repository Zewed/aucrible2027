"use client";

import { Bandeau, Fiche } from "@/components/Fiche";
import { Silence } from "@/components/Silence";
import type { Question, Theme } from "@/lib/contenu";
import { silenceEnCours } from "@/lib/silence";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis, dateLisible } from "@/lib/date";

/** Ce que montre l'accueil quand il n'y a pas de question à poser : une carte, un message. */
function Annonce({ message }: { message: string }) {
  return (
    <main className="today">
      <div className="left">
        <div className="deck">
          <article className="qcard" aria-labelledby="annonce">
            <div className="qcard-body">
              <h1 id="annonce">{message}</h1>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

export function QuestionDuJour({
  questions,
  prochaineParution,
  themes,
}: {
  questions: Question[];
  prochaineParution: string | null;
  themes: Theme[];
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const question = questions.find((q) => q.date === jour) ?? null;
  const theme = question && themes.find((t) => t.id === question.theme);

  if (!jour) return null;

  const bandeau = <Bandeau jour={jour} question={question} />;
  const silence = silenceEnCours(jour);
  if (silence) {
    return (
      <>
        {bandeau}
        <Silence jour={jour} silence={silence} />
      </>
    );
  }
  if (questions.length === 0 && prochaineParution) {
    // Texte provisoire : le message exact reste à trancher (ticket 040).
    return (
      <>
        {bandeau}
        <Annonce message={`La première question arrive le ${dateLisible(prochaineParution, true)}.`} />
      </>
    );
  }
  if (!question && !prochaineParution) {
    // Texte provisoire : le message exact, et ce que l'accueil propose à la place, restent à trancher (ticket 041).
    return (
      <>
        {bandeau}
        <Annonce message="Il n'y a plus de nouvelle question." />
      </>
    );
  }
  if (!question || !theme) return bandeau;

  // Seule la question du jour annonce la part en jeu ; une fiche de rattrapage, c'est à trancher.
  const enJeu = { questions: questions.map(({ numero, theme }) => ({ numero, theme })), themes };
  return <Fiche question={question} theme={theme} revelation="/revelation" enJeu={enJeu} />;
}
