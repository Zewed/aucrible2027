"use client";

import Link from "next/link";
import { Camembert } from "@/components/Camembert";
import { CompteARebours } from "@/components/CompteARebours";
import { NumeroQuestion } from "@/components/NumeroQuestion";
import { PageEnAttente } from "@/components/PageEnAttente";
import { Pion } from "@/components/Pion";
import { PuceTheme } from "@/components/PuceTheme";
import { StylesDeLaPage } from "@/components/StylesDeLaPage";
import type { Candidat, Option, Position, Question, Theme } from "@/lib/contenu";
import { lettreOption } from "@/lib/lettres";
import { melanger } from "@/lib/melange";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { REPONSES_PAR_PART, reponsesParTheme } from "@/lib/proximite";
import { lireOrdre, prochaineQuestionDuTheme } from "@/lib/ordre";
import { messageDuPalier } from "@/lib/paliers";
import { JE_NE_SAIS_PAS, lesReponses, lireReponses } from "@/lib/reponses";
import { tenirALEcran } from "@/lib/tenir-a-l-ecran";

/**
 * Sur grand écran, la révélation tient dans la fenêtre : son texte se resserre s'il le faut, sans jamais grossir au-delà de
 * sa taille (7 novembre 2026 : « typo trop grosse »).
 */
const tenirLaRevelation = tenirALEcran("(min-width: 1100px)");

/**
 * Le statut d'une position, d'après sa source (SPEC.md, « Sources des positions des candidats ») : une petite pastille de
 * sa couleur au bout de la ligne du candidat (6 novembre 2026). Au survol de la pastille, ou d'un geste au toucher et au
 * clavier, une bulle accrochée à elle donne la phrase exacte qui fonde la position, sa source et le lien pour la lire.
 */
const CONFIANCE = {
  officielle: { niveau: 3, statut: "officielle" },
  deduite: { niveau: 2, statut: "déduite" },
  estimee: { niveau: 1, statut: "estimée" },
} as const;

const TRAIT = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Fleche() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" style={{ ...TRAIT, strokeWidth: 3 }} />
    </svg>
  );
}

function FlecheSortante() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 16L17 7M9 7h8v8" style={{ ...TRAIT, strokeWidth: 2.6 }} />
    </svg>
  );
}

/** Les bulles en train de se fermer : le temps d'aller de la pastille à la bulle, pour y suivre le lien. */
const fermetures = new Map<string, number>();

/** Le dernier pointeur posé sur une pastille : à la souris, le clic qui suit le survol ne doit pas refermer la bulle. */
let dernierPointeur = "";

/**
 * Un clic de souris sur une pastille dont le survol a déjà ouvert la bulle la garde ouverte : sans cela, le bouton la
 * refermerait aussitôt. Au toucher et au clavier, le bouton ouvre et ferme la bulle.
 */
const auClic = (id: string) => (e: React.MouseEvent) => {
  if (dernierPointeur === "mouse" && document.getElementById(id)?.matches(":popover-open")) e.preventDefault();
};

/** Au survol d'une souris seulement : au toucher, le geste ouvre et ferme déjà la bulle. */
const auSurvol = (id: string, dedans: boolean) => (e: React.PointerEvent) => {
  dernierPointeur = e.pointerType;
  if (e.pointerType !== "mouse") return;
  const bulle = document.getElementById(id);
  if (!bulle) return;
  clearTimeout(fermetures.get(id));
  if (dedans) {
    if (!bulle.matches(":popover-open")) bulle.showPopover();
    return;
  }
  fermetures.set(id, window.setTimeout(() => bulle.matches(":popover-open") && bulle.hidePopover(), 220));
};

function Confiance({ position, id }: { position: Position; id: string }) {
  const { niveau, statut } = CONFIANCE[position.statut];
  const ancre = { "--ancre": `--${id}` } as React.CSSProperties;
  return (
    <>
      <button
        type="button"
        className={`rev-conf rev-certitude--${niveau}`}
        style={ancre}
        popoverTarget={id}
        aria-label={`Position ${statut} : voir la citation et la source`}
        onPointerEnter={auSurvol(id, true)}
        onPointerLeave={auSurvol(id, false)}
        onPointerDown={(e) => (dernierPointeur = e.pointerType)}
        onClick={auClic(id)}
      >
        <i className="rev-point"></i>
      </button>
      <div className="rev-bulle" id={id} popover="auto" style={ancre} onPointerEnter={auSurvol(id, true)} onPointerLeave={auSurvol(id, false)}>
        <p className={`rev-bulle-tete rev-certitude--${niveau}`}>
          <i className="rev-point"></i>
          Position {statut}
        </p>
        {position.citation && <blockquote className="rev-bulle-citation">« {position.citation} »</blockquote>}
        <p className="rev-bulle-source">{position.source}</p>
        {position.lien && (
          <a className="rev-bulle-lien" href={position.lien} rel="noopener" target="_blank">
            Lire la source
            <span className="sr"> (nouvel onglet)</span>
            <FlecheSortante />
          </a>
        )}
      </div>
    </>
  );
}

/**
 * Une ligne du tableau : le pion du candidat, son nom, et au bout la pastille de sa position ; sans position, son nom seul.
 * Le nom tient sur une ligne, ou bien le prénom passe au-dessus du nom, en plus petit (7 novembre 2026) : il ne se coupe
 * jamais ailleurs qu'entre les deux.
 */
function Defenseur({ candidat, position }: { candidat: Candidat; position?: Position }) {
  const [prenom, ...nom] = candidat.nom.split(" ");
  return (
    <li className="def">
      <Pion candidat={candidat} clair={!position} />
      <span className="rev-qui">
        <Link className="def-name" href={`/candidat/${candidat.id}`}>
          <span className="rev-prenom">{prenom}</span> <span className="rev-nom">{nom.join(" ")}</span>
        </Link>
        {position && <Confiance position={position} id={`source-${candidat.id}`} />}
      </span>
    </li>
  );
}

/** La clé des pastilles, sur une ligne : « Position ● officielle ● déduite ● estimée ». */
function Legende() {
  return (
    <p className="rev-legende">
      <b>Position</b>
      {(["officielle", "deduite", "estimee"] as const).map((statut) => (
        <span key={statut} className={`rev-certitude--${CONFIANCE[statut].niveau}`}>
          <i className="rev-point"></i>
          {CONFIANCE[statut].statut}
        </span>
      ))}
    </p>
  );
}

/** Les liens pour aller plus loin, derrière un bouton qui les ouvre dans une fenêtre (6 novembre 2026). */
function VoirLesSources({ question }: { question: Question }) {
  if (!question.pourAllerPlusLoin?.length) return null;
  const id = "sources-de-la-question";
  return (
    <>
      <button type="button" className="rev-voir-sources" popoverTarget={id}>
        Sources
      </button>
      <div className="rev-sources" id={id} popover="auto" role="dialog" aria-labelledby={`${id}-titre`}>
        <div className="rev-sources-tete">
          <h2 id={`${id}-titre`}>Sources</h2>
          <button type="button" className="mq-fermer" popoverTarget={id} popoverTargetAction="hide" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul>
          {question.pourAllerPlusLoin.map((lien) => (
            <li key={lien.url}>
              <a href={lien.url} rel="noopener" target="_blank">
                {lien.titre}
                <span className="sr"> (nouvel onglet)</span>
                <FlecheSortante />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Drapeau({ question }: { question: Question }) {
  return (
    <Link className="drapeau rev-drapeau" href={`/signaler?question=${question.numero}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 2a1 1 0 0 1 1 1v.6c1.6-.7 3.5-.9 5.6.1 2.3 1.1 4.3.9 6.6-.3a1 1 0 0 1 1.4.9v9.4a1 1 0 0 1-.5.9c-2.8 1.5-5.6 1.8-8.4.5-1.8-.8-3.3-.7-4.7.1V21a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1z" />
      </svg>
      Signaler une erreur
    </Link>
  );
}

function Importance({ importance }: { importance: number }) {
  return (
    <span className="rev-imp">
      <span className="chips" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n > importance ? "off" : undefined}></i>
        ))}
      </span>
      Importance ×{importance}
    </span>
  );
}

/** Les confettis d'un palier, aux couleurs des thèmes (SPEC.md, « Paliers »). */
function Confettis({ themes }: { themes: Theme[] }) {
  return (
    <span className="confetti" aria-hidden="true">
      {themes.map((t, i) => (
        <i key={t.id} style={{ left: `${4 + i * 8.7}%`, background: `var(--${t.classe.replace("theme-", "")})`, animationDelay: `${(i % 4) * 0.12}s` }}></i>
      ))}
    </span>
  );
}

type Colonne = { option: Option; rang: number; leurs: Candidat[]; sienne: boolean };

const nombreDeCandidats = (n: number) => (n === 0 ? "Aucun candidat" : `${n} candidat${n > 1 ? "s" : ""}`);

/** Une colonne du tableau : l'option, puis ses candidats, du plus sûr au moins sûr. */
function ColonneDOption({ c, question, importance }: { c: Colonne; question: Question; importance: number | null }) {
  const lettre = lettreOption(c.rang);
  return (
    <article
      className={c.sienne ? "rev-col rev-col--sienne" : "rev-col"}
      style={{ "--i": c.rang } as React.CSSProperties}
      aria-labelledby={`o-${c.option.id}`}
    >
      <header className="rev-col-tete">
        <span className="rev-lettre" aria-hidden="true">
          {lettre}
        </span>
        <h3 className="rev-libelle" id={`o-${c.option.id}`}>
          <span className="sr">Option {lettre} : </span>
          {c.option.libelle}
        </h3>
        <p className="rev-compte">
          {c.sienne && <span className="rev-tag">Ta réponse</span>}
          {c.sienne && importance ? <Importance importance={importance} /> : null}
          <span>{nombreDeCandidats(c.leurs.length)}</span>
        </p>
      </header>
      <ul className="rev-defs">
        {c.leurs.map((candidat) => (
          <Defenseur key={candidat.id} candidat={candidat} position={question.positions[candidat.id]} />
        ))}
      </ul>
    </article>
  );
}

/** La dernière colonne, quand des candidats n'ont pas de source : « Pas de source à ce jour » est dit une fois, en tête. */
function ColonneInconnue({ inconnus, rang }: { inconnus: Candidat[]; rang: number }) {
  return (
    <article className="rev-col rev-col--inconnue" style={{ "--i": rang } as React.CSSProperties} aria-labelledby="o-inconnue">
      <header className="rev-col-tete">
        <span className="rev-lettre" aria-hidden="true">
          ?
        </span>
        <h3 className="rev-libelle" id="o-inconnue">
          Position inconnue
        </h3>
        <p className="rev-compte">
          <span>{nombreDeCandidats(inconnus.length)}</span>
          <span>Pas de source à ce jour</span>
        </p>
      </header>
      <ul className="rev-defs">
        {inconnus.map((candidat) => (
          <Defenseur key={candidat.id} candidat={candidat} />
        ))}
      </ul>
    </article>
  );
}

/**
 * La révélation de la `question` (6 novembre 2026) : la question en très grand, la suite à côté, puis un tableau en
 * colonnes, une par option, qui dit qui défend quoi ; ta colonne est pleine, à la couleur du thème. « Question suivante »
 * mène à la prochaine sans réponse dans l'ordre de l'appareil, tant qu'il en reste (SPEC.md, « Boucle principale »,
 * 25 octobre 2026). Venue d'un thème choisi dans la jauge (`filtre`), elle reste dans ce thème tant qu'il a des questions
 * sans réponse.
 */
export function Revelation({
  question,
  questions,
  candidats,
  themes,
  filtre = null,
}: {
  question: Question;
  /** Toutes les questions publiées, pour la suite et les parts : leur numéro et leur thème suffisent. */
  questions: Pick<Question, "numero" | "theme">[];
  candidats: Candidat[];
  themes: Theme[];
  filtre?: string | null;
}) {
  const jour = useCoteClient(() => aujourdhuiAParis());
  const reponses = lesReponses(useCoteClient(lireReponses));
  const numeros = questions.map((q) => q.numero);
  const ordre = useCoteClient(() => lireOrdre(numeros));
  const reponse = reponses[question.numero];
  const theme = themes.find((t) => t.id === question.theme);
  // Le rendu serveur ne connaît pas les réponses : la page garde sa place jusqu'au navigateur.
  if (!jour) return <PageEnAttente />;
  if (!reponse || !theme) return null;
  const suite = ordre ? prochaineQuestionDuTheme(ordre, questions, Object.keys(reponses).map(Number), filtre) : undefined;
  const suivante = suite?.numero;
  const palier = reponse.rang ? messageDuPalier(reponse.rang) : null;

  // Un candidat retiré au jour de la réponse ou avant n'est plus révélé. Rouvrir une révélation répondue avant
  // son retrait le montre encore : ce cas reste à trancher.
  const enLice = candidats.filter((c) => !c.retrait || c.retrait.date > reponse.jour);
  // Les candidats d'une option, du plus sûr au moins sûr (6 novembre 2026) ; à certitude égale, dans l'ordre mélangé.
  const certitude = (c: Candidat) => CONFIANCE[question.positions[c.id].statut].niveau;
  const colonnes: Colonne[] = question.options.map((option, rang) => ({
    option,
    rang,
    leurs: melanger(
      enLice.filter((c) => question.positions[c.id]?.option === option.id),
      reponse.graine + rang,
    ).sort((a, b) => certitude(b) - certitude(a)),
    sienne: option.id === reponse.option,
  }));
  const inconnus = melanger(
    enLice.filter((c) => !question.positions[c.id]),
    reponse.graine + question.options.length,
  );
  // Cette réponse est la 3e de son thème : la part est gagnée. Les autres cas restent à trancher.
  const parTheme = reponsesParTheme(questions, reponses);
  const partGagnee = reponse.option !== JE_NE_SAIS_PAS && parTheme[theme.id] === REPONSES_PAR_PART;
  const gagnes = themes.filter((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART);
  const couleurDe = (t: Theme) => `var(--${t.classe.replace("theme-", "")})`;

  return (
    <>
      {/* Comme sur la fiche, sur grand écran, le pied de page commun s'efface : la colonne d'icônes mène aux autres pages. */}
      <StylesDeLaPage>{"@media (min-width: 1100px) { .site-foot { display: none; } }"}</StylesDeLaPage>
      <div className="strip">
        <CompteARebours jour={jour} />
        <NumeroQuestion numero={question.numero} />
      </div>
      <main className={`rev ${theme.classe}`} ref={tenirLaRevelation}>
        <header className="rev-tete">
          <div className="rev-q">
            <div className="rev-meta">
              <PuceTheme theme={theme} />
              <Drapeau question={question} />
            </div>
            <h1>{question.question}</h1>
          </div>
          <div className="rev-suite">
            {suivante !== undefined ? (
              <>
                <Link className="go" href={suite?.dansLeTheme ? `/questionnaire?theme=${filtre}` : "/questionnaire"}>
                  Question suivante <Fleche />
                </Link>
                <Link className="rev-resultats" href="/resultats">
                  Résultats en cours
                </Link>
              </>
            ) : (
              <Link className="go" href="/resultats">
                Résultats <Fleche />
              </Link>
            )}
            {/* Ce que la réponse fait gagner : une ligne chacun ; un palier et le camembert complet ont leurs confettis. */}
            {palier && reponse.rang && (
              <div className="rev-gain palier" role="region" aria-label="Palier">
                <Confettis themes={themes} />
                <span className="palier-n">{reponse.rang}</span>
                <span>
                  <b>{reponse.rang} réponses</b>
                  {palier}
                </span>
              </div>
            )}
            {partGagnee && gagnes.length === themes.length && (
              <div className="rev-gain palier" role="region" aria-label="Camembert complet">
                <Confettis themes={themes} />
                <Camembert couleurs={themes.map((t) => couleurDe(t))} description={`Camembert complet : ${themes.length} parts sur ${themes.length}`} />
                <span>
                  <b>Camembert complet&nbsp;!</b>
                  {themes.length} parts sur {themes.length}
                </span>
              </div>
            )}
          </div>
        </header>
        <section className="rev-tableau" aria-labelledby="qui-defend-quoi" style={{ "--n": colonnes.length + (inconnus.length ? 1 : 0) } as React.CSSProperties}>
          <h2 id="qui-defend-quoi" className="sr">
            Qui défend quoi
          </h2>
          {colonnes.map((c) => (
            <ColonneDOption key={c.option.id} c={c} question={question} importance={reponse.importance} />
          ))}
          {inconnus.length > 0 && <ColonneInconnue inconnus={inconnus} rang={colonnes.length} />}
        </section>
        <footer className="rev-pied">
          <Legende />
          <VoirLesSources question={question} />
        </footer>
      </main>
    </>
  );
}
