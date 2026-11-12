"use client";

import Link from "next/link";
import { Bandeau, Fiche } from "@/components/Fiche";
import { PageEnAttente } from "@/components/PageEnAttente";
import type { QuestionDeLaFiche, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis, dateLisible } from "@/lib/date";
import { lireOrdre, prochaineQuestionDuTheme } from "@/lib/ordre";
import { lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que montre le questionnaire quand il n'y a pas de question à poser : une carte, un message. */
function Annonce({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <main className="today">
      <div className="left">
        <div className="deck">
          <article className="qcard" aria-labelledby="annonce">
            <div className="qcard-body">
              <h1 id="annonce">{message}</h1>
              {children}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

/**
 * Le questionnaire : la prochaine question sans réponse, dans l'ordre tiré pour cet appareil (SPEC.md, « Boucle principale »,
 * 25 octobre 2026). Toutes les questions publiées sont jouables d'un coup. Les réponses sont lues une fois : la
 * question ne change pas sous les yeux de l'électeur pendant qu'il valide, la suivante vient à la prochaine visite.
 * Avec `filtre`, un thème choisi dans la jauge des questions, le questionnaire enchaîne ses questions tant qu'il en reste.
 */
export function ProchaineQuestion({
  questions,
  prochaineParution,
  themes,
  filtre,
}: {
  questions: QuestionDeLaFiche[];
  prochaineParution: string | null;
  themes: Theme[];
  filtre: string | null;
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const numeros = questions.map((q) => q.numero);
  const ordre = useCoteClient(() => lireOrdre(numeros));
  const reponses = lesReponses(useCoteClient(lireReponses));

  // Le rendu serveur ne connaît ni le jour local ni les réponses : la page garde sa place jusqu'au navigateur.
  if (!jour || !ordre) return <PageEnAttente />;

  const { numero, dansLeTheme } = prochaineQuestionDuTheme(ordre, questions, Object.keys(reponses).map(Number), filtre);
  const question = questions.find((q) => q.numero === numero) ?? null;
  const theme = question && themes.find((t) => t.id === question.theme);
  const bandeau = <Bandeau jour={jour} question={question} />;
  if (questions.length === 0 && prochaineParution) {
    // Texte provisoire : le message exact reste à trancher (ticket 040).
    return (
      <>
        {bandeau}
        <Annonce message={`La première question arrive le ${dateLisible(prochaineParution, true)}.`} />
      </>
    );
  }
  if (!question || !theme) {
    // Texte provisoire : ce qu'il dit quand toutes les questions ont une réponse.
    return (
      <>
        {bandeau}
        <Annonce message="Tu as répondu à toutes les questions.">
          <Link className="btn-link" href="/resultats">
            Résultats
          </Link>
        </Annonce>
      </>
    );
  }

  const enJeu = { questions: questions.map(({ numero, theme }) => ({ numero, theme })), themes };
  // Next garde la page quittée, avec son état : sans clé, la question suivante reprendrait le choix de la précédente.
  const revelation = `/question/${question.numero}/revelation${dansLeTheme ? `?theme=${theme.id}` : ""}`;
  return <Fiche key={question.numero} question={question} theme={theme} revelation={revelation} enJeu={enJeu} />;
}
