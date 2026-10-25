import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { Question, Theme } from "@/lib/contenu";
import { IMAGES } from "@/video/images";

/** Les images sont dessinées à 240 px de large, comme le storyboard : la vidéo les agrandit à 1080 px (× 4,5). */
const LARGEUR_DESSINEE = 240;

export type ProprietesDeLaVideo = { question: Question; theme: Theme };

/**
 * La vidéo verticale du jour (SPEC.md, « Réseaux sociaux ») : les 7 images du storyboard, chacune à sa place dans les
 * 75 secondes, tirées de la fiche. Sans voix : tout se lit à l'écran.
 */
export function VideoDuJour({ question, theme }: ProprietesDeLaVideo) {
  const { fps, width, height } = useVideoConfig();
  const echelle = width / LARGEUR_DESSINEE;
  return (
    <AbsoluteFill className={`video ${theme.classe}`}>
      {IMAGES.map(({ debut, fin, Dessin }) => (
        <Sequence key={debut} from={debut * fps} durationInFrames={(fin - debut) * fps}>
          <div className="video-cadre" style={{ width: LARGEUR_DESSINEE, height: height / echelle, transform: `scale(${echelle})` }}>
            <Dessin question={question} theme={theme} />
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
