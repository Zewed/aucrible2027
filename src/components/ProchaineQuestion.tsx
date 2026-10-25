"use client";

import Link from "next/link";
import { Bandeau, Fiche } from "@/components/Fiche";
import type { Question, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis, dateLisible } from "@/lib/date";
import { lireOrdre, prochaineQuestion } from "@/lib/ordre";
import { lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que montre l'accueil quand il n'y a pas de question à poser : une carte, un message. */
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
 * L'accueil : la prochaine question sans réponse, dans l'ordre tiré pour cet appareil (SPEC.md, « Boucle principale »,
 * 25 octobre 2026). Toutes les questions publiées sont jouables d'un coup. Les réponses sont lues une fois : la
 * question ne change pas sous les yeux de l'électeur pendant qu'il valide, la suivante vient au prochain accueil.
 */
export function ProchaineQuestion({
  questions,
  prochaineParution,
  themes,
}: {
  questions: Question[];
  prochaineParution: string | null;
  themes: Theme[];
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const numeros = questions.map((q) => q.numero);
  const ordre = useCoteClient(() => lireOrdre(numeros));
  const reponses = lesReponses(useCoteClient(lireReponses));

  if (!jour || !ordre) return null;

  const numero = prochaineQuestion(ordre, numeros, Object.keys(reponses).map(Number));
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
    // Texte provisoire : ce que dit l'accueil quand toutes les questions ont une réponse.
    return (
      <>
        {bandeau}
        <Annonce message="Tu as répondu à toutes les questions.">
          <Link className="btn-link" href="/resultats">
            Voir mes résultats
          </Link>
        </Annonce>
      </>
    );
  }

  const enJeu = { questions: questions.map(({ numero, theme }) => ({ numero, theme })), themes };
  return <Fiche question={question} theme={theme} revelation={`/question/${question.numero}/revelation`} enJeu={enJeu} />;
}
