import Link from "next/link";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { PisteDuPlateau } from "@/components/PisteDuPlateau";
import { DeDesRegles, RayuresDesThemes } from "@/components/Regles";
import type { Candidat } from "@/lib/contenu";
import { melanger } from "@/lib/melange";
import { lireAujourdhui, lireCandidatsEnLice } from "@/lib/publication";
import "../regles.css";
import "./methode.css";

/** L'illustration du haut de page : une fiche, ses trois options, et un dé (maquettes/methode.html). */
function Illustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 230 230">
        <rect x="40" y="26" width="140" height="178" rx="14" transform="rotate(-6 110 115)" style={{ fill: "#fff" }} />
        <path d="M40 40a14 14 0 0 1 14-14h112a14 14 0 0 1 14 14v18H40Z" transform="rotate(-6 110 115)" style={{ fill: "var(--eco)" }} />
        <g transform="rotate(-6 110 115)" style={{ fill: "var(--ink)" }}>
          <rect x="58" y="74" width="26" height="26" rx="7" />
          <rect x="58" y="112" width="26" height="26" rx="7" />
          <rect x="58" y="150" width="26" height="26" rx="7" />
        </g>
        <g transform="rotate(-6 110 115)" style={{ fill: "var(--slot)" }}>
          <rect x="94" y="80" width="68" height="14" rx="4" />
          <rect x="94" y="118" width="52" height="14" rx="4" />
          <rect x="94" y="156" width="62" height="14" rx="4" />
        </g>
        <g transform="rotate(10 178 180)">
          <rect x="150" y="154" width="56" height="56" rx="13" style={{ fill: "var(--muted)" }} />
          <rect x="150" y="150" width="56" height="54" rx="13" style={{ fill: "var(--chalk)" }} />
          {[
            [165, 165],
            [191, 165],
            [178, 177],
            [165, 189],
            [191, 189],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" style={{ fill: "var(--ink)" }} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * Règle n° 1 : le score d'une question, sur une échelle (exemple de la question n° 24 sur la retraite) ou tout ou rien
 * quand les options ne se rangent pas. C'est la règle que suit `score` dans src/lib/proximite.ts.
 */
function RegleDuScore() {
  return (
    <article className="rule theme-trav" id="r1" aria-labelledby="r1-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          1
        </span>
        <p className="rule-k">Règle n° 1</p>
        <h2 id="r1-t">Chaque question donne un score entre 0 et 100&nbsp;%</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            Quand les options se rangent sur une échelle (des âges, des montants, plus ou moins), le score dit <b>à quelle distance</b>{" "}
            se trouvent ta carte et celle du candidat&nbsp;:
          </p>
          <p>
            <b>score = 1 − écart ÷ écart maximum</b>
          </p>
          <p>
            L&apos;écart se compte en crans d&apos;une option à l&apos;autre. L&apos;écart maximum, c&apos;est la distance entre les deux
            options les plus éloignées de la question.
          </p>
          <p>
            Quand les options ne se rangent pas (des choix de nature différente), c&apos;est tout ou rien&nbsp;:{" "}
            <b>1 si la carte est la même, 0 sinon.</b>
          </p>
          <p className="small">
            Une option hors échelle, comme « À la carte » dans la question n° 24, compte comme une option non ordonnée.
          </p>
        </div>
        <div>
          <figure className="demo" aria-label="Exemple de score sur la question de la retraite">
            <figcaption className="demo-k">
              <i></i>Exemple · question n° 24
            </figcaption>
            <p className="demo-q one">À quel âge partir à la retraite&nbsp;?</p>
            <div className="scale">
              <span className="mk" style={{ gridColumn: 2, gridRow: 1 }}>
                <span className="pawn pawn--you">TOI</span>
              </span>
              <span className="mk" style={{ gridColumn: 3, gridRow: 1 }}>
                <span className="pawn pawn--paper">C</span>
              </span>
              <span className="tile" style={{ gridColumn: 1, gridRow: 2 }}>
                <b>60</b>
                <small>ans</small>
              </span>
              <span className="tile on" style={{ gridColumn: 2, gridRow: 2 }}>
                <b>62</b>
                <small>ans</small>
              </span>
              <span className="tile on" style={{ gridColumn: 3, gridRow: 2 }}>
                <b>64</b>
                <small>ans</small>
              </span>
              <span className="tile" style={{ gridColumn: 4, gridRow: 2 }}>
                <b>65+</b>
                <small>ans ou plus</small>
              </span>
              <span className="brk" style={{ gridColumn: "2 / 4", gridRow: 3, "--in": "25%" } as React.CSSProperties}>
                <i></i>
                <em>écart&nbsp;: 1</em>
              </span>
              <span className="brk big" style={{ gridColumn: "1 / 5", gridRow: 4, "--in": "12.5%" } as React.CSSProperties}>
                <i></i>
                <em>écart maximum&nbsp;: 3</em>
              </span>
            </div>
            <ul className="key">
              <li>
                <span className="pawn pawn--you">TOI</span>
                <span>Ta carte&nbsp;: 62 ans</span>
              </li>
              <li>
                <span className="pawn pawn--paper">C</span>
                <span>Celle d&apos;un candidat&nbsp;: 64 ans</span>
              </li>
            </ul>
            {/* Une fraction se lit mal en morceaux : l'égalité est annoncée d'un bloc. */}
            <p className="eq" role="img" aria-label="1 moins 1 sur 3, soit environ 67 pour cent">
              1 −{" "}
              <span className="frac">
                <b>1</b>
                <b>3</b>
              </span>{" "}
              ≈ <mark>67&nbsp;%</mark>
            </p>
          </figure>
          <figure className="demo" style={{ marginTop: 14 }} aria-label="Exemple de score pour des options non ordonnées">
            <figcaption className="demo-k">
              <i></i>Options sans ordre
            </figcaption>
            <ul className="pairs">
              <li>
                <span className="lt">A</span>
                <span className="sg" aria-label="égale">
                  =
                </span>
                <span className="lt">A</span>
                <span className="res">
                  Même carte&nbsp;: <b>1</b> (100&nbsp;%)
                </span>
              </li>
              <li>
                <span className="lt">A</span>
                <span className="sg" aria-label="différente de">
                  ≠
                </span>
                <span className="lt">C</span>
                <span className="res">
                  Cartes différentes&nbsp;: <b>0</b>
                </span>
              </li>
            </ul>
          </figure>
        </div>
      </div>
    </article>
  );
}

const POIDS = [
  { poids: 1, nom: "Un peu" },
  { poids: 2, nom: "Beaucoup" },
  { poids: 3, nom: "Essentiel" },
];

/** Règle n° 2 : l'importance multiplie le score de la question, dans les points gagnés comme dans le maximum. */
function RegleDeLImportance() {
  return (
    <article className="rule theme-eco" id="r2" aria-labelledby="r2-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          2
        </span>
        <p className="rule-k">Règle n° 2</p>
        <h2 id="r2-t">Tu choisis ce qui compte&nbsp;: ×1, ×2 ou ×3</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            À chaque réponse, tu dis si le sujet compte <b>un peu (×1), beaucoup (×2) ou est essentiel (×3)</b>.
          </p>
          <p>
            Le score de la question est multiplié par ce poids. Un sujet ×3 pèse trois fois plus qu&apos;un sujet ×1, dans les points
            gagnés comme dans le maximum possible.
          </p>
          <p className="small">Le poids, c&apos;est ton choix à toi. Il ne dépend jamais du candidat.</p>
        </div>
        <figure className="demo" aria-label="Les trois poids et un exemple">
          <figcaption className="demo-k">
            <i></i>Le poids de la question
          </figcaption>
          <div className="imp-row">
            {POIDS.map(({ poids, nom }) => (
              <div key={poids} className={poids === 3 ? "imp-face on" : "imp-face"}>
                <span className="chips">
                  {Array.from({ length: poids }, (_, i) => (
                    <i key={i}></i>
                  ))}
                </span>
                <b>×{poids}</b>
                <span>{nom}</span>
                <small>
                  {poids} {poids > 1 ? "points" : "point"} max
                </small>
              </div>
            ))}
          </div>
          <p className="eq">
            67&nbsp;% × 3 = <mark>2 points sur 3</mark>
          </p>
          <p className="demo-cap">Même exemple que la règle 1, avec un sujet jugé essentiel.</p>
        </figure>
      </div>
    </article>
  );
}

/** L'exemple de la règle n° 3 : quatre questions d'un candidat, dont une sans source. */
const QUATRE_QUESTIONS = [
  { numero: 21, score: "80\u00a0%" },
  { numero: 22, score: "55\u00a0%" },
  { numero: 23, score: null },
  { numero: 24, score: "67\u00a0%" },
];

/** Règle n° 3 : une position inconnue sort du calcul pour ce candidat, comme le fait `classement`. */
function RegleDesInconnues() {
  return (
    <article className="rule theme-immi" id="r3" aria-labelledby="r3-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          3
        </span>
        <p className="rule-k">Règle n° 3</p>
        <h2 id="r3-t">Position inconnue&nbsp;: la question est sautée</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            Si on ne trouve aucune source pour la position d&apos;un candidat sur une question, elle est notée <b>«&nbsp;inconnue&nbsp;»</b>.
          </p>
          <p>
            Pour ce candidat, la question est <b>exclue du calcul</b>&nbsp;: elle ne lui donne aucun point et ne lui en retire aucun.
            Elle ne compte pas non plus dans le maximum possible.
          </p>
          <p>
            <b>On ne devine jamais.</b> Une case vide vaut mieux qu&apos;une case inventée.
          </p>
        </div>
        <figure className="demo" aria-label="Quatre questions, dont une inconnue">
          <figcaption className="demo-k">
            <i></i>Pour un candidat donné
          </figcaption>
          <ul className="cards4">
            {QUATRE_QUESTIONS.map(({ numero, score }) => (
              <li key={numero} className={score ? undefined : "void"}>
                <span className="q">Q. {numero}</span>
                <b>{score ?? "inconnue"}</b>
              </li>
            ))}
          </ul>
          <p className="demo-cap">
            <b>Comptées&nbsp;: 3 questions sur 4.</b> La case en pointillés disparaît du calcul.
          </p>
        </figure>
      </div>
    </article>
  );
}

/** L'exemple de la règle n° 5 : trois réponses et leur note sur l'axe économique, avec leur importance. */
const TROIS_NOTES = [
  { sujet: "Retraite\u00a0: 62 ans", note: "−1", poids: 3 },
  { sujet: "Droits de succession", note: "+2", poids: 1 },
  { sujet: "Fin de vie", note: null, poids: 2 },
];

/** Règle n° 5 : le plateau, la moyenne des notes pondérée par l'importance, comme `placeDeLElecteur`. */
function RegleDuPlateau() {
  return (
    <article className="rule theme-educ" id="r5" aria-labelledby="r5-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          5
        </span>
        <p className="rule-k">Règle n° 5</p>
        <h2 id="r5-t">Le plateau&nbsp;: deux axes, des notes de −2 à +2</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            Chaque option reçoit une note de <b>−2 à +2</b> sur l&apos;un des deux axes, ou <b>aucune note</b> si elle n&apos;a pas
            de rapport avec l&apos;axe.
          </p>
          <ul className="axes">
            <li>
              <b>Économie</b>
              <span>
                plus de redistribution <em>↔</em> plus de marché
              </span>
            </li>
            <li>
              <b>Société</b>
              <span>
                progressiste <em>↔</em> conservateur
              </span>
            </li>
          </ul>
          <p>
            Ta position sur un axe est la <b>moyenne de tes notes, pondérée par l&apos;importance</b> que tu as donnée. Les candidats
            sont placés par la même formule, à partir de leurs positions sourcées.
          </p>
          <p className="small">Les notes sont relues par le même contrôle de neutralité que les questions.</p>

          <div className="demo" style={{ marginTop: 16 }}>
            <p className="demo-k">
              <i></i>Exemple sur l&apos;axe économique
            </p>
            <div className="nscale" aria-hidden="true">
              <span className="nmark" style={{ left: "45%" }}>
                <span className="pawn pawn--you">TOI</span>
              </span>
              <ol>
                {["−2", "−1", "0", "+1", "+2"].map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
              <p>
                <span>redistribution</span>
                <span>marché</span>
              </p>
            </div>
            <ul className="nrows">
              {TROIS_NOTES.map(({ sujet, note, poids }) => (
                <li key={sujet} className={note ? undefined : "void"}>
                  <span className="nm one">{sujet}</span>
                  <b>{note ?? "aucune"}</b>
                  <span className="w">×{poids}</span>
                </li>
              ))}
            </ul>
            <p className="eq" role="img" aria-label="moins 1 fois 3 plus 2 fois 1, divisé par 3 plus 1, égale moins 0,25">
              <span className="frac">
                <b>−1×3 + 2×1</b>
                <b>3 + 1</b>
              </span>{" "}
              = <mark>−0,25</mark>
            </p>
            <p className="demo-cap">La question sans note est ignorée sur cet axe. Résultat&nbsp;: un peu côté redistribution.</p>
          </div>
        </div>
        <figure className="demo" aria-label="Le plateau avec ton pion">
          <figcaption className="demo-k">
            <i></i>Le plateau
          </figcaption>
          <div className="board" role="img" aria-label="Carte à deux axes : un pion TOI, légèrement côté redistribution et progressiste">
            <PisteDuPlateau />
            <div className="field">
              <span className="pawn pawn--you" style={{ "--x": "44%", "--y": "38%" } as React.CSSProperties}>
                TOI
              </span>
            </div>
            <span className="edge top">↑ progressiste</span>
            <span className="edge bottom">↓ conservateur</span>
            <span className="edge left">← plus de redistribution</span>
            <span className="edge right">plus de marché →</span>
          </div>
          <p className="demo-cap">Horizontalement, l&apos;économie. Verticalement, la société, notée de la même façon.</p>
        </figure>
      </div>
    </article>
  );
}

/** Les crans des sources, du plus sûr au moins sûr (SPEC.md, « Sources des positions des candidats »). */
const SOURCES = [
  { titre: "Le programme officiel 2027", precision: "Publié par le candidat ou son équipe.", officielle: true },
  { titre: "Une déclaration publique du candidat", precision: "Datée, de moins de 12 mois.", officielle: true },
  { titre: "Les votes de son groupe", precision: "À l'Assemblée nationale ou au Parlement européen.", officielle: false },
  { titre: "Le programme 2022 de son parti", precision: "Quand rien de plus récent n'existe.", officielle: false },
];

/** Règle n° 6 : la première source disponible fait la position, et son cran donne le badge. */
function RegleDesSources() {
  return (
    <article className="rule theme-sante" id="r6" aria-labelledby="r6-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          6
        </span>
        <p className="rule-k">Règle n° 6</p>
        <h2 id="r6-t">Chaque position a une source, classée par priorité</h2>
      </header>
      <div className="rule-body">
        <div className="rule-txt">
          <p>
            Pour coder la position d&apos;un candidat, on prend la <b>première source disponible</b> dans cet ordre&nbsp;:
          </p>
        </div>
        <ol className="ladder">
          {SOURCES.map(({ titre, precision, officielle }, rang) => (
            <li key={titre}>
              <span className="n">{rang + 1}</span>
              <span className="t">
                <b>{titre}</b>
                <small>{precision}</small>
              </span>
              <span className={officielle ? "src-badge off" : "src-badge ded"}>{officielle ? "position officielle" : "position déduite"}</span>
            </li>
          ))}
          <li className="none">
            <span className="n">?</span>
            <span className="t">
              <b>Aucune source</b>
              <small>Position «&nbsp;inconnue&nbsp;», sautée (règle 3).</small>
            </span>
            <span className="src-badge nil">pas de position</span>
          </li>
        </ol>
        <div className="rule-txt">
          <p>
            <b>Deux badges, deux niveaux de certitude.</b> Une position <b>officielle</b> a été écrite ou dite par le candidat pour
            2027. Une position <b>déduite</b> n&apos;a pas été dite telle quelle&nbsp;: on la déduit des votes de son groupe ou du
            programme 2022, et on la recode dès qu&apos;une déclaration arrive.
          </p>
          <p>
            <b>On ne devine jamais</b> et <b>on ne sollicite pas les équipes de campagne</b>&nbsp;: seules les sources publiques
            comptent.
          </p>
        </div>
        <figure className="demo" aria-label="Deux exemples de lignes de source">
          <figcaption className="demo-k">
            <i></i>Ce que tu vois sur chaque position
          </figcaption>
          <ul className="srclines">
            <li>
              <span className="src-badge off">position officielle</span>
              <span className="s">Programme 2027 · Retraites · 12/09/2026</span>
            </li>
            <li>
              <span className="src-badge ded">position déduite</span>
              <span className="s">Vote du groupe à l&apos;AN · réforme des retraites · 03/2023</span>
            </li>
          </ul>
          {/* La maquette ajoute « et mène à la source » : les sources ne sont pas encore des liens (à trancher, 007). */}
          <p className="demo-cap">Exemples. Chaque ligne a un titre court et une date.</p>
        </figure>
      </div>
    </article>
  );
}

/** Les trois critères d'entrée (SPEC.md, « Candidats ») et leur pictogramme. */
const CRITERES = [
  {
    trace: "M6 36a18 18 0 0 1 36 0M14 36a10 10 0 0 1 20 0M22 36a2 2 0 0 1 4 0",
    texte: (
      <>
        Son parti <b>dirige un groupe</b> à l&apos;Assemblée nationale ou au Parlement européen.
      </>
    ),
  },
  {
    trace: "M8 40V24M20 40V14M32 40V28M44 40H4",
    texte: (
      <>
        Il ou elle atteint <b>2,0&nbsp;% en moyenne</b> dans les enquêtes d&apos;intentions de vote des 30 derniers jours.
        <small>Pour chaque enquête, on fait la moyenne des scénarios où le candidat est testé.</small>
      </>
    ),
  },
  {
    trace: "M8 38l4-1 22-22a4 4 0 0 0-6-6L6 31zM28 12l6 6M26 40h16",
    texte: (
      <>
        Son parti avait obtenu <b>les 500 parrainages en 2022</b> (le parti lui-même, pas ses scissions).
      </>
    ),
  },
];

/**
 * Règle n° 7 : la règle d'entrée, puis la liste des candidats en lice, mélangée par le jour (le même ordre pour
 * tous dans la journée, sans rapport avec les intentions de vote), et la frise : recalcul du 1er du mois, liste
 * officielle, retrait, remplacement.
 */
function RegleDEntree({ candidats, jour }: { candidats: Candidat[]; jour: string }) {
  const nombre = `${candidats.length} candidat${candidats.length > 1 ? "s" : ""}`;
  return (
    <article className="rule theme-loge" id="r7" aria-labelledby="r7-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          7
        </span>
        <p className="rule-k">Règle n° 7</p>
        <h2 id="r7-t">Qui est dans la liste&nbsp;: {nombre}</h2>
      </header>
      <div className="rule-body">
        <div className="rule-txt">
          <p>
            <b>La règle d&apos;entrée est la même pour tous.</b> Il suffit de remplir <b>au moins un</b> des trois critères&nbsp;:
          </p>
        </div>
        <ul className="crit">
          {CRITERES.map(({ trace, texte }) => (
            <li key={trace}>
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d={trace} style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round", strokeLinejoin: "round" }} />
              </svg>
              <p>{texte}</p>
            </li>
          ))}
        </ul>

        <div className="demo">
          {/* La liste du lancement (SPEC.md) ; sa date suivra le recalcul du 1er du mois quand il existera. */}
          <p className="demo-k">
            <i></i>La liste au 23/10/2026 · {nombre}
          </p>
          <ul className="roster">
            {melanger(candidats, Number(jour.replaceAll("-", ""))).map((c) => (
              <li key={c.id}>
                <Link href={`/candidat/${c.id}`}>
                  <span className="pawn pawn--paper">{c.initiales}</span>
                  <span className="who">
                    <b>{c.nom}</b>
                    <small>{c.parti}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="demo-cap">
            Ordre mélangé, sans rapport avec les intentions de vote. Même pion pour tous. <b>Jean Lassalle</b> entrerait
            automatiquement s&apos;il se déclarait. Les Écologistes décident de la candidature de Marine Tondelier par un vote des
            adhérents, du 10 au 13 décembre.
          </p>
        </div>

        <div className="rule-txt">
          <p>
            <b>La liste vit jusqu&apos;au bout de la campagne&nbsp;:</b>
          </p>
        </div>
        <ol className="tl">
          <li>
            <span className="when">Le 1er de chaque mois</span>
            <span className="what">La liste est recalculée avec les trois critères. Un candidat entré reste jusqu&apos;à son retrait.</span>
          </li>
          <li>
            <span className="when">Vers le 16 mars 2027</span>
            <span className="what">
              Le Conseil constitutionnel publie la liste officielle. La nôtre bascule alors exactement sur les candidats officiels.
            </span>
          </li>
          <li>
            <span className="when">En cas de retrait</span>
            <span className="what">
              Le candidat sort du classement, avec la mention «&nbsp;X s&apos;est retiré·e le JJ/MM et soutient Y&nbsp;».
            </span>
          </li>
          <li>
            <span className="when">En cas de remplacement dans le même parti</span>
            <span className="what">
              La fiche est renommée. Les positions du parti restent «&nbsp;déduites&nbsp;», puis sont recodées au fil des déclarations
              du nouveau candidat.
            </span>
          </li>
        </ol>
      </div>
    </article>
  );
}

/**
 * Règle n° 8 : ce que le jeu n'est pas. Sa seconde colonne, « Tu peux tout vérifier » et le bouton vers le code,
 * attend l'adresse publique du dépôt (ticket 153) : d'ici là, la règle tient sur une colonne.
 */
function RegleDesLimites() {
  return (
    <article className="rule theme-inst" id="r8" aria-labelledby="r8-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          8
        </span>
        <p className="rule-k">Règle n° 8</p>
        <h2 id="r8-t">Ce que cet outil n&apos;est pas, et comment le vérifier</h2>
      </header>
      <div className="rule-body">
        <div className="rule-txt">
          <p className="stamp">
            <span>Ce n&apos;est pas un sondage.</span>
          </p>
          <p>
            <b>Les utilisateurs ne sont pas représentatifs, et on ne collecte pas tes réponses.</b> Aucune statistique sur les
            utilisateurs n&apos;est calculée ni publiée.
          </p>
          <p>
            Ton pourcentage n&apos;est pas une prévision de vote. Il dit seulement à quel point tes réponses rejoignent ce que défend
            chaque candidat, <b>sur les questions auxquelles tu as répondu</b>.
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * La page « Méthode de calcul et sources » (maquettes/methode.html), règle par règle. Le sommaire « Aller à la règle »,
 * la version de la méthode et le pied de page ne sont portés par aucun ticket ; la règle n° 4 n'en a pas non plus.
 */
async function Methode() {
  const [jour, candidats] = await Promise.all([lireAujourdhui(), lireCandidatsEnLice()]);
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="leaf">
        <section className="leaf-hero" aria-labelledby="h-top">
          <div className="leaf-hero-in">
            <div>
              <p className="leaf-k">
                <DeDesRegles />
                Les règles
              </p>
              <h1 id="h-top">
                Méthode de calcul
                <br />
                et sources<span>.</span>
              </h1>
              <p className="lead">
                Comment tes réponses deviennent un pourcentage de proximité, d&apos;où viennent les positions des candidats, et qui a le
                droit d&apos;être dans la liste. <b>Tout est publié, rien n&apos;est caché.</b>
              </p>
            </div>
            <Illustration />
          </div>
          <RayuresDesThemes />
        </section>
        <div className="leaf-grid">
          <div className="rules">
            <RegleDuScore />
            <RegleDeLImportance />
            <RegleDesInconnues />
            <RegleDuPlateau />
            <RegleDesSources />
            <RegleDEntree candidats={candidats} jour={jour} />
            <RegleDesLimites />
          </div>
        </div>
      </main>
    </>
  );
}

export default function PageMethode() {
  return (
    <Suspense>
      <Methode />
    </Suspense>
  );
}
