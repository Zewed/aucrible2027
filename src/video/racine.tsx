import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/instrument-sans/standard.css";
import { Composition, registerRoot } from "remotion";
import "@/app/kit.css";
import "@/app/visuels.css";
import "@/app/video/video.css";
import "@/video/video.css";
import "@/video/reportage/reportage.css";
import type { ProprietesDeLaVideo } from "@/video/VideoDuJour";
import { VideoDuJour } from "@/video/VideoDuJour";
import { DUREE } from "@/video/images";
import { dureeDu, Reportage, type ProprietesDuReportage } from "@/video/reportage/Reportage";

const IMAGES_PAR_SECONDE = 30;

/**
 * Le point d'entrée de Remotion : une seule composition, la vidéo du jour, en 1080 × 1920. La fiche arrive par ses
 * propriétés, que `pnpm video` lit dans content/questions (scripts/video.mts).
 */
function Racine() {
  return (
    <>
    <Composition
      id="video-du-jour"
      component={VideoDuJour}
      width={1080}
      height={1920}
      fps={IMAGES_PAR_SECONDE}
      durationInFrames={DUREE * IMAGES_PAR_SECONDE}
      defaultProps={{} as ProprietesDeLaVideo}
    />
    <Composition
      id="reportage"
      component={Reportage}
      width={1920}
      height={1080}
      fps={IMAGES_PAR_SECONDE}
      durationInFrames={IMAGES_PAR_SECONDE}
      defaultProps={{} as ProprietesDuReportage}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(dureeDu(props.question, props.musique) * IMAGES_PAR_SECONDE) })}
    />
    </>
  );
}

registerRoot(Racine);
