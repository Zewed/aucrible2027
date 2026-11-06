"use client";

import Link from "next/link";
import { useState } from "react";
import { PREMIER_TOUR } from "@/components/CompteARebours";
import { Logo } from "@/components/Logo";
import { PartDuTheme, PuceTheme } from "@/components/PuceTheme";
import { StylesDeLaPage } from "@/components/StylesDeLaPage";
import type { Chiffre, Option, Question, Theme, VideoExplicative } from "@/lib/contenu";
import { joursEntre } from "@/lib/date";
import { SEUIL_DES_RESULTATS } from "@/lib/proximite";

/** La question tirée au hasard que la landing montre en exemple : sa vidéo, ses chiffres clés, ses options sans noms. */
export type Exemple = Pick<Question, "numero" | "question"> & {
  theme: Theme;
  chiffres: Chiffre[];
  options: Pick<Option, "id" | "libelle">[];
  video?: VideoExplicative;
};

/** Une landing n'a pas de menu : ni la colonne d'icônes, ni la jauge, ni le pied de page de l'app. */
const SANS_MENU = `
  :root { --jauge-h: 0px; }
  body { padding-left: 0; }
  .topbar, .jauge, .site-foot, body > .strip { display: none; }
`;

/** Les pions du plateau d'illustration : anonymes, retournés, posés sans rapport avec un vrai candidat. */
const PIONS = [
  [14, 30], [24, 62], [31, 18], [38, 78], [47, 50], [55, 24], [58, 66], [66, 46], [72, 14], [77, 80], [84, 36], [88, 62], [20, 84],
];

const Fleche = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
  </svg>
);

const Commencer = () => (
  <Link className="lp-go" href="/questionnaire">
    Commencer le questionnaire <Fleche />
  </Link>
);

/** Une vidéo sans le son peut démarrer seule : React ne pose pas `muted` dans le HTML, on le pose avant de la lancer. */
function lancerSansLeSon(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  video.play().catch(() => {});
}

/** Le téléphone du haut de page : la vidéo de la question tirée y tourne sans le son ; un bouton le met. */
function Telephone({ exemple }: { exemple: Exemple }) {
  const [son, setSon] = useState(false);
  return (
    <div className={`lp-scene ${exemple.theme.classe}`}>
      <div className="lp-tel">
        {exemple.video && (
          <>
            <video
              ref={lancerSansLeSon}
              src={exemple.video.url}
              autoPlay
              muted={!son}
              loop
              playsInline
              preload="auto"
              aria-label={`Vidéo : ${exemple.question}`}
            />
            <button type="button" className="lp-son" onClick={() => setSon(!son)} aria-pressed={son}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" style={{ fill: "currentColor" }} />
                {son ? (
                  <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" }} />
                ) : (
                  <path d="M16 9.5l5 5M21 9.5l-5 5" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" }} />
                )}
              </svg>
              {son ? "Couper le son" : "Mettre le son"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Le bandeau des questions, qui défile ; la liste est écrite deux fois pour boucler sans à-coup. */
function Defile({ questions, classe }: { questions: Pick<Question, "numero" | "theme" | "question">[]; classe: (id: string) => string }) {
  const liste = (cachee: boolean) => (
    <ul aria-hidden={cachee || undefined}>
      {questions.map((q) => (
        <li key={q.numero} className={classe(q.theme)}>
          <PartDuTheme />
          {q.question}
        </li>
      ))}
    </ul>
  );
  return (
    <section className="lp-defile" aria-label="Les questions" style={{ "--n": questions.length } as React.CSSProperties}>
      <div className="lp-defile-rail">
        {liste(false)}
        {liste(true)}
      </div>
    </section>
  );
}

/** Le haut de la carte d'une question : la pastille de son thème et la question. */
function HautDeCarte({ exemple }: { exemple: Exemple }) {
  return (
    <div className="lp-carte-haut">
      <PuceTheme theme={exemple.theme} />
      <p className="lp-carte-q">{exemple.question}</p>
    </div>
  );
}

/** Les chiffres clés de la question tirée, tels que la fiche les donne : chacun avec sa source. */
function ChiffresDeLExemple({ exemple }: { exemple: Exemple }) {
  return (
    <div className={`lp-carte ${exemple.theme.classe}`}>
      <HautDeCarte exemple={exemple} />
      <ul className="lp-chiffres">
        {exemple.chiffres.map((c) => (
          <li key={c.legende}>
            <b>
              {c.valeur}
              {c.unite && <small> {c.unite}</small>}
            </b>
            <span>{c.legende}</span>
            <small>
              {c.source.organisme}, {c.source.annee}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La carte de la question tirée : ses options mènent à sa fiche, et les pions des candidats restent retournés. */
function OptionsDeLExemple({ exemple, candidats }: { exemple: Exemple; candidats: number }) {
  return (
    <div className={`lp-pile ${exemple.theme.classe}`}>
      <div className="lp-carte">
        <HautDeCarte exemple={exemple} />
        <ul className="lp-options">
          {exemple.options.map(({ id, libelle }) => (
            <li key={id}>
              <Link href={`/question/${exemple.numero}`}>
                <span className="lp-lettre">{id}</span>
                {libelle}
              </Link>
            </li>
          ))}
        </ul>
        <p className="lp-pions" aria-label={`${candidats} candidats, retournés`}>
          {Array.from({ length: candidats }, (_, i) => (
            <span key={i} className="pawn pawn--paper" aria-hidden="true">
              ?
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/** Le plateau à deux axes, en illustration : ton pion, et des pions retournés qui ne sont aucun candidat. */
function PlateauDIllustration() {
  return (
    <div className="lp-plateau" role="img" aria-label="Une carte à deux axes, avec ton pion parmi ceux des candidats">
      <span className="lp-axe lp-axe-h" />
      <span className="lp-axe lp-axe-v" />
      <span className="lp-bord lp-haut">↑ progressiste</span>
      <span className="lp-bord lp-bas">↓ conservateur</span>
      <span className="lp-bord lp-gauche">← plus de redistribution</span>
      <span className="lp-bord lp-droite">plus de marché →</span>
      {PIONS.map(([x, y]) => (
        <span key={`${x}-${y}`} className="pawn pawn--paper" style={{ left: `${x}%`, top: `${y}%` }}>
          ?
        </span>
      ))}
      <span className="pawn pawn--you lp-toi" style={{ left: "40%", top: "34%" }}>
        Toi
      </span>
    </div>
  );
}

/**
 * La landing : ce que fait le site, montré plutôt qu'expliqué, et le bouton pour commencer. Sans menu : en haut, le seul
 * logo ; tout mène au questionnaire.
 */
export function Presentation({
  jour,
  candidats,
  themes,
  questions,
  exemple,
}: {
  jour: string;
  candidats: number;
  themes: Theme[];
  questions: Pick<Question, "numero" | "theme" | "question">[];
  exemple: Exemple | null;
}) {
  const classe = (id: string) => themes.find((t) => t.id === id)?.classe ?? "";
  const jours = joursEntre(jour, PREMIER_TOUR);

  return (
    <>
      <StylesDeLaPage>{SANS_MENU}</StylesDeLaPage>
      <main className="lp">
        <header className="lp-tete">
          <Link className="lp-marque" href="/">
            <Logo />
            <span>
              Au crible <b>2027</b>
            </span>
          </Link>
        </header>

        <section className="lp-heros">
          <div className="lp-heros-texte">
            <h1>
              Les sujets de la présidentielle, <span className="lp-mot">un par un.</span>
            </h1>
            <p className="lp-accroche">Tu choisis ta réponse avant de savoir quels candidats la défendent.</p>
            <div className="lp-actions">
              <Commencer />
              <p className="lp-rassure">Gratuit, sans compte et sans pub.</p>
            </div>
          </div>
          {exemple && <Telephone exemple={exemple} />}
        </section>

        <Defile questions={questions} classe={classe} />

        <section className="lp-etapes" aria-labelledby="lp-etapes-t">
          <h2 id="lp-etapes-t">Quelques minutes par question.</h2>
          {exemple && (
            <article className="lp-etape">
              <div className="lp-etape-texte">
                <span className="lp-n">1</span>
                <h3>Tu regardes la situation.</h3>
                <p>Une vidéo de quelques minutes pose le sujet. Les chiffres clés sont là, chacun avec sa source.</p>
              </div>
              <div className="lp-visuel">
                <ChiffresDeLExemple exemple={exemple} />
              </div>
            </article>
          )}
          {exemple && (
            <article className="lp-etape">
              <div className="lp-etape-texte">
                <span className="lp-n">2</span>
                <h3>Tu choisis, sans les noms.</h3>
                <p>
                  Trois à cinq réponses possibles, chacune avec les arguments de ses défenseurs et de ses critiques. Aucun nom de candidat
                  n&apos;apparaît.
                </p>
              </div>
              <div className="lp-visuel">
                <OptionsDeLExemple exemple={exemple} candidats={candidats} />
              </div>
            </article>
          )}
          <article className="lp-etape">
            <div className="lp-etape-texte">
              <span className="lp-n">3</span>
              <h3>Tu vois de qui tu es proche.</h3>
              <p>
                Les noms apparaissent dès ta réponse, chacun avec la source de sa position. Au bout de {SEUIL_DES_RESULTATS} réponses, tu as ton
                classement des {candidats} candidats et ta place sur une carte à deux axes.
              </p>
            </div>
            <div className="lp-visuel">
              <PlateauDIllustration />
            </div>
          </article>
        </section>

        <section className="lp-gages" aria-labelledby="lp-gages-t">
          <h2 id="lp-gages-t">Tu n&apos;as rien à croire sur parole.</h2>
          <dl>
            <div>
              <dt>Pas de compte.</dt>
              <dd>Tes réponses restent sur ton téléphone. Personne ne peut les lire.</dd>
            </div>
            <div>
              <dt>Pas de pub.</dt>
              <dd>Le site ne gagne rien, ni avec tes clics ni avec tes réponses.</dd>
            </div>
            <div>
              <dt>Tout est sourcé.</dt>
              <dd>
                Chaque chiffre et chaque position de candidat a sa source. La <Link href="/methode">méthode de calcul</Link> est publique.
              </dd>
            </div>
            <div>
              <dt>Les erreurs sont corrigées.</dt>
              <dd>
                Chaque erreur signalée est corrigée et notée dans un <Link href="/journal">journal public</Link>.
              </dd>
            </div>
          </dl>
          <p className="lp-signe">
            Un projet perso d&apos;Antoine, sans but lucratif. <Link href="/a-propos">À propos</Link>
          </p>
        </section>

        <section className="lp-fin theme-eco" aria-labelledby="lp-fin-t">
          <h2 id="lp-fin-t">{jours > 0 ? `J-${jours} avant le premier tour.` : "Les sujets de la présidentielle, un par un."}</h2>
          <div className="lp-actions">
            <Commencer />
            <Link className="lp-autre" href="/rattrapage">
              Ou choisis parmi les {questions.length} questions
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
