import "server-only";
import type { DonneesDeLaPresentation } from "@/components/Presentation";
import { lireThemes, lireVideosVerrouillees, type Question } from "@/lib/contenu";
import { melanger, tirerGraine } from "@/lib/melange";
import { lireAujourdhui, lireCandidatsEnLice } from "@/lib/publication";

/**
 * Ce que montre la landing, à partir des questions publiées. Elles y défilent dans un ordre tiré au hasard, et l'exemple
 * est une question tirée au hasard parmi celles dont la vidéo est verrouillée : aucun sujet n'est mis en avant plus
 * qu'un autre.
 */
export async function lireLaPresentation(questions: Question[]): Promise<DonneesDeLaPresentation> {
  const [candidats, jour] = await Promise.all([lireCandidatsEnLice(), lireAujourdhui()]);
  const themes = lireThemes();
  const verrouillees = lireVideosVerrouillees();
  const melangees = melanger(questions, tirerGraine());
  const tiree = melangees.find((q) => q.video && verrouillees.includes(q.numero)) ?? melangees[0];
  const theme = tiree && themes.find((t) => t.id === tiree.theme);
  return {
    jour,
    candidats: candidats.length,
    themes,
    questions: melangees.map(({ numero, theme, question }) => ({ numero, theme, question })),
    exemple:
      tiree && theme
        ? {
            numero: tiree.numero,
            question: tiree.question,
            theme,
            chiffres: tiree.chiffres.slice(0, 3),
            options: tiree.options.map(({ id, libelle }) => ({ id, libelle })),
            video: tiree.video,
          }
        : null,
  };
}
