"use client";

import Link from "next/link";
import { CompteARebours } from "@/components/CompteARebours";
import { Presentation, type DonneesDeLaPresentation } from "@/components/Presentation";
import { PuceTheme } from "@/components/PuceTheme";
import { StylesDeLaPage } from "@/components/StylesDeLaPage";
import type { Question, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis, dateLisible } from "@/lib/date";
import { lireOrdre, prochaineQuestion } from "@/lib/ordre";
import { reponsesComptees, SEUIL_DES_RESULTATS } from "@/lib/proximite";
import { abonnerAuxReponses, avancementParTheme, lesReponses, lireReponses } from "@/lib/reponses";
import { tenirALEcran } from "@/lib/tenir-a-l-ecran";

/** Sur ordinateur, l'accueil tient dans la fenêtre : son texte se resserre plutôt que de faire défiler. */
const tenirLaPage = tenirALEcran("(min-width: 900px)");

/**
 * Autour de l'accueil : il dit lui-même où en est l'électeur, la jauge des questions ne s'y répète pas ; sur ordinateur,
 * il tient dans l'écran, le pied de page compris.
 */
const AUTOUR = `
  :root { --jauge-h: 0px; }
  body { min-height: 100dvh; display: flex; flex-direction: column; }
  .jauge { display: none; }
  .site-foot { width: 100%; max-width: none; padding: 0 clamp(16px, 3.2vw, 64px) 6px; }
  .site-foot::before { display: none; }
`;

/** Tant qu'il n'a pas lu l'appareil, l'accueil d'un nouveau venu (SCRIPT_DU_NOUVEAU_VENU) cache déjà le menu de la landing. */
const EN_ATTENDANT = `
  :root[data-nouveau-venu] body { padding-left: 0; }
  :root[data-nouveau-venu] :is(.topbar, .jauge, .site-foot, body > .strip) { display: none; }
`;

/** La taille d'une question suit sa longueur : la plus longue fait trois fois la plus courte. */
const taille = (texte: string) => ({ "--k": Math.min(1, Math.sqrt(46 / texte.length)).toFixed(2) }) as React.CSSProperties;

/** Ce que l'accueil lit des questions publiées : pas leurs positions ni leurs fiches, qu'il n'affiche pas. */
export type QuestionDeLAccueil = Pick<Question, "numero" | "theme" | "question">;

/**
 * L'accueil. Un appareil sans réponse y voit la landing (décision d'Antoine du 6 novembre 2026). Les autres y continuent
 * le questionnaire là où ils en sont : à gauche, dans la couleur de son thème, la prochaine question, celle que
 * « Continuer » ouvre ; à droite, le compte et les thèmes, qui mènent à leurs questions. Tout ce qu'il dit de l'électeur
 * vient de l'appareil : il n'existe qu'une fois dans le navigateur.
 */
export function Accueil({
  questions,
  prochaineParution,
  themes,
  presentation,
}: {
  questions: QuestionDeLAccueil[];
  prochaineParution: string | null;
  themes: Theme[];
  presentation: DonneesDeLaPresentation;
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const numeros = questions.map((q) => q.numero);
  const ordre = useCoteClient(() => lireOrdre(numeros));
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));

  const autour = <StylesDeLaPage>{AUTOUR}</StylesDeLaPage>;
  if (!jour || !ordre)
    return (
      <>
        {autour}
        <StylesDeLaPage>{EN_ATTENDANT}</StylesDeLaPage>
        <main className="accueil"></main>
      </>
    );
  if (questions.length === 0)
    return (
      <>
        {autour}
        <main className="accueil">
          <section className="ac-bloc ac-seul theme-eco">
            {prochaineParution && <h1 className="ac-grande">La première question arrive le {dateLisible(prochaineParution, true)}.</h1>}
          </section>
        </main>
      </>
    );

  const faites = questions.filter((q) => q.numero in reponses).length;
  if (faites === 0) return <Presentation {...presentation} />;
  const numero = prochaineQuestion(ordre, numeros, Object.keys(reponses).map(Number));
  const prochaine = questions.find((q) => q.numero === numero);
  const theme = prochaine && themes.find((t) => t.id === prochaine.theme);
  const suite = prochaine && theme ? { question: prochaine.question, theme } : null;
  const comptees = reponsesComptees(questions, reponses);
  const Compte = prochaine ? "h1" : "p";

  return (
    <>
      {autour}
      <div className="strip">
        <CompteARebours jour={jour} />
      </div>
      <main ref={tenirLaPage} className="accueil">
        <section className={`ac-bloc ${suite ? suite.theme.classe : "theme-eco"}`}>
          {suite && <PuceTheme theme={suite.theme} />}
          {suite ? (
            <p className="ac-grande" style={taille(suite.question)}>
              {suite.question}
            </p>
          ) : (
            <h1 className="ac-grande">Tu as répondu à toutes les questions.</h1>
          )}
          <Link className="ac-action" href={prochaine ? "/questionnaire" : "/resultats"}>
            {prochaine ? "Continuer le questionnaire" : "Voir mes résultats"}{" "}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
            </svg>
          </Link>
        </section>
        <section className="ac-etat">
          <Compte className="ac-compte">
            <b>{faites}</b> sur {questions.length} questions
          </Compte>
          <span className="ac-barre" aria-hidden="true">
            <i style={{ width: `${(100 * faites) / questions.length}%` }}></i>
          </span>
          {comptees > 0 && comptees < SEUIL_DES_RESULTATS && <p className="ac-palier">Encore {SEUIL_DES_RESULTATS - comptees} pour ton classement.</p>}
          <ul className="ac-themes" aria-label="Par thème">
            {avancementParTheme(themes, questions, reponses).map(({ theme, total, faites }) => {
              const ligne = (
                <>
                  <span className="ac-nom">{theme.nom}</span>
                  <span className="ac-mini" aria-hidden="true">
                    <i style={{ width: `${(100 * faites) / total}%` }}></i>
                  </span>
                  <span className="ac-c">
                    {faites}/{total}
                  </span>
                </>
              );
              return (
                <li key={theme.id} className={theme.classe}>
                  {faites < total ? <Link href={`/questionnaire?theme=${theme.id}`}>{ligne}</Link> : <span>{ligne}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
