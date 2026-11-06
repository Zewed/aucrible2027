import type { Metadata } from "next";
import { Suspense } from "react";
import { PageEnAttente } from "@/components/PageEnAttente";
import { Presentation } from "@/components/Presentation";
import { lireThemes, lireVideosVerrouillees } from "@/lib/contenu";
import { melanger, tirerGraine } from "@/lib/melange";
import { lireAujourdhui, lireCandidatsEnLice, lireQuestionsPubliees } from "@/lib/publication";
import "./presentation.css";

export const metadata: Metadata = {
  title: "Au crible 2027 : les sujets de la présidentielle, un par un",
  description: "Tu choisis ta réponse avant de savoir quels candidats la défendent. Gratuit, sans compte et sans pub.",
};

/**
 * La landing, pour qui arrive sans connaître le site. Les questions y défilent dans un ordre tiré au hasard, et
 * l'exemple est une question tirée au hasard parmi celles dont la vidéo est verrouillée : aucun sujet n'est mis en
 * avant plus qu'un autre.
 */
async function Contenu() {
  const [questions, candidats, jour] = await Promise.all([lireQuestionsPubliees(), lireCandidatsEnLice(), lireAujourdhui()]);
  const themes = lireThemes();
  const verrouillees = lireVideosVerrouillees();
  const melangees = melanger(questions, tirerGraine());
  const tiree = melangees.find((q) => q.video && verrouillees.includes(q.numero)) ?? melangees[0];
  const theme = tiree && themes.find((t) => t.id === tiree.theme);
  return (
    <Presentation
      jour={jour}
      candidats={candidats.length}
      themes={themes}
      questions={melangees.map(({ numero, theme, question }) => ({ numero, theme, question }))}
      exemple={
        tiree && theme
          ? {
              numero: tiree.numero,
              question: tiree.question,
              theme,
              chiffres: tiree.chiffres.slice(0, 3),
              options: tiree.options.map(({ id, libelle }) => ({ id, libelle })),
              video: tiree.video,
            }
          : null
      }
    />
  );
}

export default function PagePresentation() {
  return (
    <Suspense fallback={<PageEnAttente />}>
      <Contenu />
    </Suspense>
  );
}
