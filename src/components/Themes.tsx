"use client";

import { Camembert } from "@/components/Camembert";
import { PartDuTheme } from "@/components/PuceTheme";
import type { Candidat, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { classement, REPONSES_PAR_PART, reponsesParTheme, type QuestionDuCalcul } from "@/lib/proximite";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Les réponses comptées de chaque thème, dans l'ordre des thèmes. */
function useReponsesDesThemes(questions: QuestionDuCalcul[], themes: Theme[]) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const parTheme = reponsesParTheme(questions, reponses);
  return themes.map((theme) => parTheme[theme.id] ?? 0);
}

/** Les thèmes dont la part est gagnée : 3 réponses comptées dans le thème. */
const useThemesGagnes = (questions: QuestionDuCalcul[], themes: Theme[]) =>
  useReponsesDesThemes(questions, themes).map((nombre) => nombre >= REPONSES_PAR_PART);

/** La couleur d'un thème, celle de sa part : `--eco` pour « theme-eco ». */
export const couleurDe = (theme: Theme) => `var(--${theme.classe.replace("theme-", "")})`;

/**
 * Le grand camembert en haut de « Mes résultats » : une part par thème, remplie quand elle est gagnée. Plein (11/11),
 * il devient un trophée : « Camembert complet » et des confettis aux couleurs des thèmes, que 10/11 n'a pas.
 */
export function GrandCamembert({ questions, themes }: { questions: QuestionDuCalcul[]; themes: Theme[] }) {
  const gagnes = useThemesGagnes(questions, themes);
  const nombre = gagnes.filter(Boolean).length;
  const complet = themes.length > 0 && nombre === themes.length;
  return (
    <div className={complet ? "trophy complet" : "trophy"}>
      {complet && (
        <span className="confetti" aria-hidden="true">
          {themes.map((theme, i) => (
            <i key={theme.id} style={{ left: `${4 + i * 8.7}%`, background: couleurDe(theme), animationDelay: `${(i % 4) * 0.12}s` }}></i>
          ))}
        </span>
      )}
      <div className="big-token">
        <Camembert
          grand
          interieur={34}
          couleurs={themes.map((theme, i) => (gagnes[i] ? couleurDe(theme) : null))}
          description={`Camembert : ${nombre} ${nombre > 1 ? "thèmes complétés" : "thème complété"} sur ${themes.length}`}
        />
        <span className="count" aria-hidden="true">
          <b>
            {nombre}/{themes.length}
          </b>
          <span>parts</span>
        </span>
      </div>
      {complet && <p className="earned">Camembert complet</p>}
    </div>
  );
}

/**
 * « Tes 11 thèmes » : chaque thème, à la couleur de sa part, avec une pastille par réponse. Un thème gagné
 * (3 réponses) nomme son candidat le plus proche, calculé comme le classement, sur ses seules questions.
 */
export function TesThemes({ questions, themes, candidats }: { questions: QuestionDuCalcul[]; themes: Theme[]; candidats: Candidat[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const nombres = useReponsesDesThemes(questions, themes);
  const lePlusProche = (theme: Theme) =>
    classement(
      questions.filter((q) => q.theme === theme.id),
      reponses,
      candidats,
    ).find((ligne) => ligne.pourcentage !== null)?.candidat;
  return (
    <section className="sec" aria-labelledby="h-game">
      <div className="sec-h">
        <h2 id="h-game">Tes {themes.length} thèmes</h2>
      </div>
      <ul className="themes">
        {themes.map((theme, i) => {
          const gagne = nombres[i] >= REPONSES_PAR_PART;
          const proche = gagne ? lePlusProche(theme) : undefined;
          return (
            <li key={theme.id} className={`th ${theme.classe}${gagne ? " done" : ""}`}>
              <PartDuTheme vide={!gagne} />
              <span className="th-name one">{theme.nom}</span>
              <span className="pips" aria-label={`${nombres[i]} ${nombres[i] > 1 ? "réponses" : "réponse"}`}>
                {Array.from({ length: REPONSES_PAR_PART }, (_, k) => (
                  <i key={k} style={k < nombres[i] ? { background: couleurDe(theme) } : undefined}></i>
                ))}
              </span>
              {gagne ? (
                proche && (
                  <span className="th-who one">
                    le plus proche : <b>{proche.nom}</b>
                  </span>
                )
              ) : (
                <span className="th-who one">pas encore assez de réponses</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
