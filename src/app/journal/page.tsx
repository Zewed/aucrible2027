import Link from "next/link";
import { Fragment, Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { DeDesRegles, RayuresDesThemes } from "@/components/Regles";
import { lireThemes, type Candidat, type CoteDeLaCorrection, type Correction } from "@/lib/contenu";
import { lireAujourdhui, lireLesCandidats, lireLesCorrections } from "@/lib/publication";
import "../regles.css";
import "./journal.css";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** L'illustration du haut de page : une page cochée (maquettes/journal.html). */
function Illustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 230 230">
        <g transform="rotate(-5 115 115)">
          <rect x="40" y="24" width="150" height="182" rx="14" style={{ fill: "#fff" }} />
          <rect x="40" y="24" width="30" height="182" rx="14" style={{ fill: "var(--ecol)" }} />
          <rect x="56" y="24" width="14" height="182" style={{ fill: "var(--ecol)" }} />
          <rect x="86" y="52" width="86" height="14" rx="4" style={{ fill: "var(--ink)" }} />
          <rect x="86" y="82" width="60" height="11" rx="4" style={{ fill: "var(--slot)" }} />
          <rect x="86" y="108" width="86" height="11" rx="4" style={{ fill: "var(--slot)" }} />
          <rect x="86" y="134" width="50" height="11" rx="4" style={{ fill: "var(--slot)" }} />
          <path
            d="M96 176l12 12 28-30"
            style={{ fill: "none", stroke: "var(--ecol)", strokeWidth: 9, strokeLinecap: "round", strokeLinejoin: "round" }}
          />
        </g>
      </svg>
    </div>
  );
}

/** Les espaces insécables du français, avant « : », « ? », « % ». */
const insecables = (texte: string) => texte.replace(/ ([:?%])/g, "\u00a0$1");

/** Un texte de correction, sa partie entre ==…== surlignée. */
function Surligne({ texte }: { texte: string }) {
  return insecables(texte)
    .split("==")
    .map((morceau, i) => (i % 2 === 1 ? <mark key={i}>{morceau}</mark> : morceau));
}

/** L'avant ou l'après d'une correction : rouge pour l'avant, vert pour l'après, comme la maquette (jamais une couleur de parti). */
function Cote({ titre, cote, classe }: { titre: string; cote: CoteDeLaCorrection; classe: string }) {
  return (
    <div className={classe}>
      <p className="diff-k">{titre}</p>
      <p className="val">
        <Surligne texte={cote.valeur} />
      </p>
      {cote.precision && (
        <p className="srcv">
          <Surligne texte={cote.precision} />
        </p>
      )}
    </div>
  );
}

const ORIGINES: Record<Correction["origine"], string> = {
  utilisateur: "Signalé par un utilisateur",
  controle: "Repéré par le contrôle de neutralité",
};

/** Les filtres du journal, dans l'ordre de la maquette ; un type sans correction garde son filtre, à 0 (à trancher). */
const FILTRES: [Correction["type"], string][] = [
  ["chiffre", "Chiffre"],
  ["position", "Position de candidat"],
  ["formulation", "Formulation"],
  ["source", "Source"],
];

const TYPES: Record<Correction["type"], string> = { chiffre: "Chiffre", position: "Position", formulation: "Formulation", source: "Source" };

/**
 * Une correction du journal : sa date en gros, son type et la fiche touchée (une question, ou la fiche d'un candidat
 * sur une question), puis l'avant et l'après, pourquoi, et qui l'a repérée.
 */
function Entree({ correction, rang, classe, candidat }: { correction: Correction; rang: number; classe?: string; candidat?: Candidat }) {
  const [annee, mois, jour] = correction.date.split("-");
  const { numero, titre } = correction.question;
  return (
    <li className={classe ? `entry ${classe}` : "entry"} data-type={correction.type}>
      <article aria-labelledby={`e${rang}`}>
        <header className="entry-top">
          <time className="date" dateTime={correction.date}>
            <b>{jour}</b>
            <span>
              {MOIS[Number(mois) - 1]} {annee}
            </span>
          </time>
          <div className="where">
            <p className="entry-k">
              <span className="type">{TYPES[correction.type]}</span>
              {candidat ? "Fiche candidat" : `Question n°\u00a0${numero}`}
            </p>
            <h2 id={`e${rang}`} className="entry-h">
              {candidat ? (
                <Link href={`/candidat/${candidat.id}`}>
                  <span className="pawn pawn--paper">{candidat.initiales}</span>
                  <span>{candidat.nom}</span>
                </Link>
              ) : (
                titre
              )}
            </h2>
            {candidat && (
              <p className="entry-sub">
                Question n°&nbsp;{numero} · {titre}
              </p>
            )}
          </div>
        </header>
        <div className="diff">
          <Cote titre="Avant" cote={correction.avant} classe="was theme-sante" />
          <Cote titre="Après" cote={correction.apres} classe="now theme-ecol" />
        </div>
        <dl className="why">
          <div>
            <dt>Pourquoi</dt>
            <dd>{insecables(correction.pourquoi)}</dd>
          </div>
          <div>
            <dt>Origine</dt>
            <dd>{ORIGINES[correction.origine]}</dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

/** Le journal sans aucune correction : il invite à signaler une erreur (maquettes/journal.html, l'état vide). */
function JournalVide() {
  return (
    <div className="empty">
      <svg viewBox="0 0 120 100" aria-hidden="true">
        <rect x="22" y="10" width="76" height="84" rx="10" style={{ fill: "#fff" }} />
        <rect x="22" y="10" width="16" height="84" rx="10" style={{ fill: "var(--ecol)" }} />
        <rect x="30" y="10" width="8" height="84" style={{ fill: "var(--ecol)" }} />
        <rect x="50" y="30" width="36" height="7" rx="3" style={{ fill: "var(--slot)" }} />
        <rect x="50" y="46" width="28" height="7" rx="3" style={{ fill: "var(--slot)" }} />
        <rect x="50" y="62" width="32" height="7" rx="3" style={{ fill: "var(--slot)" }} />
      </svg>
      <h3>Aucune correction pour l&apos;instant.</h3>
      <p>Tu as repéré une erreur&nbsp;?</p>
      <Link className="btn-link" href="/signaler">
        Signale-la{" "}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
        </svg>
      </Link>
    </div>
  );
}

/**
 * Le « Journal des corrections » (maquettes/journal.html) : le haut de page, puis les corrections, de la plus récente
 * à la plus ancienne, filtrables par type, ou l'invitation à signaler tant qu'il n'y en a aucune. Le bandeau de chiffres
 * et les liens du bas de page ne sont portés par aucun ticket.
 */
async function Journal() {
  const [jour, corrections, candidats] = await Promise.all([lireAujourdhui(), lireLesCorrections(), lireLesCandidats()]);
  const themes = lireThemes();
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="leaf">
        <section className="leaf-hero" aria-labelledby="h-top">
          <div className="leaf-hero-in">
            <div>
              <p className="leaf-k">
                <DeDesRegles />
                Transparence
              </p>
              <h1 id="h-top">
                Journal des
                <br />
                corrections<span>.</span>
              </h1>
              <p className="lead">
                Quand une erreur est repérée, elle est corrigée en public&nbsp;: la date, la fiche concernée, ce qui a changé,
                pourquoi, et qui l&apos;a repérée. Rien n&apos;est modifié en douce.
              </p>
              <p className="lead-note">
                <b>Les signalements arrivent dans une boîte privée</b>, seule la correction est publique. Réponse sous 72&nbsp;h.
              </p>
            </div>
            <Illustration />
          </div>
          <RayuresDesThemes />
        </section>
        <section className="log-sec" aria-labelledby="h-log">
          <div className="sec-h">
            <h2 id="h-log">Les corrections</h2>
            <p>la plus récente d&apos;abord</p>
          </div>
          {corrections.length === 0 ? (
            // Sans correction, ni filtres ni liste : les filtres à zéro n'apprendraient rien (à trancher).
            <JournalVide />
          ) : (
            <>
              {/* Le filtre de la maquette, sans script : le bouton coché masque, par la feuille de style, les autres types. */}
              <div className="jfilter" role="radiogroup" aria-label="Filtrer par type de correction">
                <input type="radio" name="type" id="f-all" defaultChecked />
                <label htmlFor="f-all">
                  Toutes <b>{corrections.length}</b>
                </label>
                {FILTRES.map(([type, nom]) => (
                  <Fragment key={type}>
                    <input type="radio" name="type" id={`f-${type}`} />
                    <label htmlFor={`f-${type}`}>
                      {nom} <b>{corrections.filter((c) => c.type === type).length}</b>
                    </label>
                  </Fragment>
                ))}
                <ol className="log">
                  {corrections.map((correction, i) => (
                    <Entree
                      key={i}
                      rang={i + 1}
                      correction={correction}
                      classe={themes.find((t) => t.id === correction.theme)?.classe}
                      candidat={candidats.find((c) => c.id === correction.candidat)}
                    />
                  ))}
                </ol>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default function PageJournal() {
  return (
    <Suspense>
      <Journal />
    </Suspense>
  );
}
