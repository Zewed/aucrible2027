"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Question, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que la jauge lit des questions publiées : leur numéro et leur thème. */
export type QuestionDeLaJauge = Pick<Question, "numero" | "theme">;

/** Le contenu de la jauge n'existe qu'une fois les réponses lues : au rendu serveur, rien, la place est gardée. */
const surLeClient = () => "oui";

/**
 * La jauge des questions, en haut de chaque page (décision du 27 octobre 2026) : « 11 sur 26 questions » et une barre,
 * sans couleur, pour ne pas disputer l'œil à la page. Au survol, ou d'une touche, le détail par thème ; un thème qui a
 * encore des questions sans réponse mène à elles, l'accueil les enchaîne alors (« Répondre thème par thème »).
 */
export function JaugeDesQuestions({ questions, themes }: { questions: QuestionDeLaJauge[]; themes: Theme[] }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = useId();
  const pret = useCoteClient(surLeClient);
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (!pret || questions.length === 0) return <div className="jauge"></div>;

  const faites = questions.filter((q) => q.numero in reponses).length;
  const parTheme = themes
    .map((theme) => {
      const siennes = questions.filter((q) => q.theme === theme.id);
      return { theme, total: siennes.length, faites: siennes.filter((q) => q.numero in reponses).length };
    })
    .filter(({ total }) => total > 0);

  return (
    <nav className="jauge" aria-label="Questions">
      <div
        className={ouvert ? "jauge-g ouvert" : "jauge-g"}
        onMouseLeave={() => setOuvert(false)}
        onKeyDown={(e) => e.key === "Escape" && setOuvert(false)}
      >
        <button type="button" className="jauge-tete" aria-expanded={ouvert} aria-controls={liste} onClick={() => setOuvert(!ouvert)}>
          <span className="jauge-t">
            <b>{faites}</b> sur {questions.length} questions
          </span>
          <span className="jauge-barre" aria-hidden="true">
            <i style={{ width: `${(100 * faites) / questions.length}%` }}></i>
          </span>
        </button>
        <ul className="jauge-themes" id={liste} aria-label="Par thème">
          {parTheme.map(({ theme, total, faites }) => {
            const ligne = (
              <>
                <span className="jauge-nom">{theme.nom}</span>
                <span className="jauge-mini" aria-hidden="true">
                  <i style={{ width: `${(100 * faites) / total}%` }}></i>
                </span>
                <span className="jauge-c">
                  {faites}/{total}
                </span>
              </>
            );
            return (
              <li key={theme.id} className={theme.classe}>
                {faites < total ? (
                  <Link href={`/?theme=${theme.id}`} onClick={() => setOuvert(false)}>
                    {ligne}
                  </Link>
                ) : (
                  <span className="fini">{ligne}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
