import Link from "next/link";
import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { DeDesRegles, RayuresDesThemes } from "@/components/Regles";
import { lireThemes, type Candidat, type Correction } from "@/lib/contenu";
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

const TYPES: Record<Correction["type"], string> = { chiffre: "Chiffre", position: "Position", formulation: "Formulation", source: "Source" };

/**
 * Une correction du journal : sa date en gros, son type et la fiche touchée (une question, ou la fiche d'un candidat
 * sur une question). L'avant et l'après, la raison et l'origine : tickets 174 à 176.
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
      </article>
    </li>
  );
}

/**
 * Le « Journal des corrections » (maquettes/journal.html) : le haut de page, puis les corrections, de la plus récente
 * à la plus ancienne. Le bandeau de chiffres et les liens du bas de page ne sont portés par aucun ticket ; les filtres
 * (177) et le journal vide (178) viennent ensuite.
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
                Les règles du jeu · transparence
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
