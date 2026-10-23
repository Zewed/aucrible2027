import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { lireAujourdhui } from "@/lib/publication";
import "../regles.css";
import "./methode.css";

/** Le dé à cinq points de l'en-tête des règles (maquettes/methode.html). */
function DeDesRegles() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="3" width="38" height="36" rx="9" style={{ fill: "var(--muted)" }} />
      <rect x="1" y="1" width="38" height="35" rx="9" style={{ fill: "var(--ink)" }} />
      {[
        [12, 10],
        [28, 10],
        [20, 18.5],
        [12, 27],
        [28, 27],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" style={{ fill: "var(--chalk)" }} />
      ))}
    </svg>
  );
}

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

const COULEURS = ["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"];

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

/**
 * La page « Méthode de calcul et sources » (maquettes/methode.html), règle par règle. Le sommaire « Aller à la règle »,
 * la version de la méthode et le pied de page ne sont portés par aucun ticket ; la règle n° 4 n'en a pas non plus ; les règles 5 à 8 viennent ensuite.
 */
async function Methode() {
  const jour = await lireAujourdhui();
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="leaf">
        <section className="leaf-hero" aria-labelledby="h-top">
          <div className="leaf-hero-in">
            <div>
              <p className="leaf-k">
                <DeDesRegles />
                Les règles du jeu
              </p>
              <h1 id="h-top">
                Méthode de calcul
                <br />
                et sources<span>.</span>
              </h1>
              <p className="lead">
                Comment tes réponses deviennent un pourcentage de proximité, d&apos;où viennent les positions des candidats, et qui a le
                droit d&apos;être dans le jeu. <b>Tout est publié, rien n&apos;est caché.</b>
              </p>
            </div>
            <Illustration />
          </div>
          <div className="stripes11" aria-hidden="true">
            {COULEURS.map((c) => (
              <i key={c} style={{ background: `var(--${c})` }}></i>
            ))}
          </div>
        </section>
        <div className="leaf-grid">
          <div className="rules">
            <RegleDuScore />
            <RegleDeLImportance />
            <RegleDesInconnues />
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
