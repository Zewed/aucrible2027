"use client";

import { Camembert } from "@/components/Camembert";
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
