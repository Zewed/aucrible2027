"use client";

import Link from "next/link";
import { Camembert } from "@/components/Camembert";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { aujourdhuiAParis } from "@/lib/date";
import { classement, REPONSES_PAR_PART, reponsesComptees, reponsesParTheme, SEUIL_DES_RESULTATS, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";
import { joursDAffilee } from "@/lib/serie";

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

/**
 * Le pied de la carte : « 23 réponses · 5/11 thèmes · 6 jours d'affilée ». Toutes les réponses de
 * l'appareil, les parts gagnées, et la série ; sans série, la ligne s'en passe (à trancher).
 */
/** Les thèmes dont la part est gagnée, dans l'ordre des thèmes. */
function usePartsGagnees(questions: QuestionDuCalcul[], themes: Theme[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const parTheme = reponsesParTheme(questions, reponses);
  return themes.map((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART);
}

function usePiedDeCarte(questions: QuestionDuCalcul[], themes: Theme[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const jour = useCoteClient(() => aujourdhuiAParis());
  const nombre = Object.keys(reponses).length;
  const parTheme = reponsesParTheme(questions, reponses);
  const parts = themes.filter((t) => (parTheme[t.id] ?? 0) >= REPONSES_PAR_PART).length;
  const serie = jour ? joursDAffilee(Object.values(reponses), jour) : 0;
  return [
    `${nombre} ${nombre > 1 ? "réponses" : "réponse"}`,
    `${parts}/${themes.length} thèmes`,
    ...(serie > 0 ? [`${serie} ${serie > 1 ? "jours" : "jour"} d'affilée`] : []),
  ].join(" · ");
}

/** « Ta carte » sur « Mes résultats » : l'aperçu de la carte à partager, et ce qui l'ouvre. */
export function ApercuDeLaCarte({ questions, candidats, themes }: { questions: QuestionDuCalcul[]; candidats: Candidat[]; themes: Theme[] }) {
  const premier = usePremierDuClassement(questions, candidats);
  const pied = usePiedDeCarte(questions, themes);
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
          <p className="story-f">{pied}</p>
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
  const pied = usePiedDeCarte(questions, themes);
  const gagnees = usePartsGagnees(questions, themes);
  if (!premier) return null;
  const nombre = gagnees.filter(Boolean).length;
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
            <div className="sc-token">
              <Camembert
                interieur={34}
                couleurs={themes.map((theme, i) => (gagnees[i] ? couleurDe(theme) : null))}
                description={`Camembert : ${nombre} ${nombre > 1 ? "thèmes" : "thème"} sur ${themes.length}`}
              />
            </div>
            <p className="sc-f">{pied}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
