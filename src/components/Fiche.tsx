"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camembert } from "@/components/Camembert";
import { CompteARebours } from "@/components/CompteARebours";
import { NumeroQuestion } from "@/components/NumeroQuestion";
import { PuceTheme } from "@/components/PuceTheme";
import { VignetteVideo } from "@/components/VignetteVideo";
import type { Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { tirerGraine } from "@/lib/melange";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { REPONSES_PAR_PART, reponsesParTheme } from "@/lib/proximite";
import { enregistrerReponse, JE_NE_SAIS_PAS, lesReponses, lireReponses, type Reponse } from "@/lib/reponses";
import { tenirALEcran } from "@/lib/tenir-a-l-ecran";

/** Sur grand écran, chaque étape tient dans la fenêtre : son texte se resserre plutôt que d'être coupé. */
const tenirLEcranPartage = tenirALEcran("(min-width: 1200px)", 1, ".scene");
const tenirLaMosaique = tenirALEcran("(min-width: 1100px)");

const IMPORTANCES = [
  { poids: 1, libelle: "Un peu" },
  { poids: 2, libelle: "Beaucoup" },
  { poids: 3, libelle: "Essentiel" },
];

/** Le bandeau sous l'en-tête : le compte à rebours, et le numéro de la fiche quand il y en a une. */
export function Bandeau({ jour, question }: { jour: string; question: Question | null }) {
  return (
    <div className="strip">
      <CompteARebours jour={jour} />
      {question && <NumeroQuestion numero={question.numero} />}
    </div>
  );
}

/** La couleur d'un thème, celle de sa part : `--trav` pour « theme-trav ». */
const couleurDe = (theme: Theme) => `var(--${theme.classe.replace("theme-", "")})`;

/** Ce que la fiche du jour lit pour annoncer la part en jeu : le thème des questions publiées, et les thèmes. */
export type PartEnJeu = { questions: Pick<Question, "numero" | "theme">[]; themes: Theme[] };

/**
 * « En jeu aujourd'hui » : quand répondre à cette question gagne la part de son thème (2 réponses sur 3),
 * le bloc l'annonce et mène à « Mes résultats ». Ce qu'il dit dans les autres cas reste à trancher.
 */
function EnJeu({ question, theme, enJeu, reponses }: { question: Question; theme: Theme; enJeu: PartEnJeu; reponses: Record<number, Reponse> }) {
  const parTheme = reponsesParTheme(enJeu.questions, reponses);
  const dansLeTheme = parTheme[theme.id] ?? 0;
  if (dansLeTheme !== REPONSES_PAR_PART - 1) return null;
  const gagnes = enJeu.themes.filter((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART);
  const part = enJeu.themes.findIndex((t) => t.id === question.theme);
  return (
    <Link className="stake" href="/resultats">
      <Camembert
        couleurs={enJeu.themes.map((t) => (gagnes.includes(t) ? couleurDe(t) : null))}
        enJeu={{ part, couleur: couleurDe(theme) }}
        description={`${gagnes.length} parts sur ${enJeu.themes.length}, la part ${theme.nom} est en jeu`}
      />
      <span>
        <span className="stake-k">Avec cette réponse</span>
        <span className="stake-t" style={{ display: "block" }}>
          La part {theme.nom}
        </span>
        <span className="stake-s" style={{ display: "block" }}>
          Ton camembert passe à{" "}
          <u>
            {gagnes.length + 1} parts sur {enJeu.themes.length}
          </u>
          .
        </span>
      </span>
    </Link>
  );
}

/**
 * Une fiche à répondre : la carte question, ses options et l'importance. Valider enregistre la réponse
 * et mène à `revelation` ; une fiche déjà répondue sur cet appareil y rouvre directement.
 */
export function Fiche({ question, theme, revelation, enJeu }: { question: Question; theme: Theme; revelation: string; enJeu?: PartEnJeu }) {
  const router = useRouter();
  const [etape, setEtape] = useState<"lire" | "repondre">("lire");
  const [choix, setChoix] = useState<string | null>(null);
  const [poids, setPoids] = useState<number | null>(null);
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = lesReponses(useCoteClient(lireReponses));
  const dejaRepondue = question.numero in reponses;

  useEffect(() => {
    if (dejaRepondue) router.replace(revelation);
  }, [dejaRepondue, revelation, router]);

  if (!jour || dejaRepondue) return null;

  /** Passer d'une étape à l'autre en repartant du haut de la page. */
  function allerA(suivante: "lire" | "repondre") {
    setEtape(suivante);
    window.scrollTo({ top: 0 });
  }

  // Une réponse se valide avec son importance ; « Je ne sais pas » n'en demande pas.
  const prete = choix === JE_NE_SAIS_PAS || (choix !== null && poids !== null);

  function valider(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!choix || !prete || !jour) return;
    enregistrerReponse(question.numero, { option: choix, importance: poids, graine: tirerGraine(), jour, rang: Object.keys(reponses).length + 1 });
    router.push(revelation);
  }

  return (
    <>
    <Bandeau jour={jour} question={question} />
    <main className={`today ${theme.classe} etape-${etape}`}>
      {etape === "lire" ? (
        <article className="ecran-partage" aria-labelledby="q" ref={tenirLEcranPartage}>
          <div className="scene">
            <div className="bloc">
              <PuceTheme theme={theme} />
              <h1 id="q">{question.question}</h1>
            </div>
            <div className="bobine">
              <VignetteVideo titre={question.titreCourt ?? theme.nom} video={question.video} />
            </div>
          </div>
          <div className="faits">
            <section aria-labelledby="contexte">
              <h2 id="contexte" className="sr">Le contexte</h2>
              <div className="context ctx">
                {question.contexte.map((phrase) => (
                  <p key={phrase}>{phrase}</p>
                ))}
              </div>
            </section>
            <section className="chiffres" aria-labelledby="chiffres">
              <div className="chiffres-tete">
                <h2 id="chiffres">Chiffres clés</h2>
                <Link className="drapeau" href={`/signaler?question=${question.numero}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 2a1 1 0 0 1 1 1v.6c1.6-.7 3.5-.9 5.6.1 2.3 1.1 4.3.9 6.6-.3a1 1 0 0 1 1.4.9v9.4a1 1 0 0 1-.5.9c-2.8 1.5-5.6 1.8-8.4.5-1.8-.8-3.3-.7-4.7.1V21a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1z" />
                  </svg>
                  Signaler une erreur
                </Link>
              </div>
              <ul className="figures">
                {question.chiffres.map((chiffre, rang) => (
                  // La source s'ouvre d'un geste, dans une bulle accrochée à son bouton (`--ancre`).
                  <li key={chiffre.legende} className="fig" style={{ "--ancre": `--source-${rang}` } as React.CSSProperties}>
                    <span className="fig-num">
                      {chiffre.valeur}
                      {chiffre.unite && <> <small>{chiffre.unite}</small></>}
                    </span>
                    <span className="fig-txt">{chiffre.legende}</span>
                    <button type="button" className="fig-voir-source" popoverTarget={`source-${rang}`} aria-label="Source">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M14 3v5h5M9.5 13h6M9.5 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="fig-src" id={`source-${rang}`} popover="auto">
                      Source : <b>{chiffre.source.organisme}, {chiffre.source.document && `${chiffre.source.document} `}{chiffre.source.annee}</b>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            {enJeu && <EnJeu question={question} theme={theme} enJeu={enJeu} reponses={reponses} />}
            <div className="actionbar">
              <button type="button" className="go" onClick={() => allerA("repondre")}>
                Voir les propositions
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      ) : (
        <form className="mosaique" onSubmit={valider} ref={tenirLaMosaique}>
          <header className="mq-tete">
            <div className="mq-meta">
              <PuceTheme theme={theme} />
              <button type="button" className="mq-contexte" onClick={() => allerA("lire")}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 12H5M11 5.5 4.5 12l6.5 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Le contexte
              </button>
            </div>
            <h1 id="q" className="mq-question">{question.question}</h1>
          </header>
          <nav className="mq-reperes" aria-label="Aller à une option">
            {question.options.map((option, rang) => (
              <a key={option.id} href={`#option-${option.id}`} className={choix === option.id ? "choisi" : undefined}>
                {lettreOption(rang)}
              </a>
            ))}
            <a href="#option-nsp" className={choix === JE_NE_SAIS_PAS ? "choisi" : undefined} aria-label="Je ne sais pas">?</a>
          </nav>
          <div className="mq-pile" role="radiogroup" aria-label="Les options">
            {question.options.map((option, rang) => (
              <label key={option.id} className="mq-tuile" id={`option-${option.id}`}>
                <input
                  type="radio"
                  name="choix"
                  value={option.id}
                  checked={choix === option.id}
                  onChange={() => setChoix(option.id)}
                  aria-labelledby={`lettre-${option.id} titre-${option.id}`}
                  aria-describedby={`implique-${option.id} defenseurs-${option.id} critiques-${option.id}`}
                />
                <span className="mq-face">
                  <span className="mq-haut">
                    <span className="mq-lettre" id={`lettre-${option.id}`} aria-hidden="true">{lettreOption(rang)}</span>
                    <span className="mq-titre" id={`titre-${option.id}`}>{option.libelle}</span>
                    <span className="mq-mienne">Ta carte</span>
                  </span>
                  <span className="mq-implique" id={`implique-${option.id}`}>{option.implique}</span>
                  <span className="mq-arguments">
                    <span className="mq-argument" id={`defenseurs-${option.id}`}>
                      <b>Ce qu&apos;en disent ses défenseurs</b>
                      {option.defenseurs}
                    </span>
                    <span className="mq-argument" id={`critiques-${option.id}`}>
                      <b>Ce que lui reprochent ses critiques</b>
                      {option.critiques}
                    </span>
                  </span>
                </span>
              </label>
            ))}
            <label className="mq-nsp" id="option-nsp">
              <input
                type="radio"
                name="choix"
                value={JE_NE_SAIS_PAS}
                checked={choix === JE_NE_SAIS_PAS}
                onChange={() => setChoix(JE_NE_SAIS_PAS)}
                aria-labelledby="titre-nsp"
              />
              <span>
                <i aria-hidden="true">?</i>
                <span id="titre-nsp">Je ne sais pas</span>
              </span>
            </label>
          </div>
          <div className="mq-decision">
            <fieldset className="mq-importance">
              <legend>Ce sujet compte pour toi&nbsp;?</legend>
              <div className="mq-niveaux">
                {IMPORTANCES.map((importance) => (
                  <label key={importance.poids} className="mq-niveau">
                    <input
                      type="radio"
                      name="poids"
                      value={importance.poids}
                      checked={poids === importance.poids}
                      onChange={() => setPoids(importance.poids)}
                    />
                    <span>
                      <b>×{importance.poids}</b> <em>{importance.libelle}</em>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="mq-valider" aria-disabled={!prete}>
              Valider ma réponse
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </main>
    </>
  );
}
