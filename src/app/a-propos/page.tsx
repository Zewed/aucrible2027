import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { DeDesRegles, RayuresDesThemes } from "@/components/Regles";
import { lireAujourdhui } from "@/lib/publication";
import "../regles.css";
import "./a-propos.css";

/** L'illustration du haut de page : une carte de visite à l'initiale de l'auteur (maquettes/a-propos.html). */
function Illustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 230 230">
        <g transform="rotate(5 115 115)">
          <rect x="24" y="52" width="182" height="122" rx="16" style={{ fill: "#fff" }} />
          <rect x="24" y="52" width="182" height="26" rx="16" style={{ fill: "var(--soc)" }} />
          <rect x="24" y="64" width="182" height="14" style={{ fill: "var(--soc)" }} />
          <circle cx="68" cy="124" r="25" style={{ fill: "var(--ink)" }} />
          <text x="68" y="133" textAnchor="middle" style={{ font: "800 26px var(--display)", fill: "var(--chalk)" }}>
            A
          </text>
          <rect x="106" y="108" width="80" height="13" rx="4" style={{ fill: "var(--ink)" }} />
          <rect x="106" y="130" width="58" height="11" rx="4" style={{ fill: "var(--slot)" }} />
          <rect x="106" y="148" width="68" height="11" rx="4" style={{ fill: "var(--slot)" }} />
        </g>
      </svg>
    </div>
  );
}

/** Les cinq sections de la page, pour « Aller à ». */
const SOMMAIRE = ["Qui", "Neutralité", "Vie privée", "IA", "Suite"];

/** Les trois sceaux de la carte de visite, et leur pictogramme. */
const SCEAUX = [
  {
    nom: "Non lucratif",
    dessin: (
      <>
        <circle cx="20" cy="20" r="14" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4 }} />
        <path
          d="M20 12v16M15 16.5c0-2 2-3.2 5-3.2s5 1.2 5 3.2c0 5-10 2.6-10 7.6 0 2 2 3.4 5 3.4s5-1.2 5-3.4"
          style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" }}
        />
      </>
    ),
  },
  {
    nom: "Sans pub",
    dessin: (
      <>
        <rect x="5" y="8" width="30" height="24" rx="5" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4 }} />
        <path d="M9 34L31 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round" }} />
      </>
    ),
  },
  {
    nom: "Sans compte",
    dessin: (
      <>
        <circle cx="20" cy="14" r="6.5" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4 }} />
        <path d="M7 35c1-8 6-11 13-11s12 3 13 11" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round" }} />
        <path d="M6 6l28 28" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round" }} />
      </>
    ),
  },
];

/** « À savoir n° 1 » : qui fait l'app, sans but lucratif ni pub, et sa carte de visite. */
function QuiFaitLApp() {
  return (
    <article className="rule theme-eco" id="r1" aria-labelledby="r1-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          1
        </span>
        <p className="rule-k">À savoir n° 1</p>
        <h2 id="r1-t">Qui fait Au crible 2027&nbsp;?</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            <b>Je m&apos;appelle Antoine.</b> Au crible 2027 est un projet perso, fait par une seule personne.
          </p>
          <p>
            Il n&apos;y a <b>pas de but lucratif</b> et <b>pas de pub</b>&nbsp;: le site ne gagne rien, ni avec tes clics, ni avec tes
            réponses.
          </p>
          <p>
            L&apos;idée&nbsp;: une question politique par jour, expliquée en trois minutes avec de vrais chiffres, pour t&apos;aider à
            voir où tu te situes, sans qu&apos;on te fasse la leçon.
          </p>
        </div>
        <figure className="demo" aria-label="Carte de visite du projet">
          <figcaption className="demo-k">
            <i></i>La carte de visite
          </figcaption>
          <p className="sign">
            <b>Antoine</b>
            <small>auteur, affiché publiquement</small>
          </p>
          <ul className="seals">
            {SCEAUX.map(({ nom, dessin }) => (
              <li key={nom}>
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  {dessin}
                </svg>
                <b>{nom}</b>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </article>
  );
}

/**
 * La page « À propos » (maquettes/a-propos.html), section par section. Les sections 2 à 5 viennent avec les
 * tickets 156 à 159 ; la phrase « Tout ce qui suit est vérifiable… » et ses liens ne sont portés par aucun ticket.
 */
async function APropos() {
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
                Les règles du jeu · le mot de l&apos;auteur
              </p>
              <h1 id="h-top" style={{ "--lines": 1 } as React.CSSProperties}>
                À propos<span>.</span>
              </h1>
              <p className="lead">
                Une personne, un projet perso, et des règles écrites noir sur blanc pour que tu n&apos;aies pas à me croire sur parole.
              </p>
            </div>
            <Illustration />
          </div>
          <RayuresDesThemes />
        </section>
        <div className="leaf-grid">
          <nav className="toc-box" aria-label="Sur cette page">
            <p className="toc-h">Aller à</p>
            <ol className="toc">
              {SOMMAIRE.map((entree, i) => (
                <li key={entree}>
                  <a href={`#r${i + 1}`}>
                    <b>{i + 1}</b>
                    {entree}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="rules">
            <QuiFaitLApp />
          </div>
        </div>
      </main>
    </>
  );
}

export default function PageAPropos() {
  return (
    <Suspense>
      <APropos />
    </Suspense>
  );
}
