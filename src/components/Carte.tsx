"use client";

import Link from "next/link";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, reponsesComptees, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** La couleur d'un thème : `--eco` pour « theme-eco ». */
const couleurDe = (theme: Theme) => `var(--${theme.classe.replace("theme-", "")})`;

/**
 * Le candidat le plus proche, celui que montre la carte : le premier du classement, à partir de
 * 10 réponses. Avant, la carte n'a rien à montrer (sa version verrouillée est un autre ticket).
 */
function usePremierDuClassement(questions: QuestionDuCalcul[], candidats: Candidat[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (reponsesComptees(questions, reponses) < SEUIL_DES_RESULTATS) return null;
  const premier = classement(questions, reponses, candidats)[0];
  return premier?.pourcentage === null ? null : premier;
}

/** « Ta carte » sur « Mes résultats » : l'aperçu de la carte à partager, et ce qui l'ouvre. */
export function ApercuDeLaCarte({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const premier = usePremierDuClassement(questions, candidats);
  if (!premier) return null;
  return (
    <section className="sec" aria-labelledby="h-share">
      <div className="sec-h">
        <h2 id="h-share">Ta carte</h2>
        <p>format story</p>
      </div>
      <div className="share" style={{ marginTop: 18 }}>
        <div className="story" aria-label="Aperçu de la carte à partager">
          <div className="stripes">
            {themes.map((theme) => (
              <i key={theme.id} style={{ background: couleurDe(theme) }}></i>
            ))}
          </div>
          <p className="story-k">Au crible 2027 · ma partie</p>
          <p className="story-big">
            {premier.pourcentage}
            <small>&nbsp;%</small>
          </p>
          <p className="story-t">
            Je suis à {premier.pourcentage}&nbsp;% proche de {premier.candidat.nom}.
          </p>
        </div>
        <div className="actions">
          <Link className="act primary" href="/carte">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 15V4M7 9l5-5 5 5M5 14v5h14v-5"
                style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            Partager ma carte
          </Link>
        </div>
      </div>
    </section>
  );
}

/** La carte à partager, version « avec mon candidat », sur la page « Ta carte ». */
export function CarteAvecCandidat({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const premier = usePremierDuClassement(questions, candidats);
  if (!premier) return null;
  return (
    <div className="sp-cards">
      <div className="sp-slot sp-slot--a">
        <div className="sc-deck sc-deck--a">
          <article className="sc sc--a" aria-label={`Carte à partager : ${premier.pourcentage} % proche de ${premier.candidat.nom}`}>
            <div className="sc-tiles" aria-hidden="true">
              {themes.map((theme) => (
                <i key={theme.id} style={{ background: couleurDe(theme) }}></i>
              ))}
            </div>
            <p className="sc-k">Au crible 2027 · ma partie</p>
            <p className="sc-big">
              {premier.pourcentage}
              <small>&nbsp;%</small>
            </p>
            <p className="sc-t">
              Je suis à {premier.pourcentage}&nbsp;% proche de <mark>{premier.candidat.nom}</mark>.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
