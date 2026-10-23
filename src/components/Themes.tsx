"use client";

import { Camembert } from "@/components/Camembert";
import { PartDuTheme } from "@/components/PuceTheme";
import type { Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { REPONSES_PAR_PART, reponsesParTheme, type QuestionDuCalcul } from "@/lib/proximite";
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
const couleurDe = (theme: Theme) => `var(--${theme.classe.replace("theme-", "")})`;

/** Le grand camembert en haut de « Mes résultats » : une part par thème, remplie quand elle est gagnée. */
export function GrandCamembert({ questions, themes }: { questions: QuestionDuCalcul[]; themes: Theme[] }) {
  const gagnes = useThemesGagnes(questions, themes);
  const nombre = gagnes.filter(Boolean).length;
  return (
    <div className="trophy">
      <div className="big-token">
        <Camembert
          grand
          interieur={34}
          couleurs={themes.map((theme, i) => (gagnes[i] ? couleurDe(theme) : null))}
          description={`Camembert : ${nombre} ${nombre > 1 ? "thèmes complétés" : "thème complété"} sur ${themes.length}`}
        />
      </div>
    </div>
  );
}

/** « Tes 11 thèmes » : chaque thème, à la couleur de sa part, avec une pastille par réponse, gagnée à 3. */
export function TesThemes({ questions, themes }: { questions: QuestionDuCalcul[]; themes: Theme[] }) {
  const nombres = useReponsesDesThemes(questions, themes);
  return (
    <section className="sec" aria-labelledby="h-game">
      <div className="sec-h">
        <h2 id="h-game">Tes {themes.length} thèmes</h2>
        <p>{REPONSES_PAR_PART} réponses = 1 part</p>
      </div>
      <ul className="themes">
        {themes.map((theme, i) => {
          const gagne = nombres[i] >= REPONSES_PAR_PART;
          return (
            <li key={theme.id} className={`th ${theme.classe}${gagne ? " done" : ""}`}>
              <PartDuTheme vide={!gagne} />
              <span className="th-name one">{theme.nom}</span>
              <span className="pips" aria-label={`${nombres[i]} ${nombres[i] > 1 ? "réponses" : "réponse"}`}>
                {Array.from({ length: REPONSES_PAR_PART }, (_, k) => (
                  <i key={k} style={k < nombres[i] ? { background: couleurDe(theme) } : undefined}></i>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
