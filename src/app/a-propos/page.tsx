import Link from "next/link";
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
 * « À savoir n° 2 » : la neutralité se vérifie, et la page dit sans détour qu'il n'y a pas de relecture extérieure
 * (SPEC.md : « Ne jamais prétendre à une relecture externe »). « journal des corrections » deviendra un lien avec
 * le journal (ticket 172).
 */
function CommentCEstRelu() {
  return (
    <article className="rule theme-loge" id="r2" aria-labelledby="r2-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          2
        </span>
        <p className="rule-k">À savoir n° 2</p>
        <h2 id="r2-t">Neutre&nbsp;? Voilà ce qu&apos;on fait vraiment</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <blockquote className="quote">« J&apos;ai mes opinions comme tout le monde, c&apos;est justement pour ça que tout est sourcé. »</blockquote>
          <p>
            Je ne te demande pas de me croire. Je te demande de vérifier&nbsp;: chaque position de candidat a sa source, la{" "}
            <Link href="/methode">méthode de calcul</Link> est publique, l&apos;ordre des candidats est aléatoire, et chaque option est
            présentée avec l&apos;argument que ses propres défenseurs signeraient.
          </p>
          <p className="honest">
            <b>Ce que je ne prétends pas&nbsp;:</b> il n&apos;y a ni comité ni relecteur extérieur. Aujourd&apos;hui, c&apos;est relu
            par l&apos;auteur, contrôlé par une IA, et toute erreur signalée est corrigée publiquement. Si ça change, ce sera écrit ici.
          </p>
        </div>
        <figure className="demo" aria-label="Le contrôle avant publication, en quatre temps">
          <figcaption className="demo-k">
            <i></i>Avant chaque publication
          </figcaption>
          <ol className="flow">
            <li>
              <span className="n">1</span>
              <span className="t">
                <b>Un premier jet</b>
                <small>L&apos;IA rédige à partir de sources officielles.</small>
              </span>
            </li>
            <li>
              <span className="n">2</span>
              <span className="t">
                <b>Relu par l&apos;auteur</b>
                <small>Je vérifie chaque chiffre et chaque position de candidat.</small>
              </span>
            </li>
            <li>
              <span className="n">3</span>
              <span className="t">
                <b>Contrôle de neutralité par IA</b>
                <small>
                  Trois points de vue relisent&nbsp;: formulations orientées, arguments manquants, chiffres sans source, options
                  caricaturées. Je tranche sur chaque remarque.
                </small>
                <ul className="pov" aria-label="Les trois points de vue">
                  <li>Droite</li>
                  <li>Centre</li>
                  <li>Gauche</li>
                </ul>
              </span>
            </li>
            <li>
              <span className="n">4</span>
              <span className="t">
                <b>Après publication</b>
                <small>Toute erreur signalée est corrigée publiquement, dans le journal des corrections.</small>
              </span>
            </li>
          </ol>
        </figure>
      </div>
    </article>
  );
}

/**
 * « À savoir n° 3 » : aucun compte, les réponses ne quittent pas le téléphone. Le bouton « Changer d'appareil » de
 * la maquette n'est porté par aucun ticket (sa page d'arrivée est le 179).
 */
function OnNeSaitPas() {
  return (
    <article className="rule theme-secu" id="r3" aria-labelledby="r3-t">
      <header className="rule-head">
        <span className="rule-n" aria-hidden="true">
          3
        </span>
        <p className="rule-k">À savoir n° 3</p>
        <h2 id="r3-t">On ne sait pas pour qui tu votes</h2>
      </header>
      <div className="rule-body split">
        <div className="rule-txt">
          <p>
            <b>Il n&apos;y a pas de compte</b>&nbsp;: ni e-mail, ni mot de passe, ni pseudo. Tes réponses restent <b>sur ton téléphone</b>
            , dans ton navigateur. Elles ne sont envoyées nulle part, donc personne ne peut les lire, moi non plus.
          </p>
          <p>
            Une opinion politique est une donnée sensible (RGPD, article 9)&nbsp;: le plus sûr est de ne pas la collecter. Ce n&apos;est
            pas un sondage&nbsp;: voir la <Link href="/methode#r8">règle 8 de la méthode</Link>.
          </p>
          <p className="small">
            Sans compte, c&apos;est toi qui emportes ta partie. Si tu vides les données de ton navigateur, elle disparaît.
          </p>
        </div>
        <figure className="demo" aria-label="Tes réponses restent sur ton téléphone et ne vont pas vers un serveur">
          <figcaption className="demo-k">
            <i></i>Où vont tes réponses
          </figcaption>
          <div className="route">
            <div className="node">
              <svg viewBox="0 0 80 110" aria-hidden="true">
                <rect x="8" y="4" width="64" height="102" rx="12" style={{ fill: "var(--ink)" }} />
                <rect x="14" y="14" width="52" height="80" rx="5" style={{ fill: "#fff" }} />
                <circle cx="40" cy="44" r="15" style={{ fill: "var(--secu)" }} />
                <path d="M40 44L40 29A15 15 0 0 1 53 36.5Z" style={{ fill: "var(--eco)" }} />
                <path d="M40 44L53 36.5A15 15 0 0 1 53 51.5Z" style={{ fill: "var(--ecol)" }} />
                <circle cx="40" cy="44" r="5" style={{ fill: "#fff" }} />
                <rect x="29" y="71" width="22" height="16" rx="3" style={{ fill: "var(--ink)" }} />
                <path d="M33 71v-5a7 7 0 0 1 14 0v5" style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 3.4 }} />
              </svg>
              <b>Ton téléphone</b>
              <small>tes réponses restent ici</small>
            </div>
            <div className="cut" aria-hidden="true">
              <svg viewBox="0 0 70 40">
                <path d="M2 20h66" style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeDasharray: "3 7", strokeLinecap: "round" }} />
                <circle cx="35" cy="20" r="14" style={{ fill: "var(--ink)" }} />
                <path d="M29 14l12 12M41 14L29 26" style={{ fill: "none", stroke: "var(--chalk)", strokeWidth: 3.4, strokeLinecap: "round" }} />
              </svg>
            </div>
            <div className="node dim">
              <svg viewBox="0 0 80 110" aria-hidden="true">
                {[12, 44, 76].map((y) => (
                  <rect
                    key={y}
                    x="10"
                    y={y}
                    width="60"
                    height="26"
                    rx="6"
                    style={{ fill: "none", stroke: "var(--ink-soft)", strokeWidth: 3.4, strokeDasharray: "6 5" }}
                  />
                ))}
              </svg>
              <b>Un serveur</b>
              <small>n&apos;en reçoit aucune</small>
            </div>
          </div>
        </figure>
      </div>
    </article>
  );
}

/**
 * La page « À propos » (maquettes/a-propos.html), section par section. Les sections 4 et 5 viennent avec les
 * tickets 158 et 159 ; la phrase « Tout ce qui suit est vérifiable… » et ses liens ne sont portés par aucun ticket.
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
            <CommentCEstRelu />
            <OnNeSaitPas />
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
