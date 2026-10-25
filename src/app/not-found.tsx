import Link from "next/link";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { lireAujourdhui } from "@/lib/publication";
import "./introuvable.css";

/** Le compte à rebours du bandeau, qui lit le jour de la requête. */
async function CompteDuJour() {
  return <CompteARebours jour={await lireAujourdhui()} />;
}

/**
 * La page introuvable (maquettes/introuvable.html) : une carte blanche, « Cette carte n'est pas dans le paquet. ». Elle
 * sert aux adresses qui n'existent pas comme aux fiches inconnues, et ramène aux questions. Les liens du bas
 * de la maquette sont ceux du pied de page commun.
 */
export default function Introuvable() {
  return (
    <>
      <div className="strip">
        <Suspense>
          <CompteDuJour />
        </Suspense>
        <span className="qnum">Erreur 404</span>
      </div>
      <main className="lost">
        <div className="deck">
          <article className="qcard blank" aria-labelledby="titre">
            <div className="qcard-top">
              <p className="theme-chip">
                <svg viewBox="0 0 100 100" className="slice" aria-hidden="true">
                  <path
                    d="M50 92L26.33 11.40A84 84 0 0 1 73.67 11.40Z"
                    style={{ fill: "var(--table-3)", stroke: "var(--chalk)", strokeWidth: 6, strokeLinejoin: "round", strokeDasharray: "9 7" }}
                  />
                </svg>
                Carte introuvable
              </p>
              <p className="digits" role="img" aria-label="Erreur 404">
                <span aria-hidden="true">4</span>
                <svg viewBox="0 0 200 200" aria-hidden="true">
                  <path d="M100.00 8.00A92 92 0 0 1 149.74 22.60L116.22 74.76A30 30 0 0 0 100.00 70.00Z" style={{ fill: "#fff" }} />
                  <path d="M149.74 22.60A92 92 0 0 1 183.69 61.78L127.29 87.54A30 30 0 0 0 116.22 74.76Z" style={{ fill: "#fff" }} />
                  <path d="M183.69 61.78A92 92 0 0 1 191.06 113.09L129.69 104.27A30 30 0 0 0 127.29 87.54Z" style={{ fill: "#fff" }} />
                  <path d="M191.06 113.09A92 92 0 0 1 169.53 160.25L122.67 119.65A30 30 0 0 0 129.69 104.27Z" style={{ fill: "#fff" }} />
                  <path d="M169.53 160.25A92 92 0 0 1 125.92 188.27L108.45 128.78A30 30 0 0 0 122.67 119.65Z" style={{ fill: "#fff" }} />
                  <path d="M125.92 188.27A92 92 0 0 1 74.08 188.27L91.55 128.78A30 30 0 0 0 108.45 128.78Z" style={{ fill: "#fff" }} />
                  <path d="M74.08 188.27A92 92 0 0 1 30.47 160.25L77.33 119.65A30 30 0 0 0 91.55 128.78Z" style={{ fill: "#fff" }} />
                  <path d="M30.47 160.25A92 92 0 0 1 8.94 113.09L70.31 104.27A30 30 0 0 0 77.33 119.65Z" style={{ fill: "#fff" }} />
                  <path d="M8.94 113.09A92 92 0 0 1 16.31 61.78L72.71 87.54A30 30 0 0 0 70.31 104.27Z" style={{ fill: "#fff" }} />
                  <path d="M16.31 61.78A92 92 0 0 1 50.26 22.60L83.78 74.76A30 30 0 0 0 72.71 87.54Z" style={{ fill: "#fff" }} />
                  <path d="M50.26 22.60A92 92 0 0 1 100.00 8.00L100.00 70.00A30 30 0 0 0 83.78 74.76Z" style={{ fill: "#fff" }} />
          <line x1="100.00" y1="68.00" x2="100.00" y2="6.00" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="117.30" y1="73.08" x2="150.82" y2="20.92" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="129.11" y1="86.71" x2="185.51" y2="60.95" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="131.67" y1="104.55" x2="193.04" y2="113.38" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="124.18" y1="120.96" x2="171.04" y2="161.56" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="109.02" y1="130.70" x2="126.48" y2="190.19" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="90.98" y1="130.70" x2="73.52" y2="190.19" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="75.82" y1="120.96" x2="28.96" y2="161.56" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="68.33" y1="104.55" x2="6.96" y2="113.38" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="70.89" y1="86.71" x2="14.49" y2="60.95" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
          <line x1="82.70" y1="73.08" x2="49.18" y2="20.92" style={{ stroke: "var(--ink)", strokeWidth: 6, strokeLinecap: "round" }} />
                  <circle cx="100" cy="100" r="93" style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 6 }} />
                  <circle cx="100" cy="100" r="30" style={{ fill: "var(--slot)", stroke: "var(--ink)", strokeWidth: 6 }} />
                </svg>
                <span aria-hidden="true">4</span>
              </p>
              <h1 id="titre">Cette carte n&apos;est pas dans le paquet.</h1>
            </div>
            <div className="qcard-body">
              <h2 className="label">
                <i></i>Que s&apos;est-il passé&nbsp;?
              </h2>
              <p className="context">
                L&apos;adresse que tu as ouverte n&apos;existe pas, ou la page a changé de place. Le reste du paquet, lui, est au
                complet.
              </p>
            </div>
          </article>
        </div>
        <Link className="go" href="/">
          Revenir aux questions{" "}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }} />
          </svg>
        </Link>
      </main>
    </>
  );
}
