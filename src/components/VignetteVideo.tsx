"use client";

import { useState } from "react";
import type { VideoExplicative } from "@/lib/contenu";

/**
 * La vignette de la vidéo explicative : une affiche aux couleurs du thème, le sujet en quelques mots, un gros
 * bouton lecture. Avec une vidéo, toucher l'affiche la lance ; sans vidéo, l'affiche dit « Bientôt » et ne se
 * touche pas.
 */
export function VignetteVideo({ titre, video }: { titre: string; video?: VideoExplicative }) {
  const [lecture, setLecture] = useState(false);

  if (video && lecture) {
    return <video className="affiche" src={video.url} controls autoPlay aria-label={`Vidéo : ${titre}, ${video.duree}`} />;
  }

  const contenu = (
    <>
      <svg className="art" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="points-affiche" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle className="point" cx="2.5" cy="2.5" r="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="160" height="90" fill="url(#points-affiche)" />
        <g transform="rotate(-11 122 44)">
          <rect className="carte-bord" x="94" y="2" width="58" height="80" rx="7" transform="translate(2.4 3)" />
          <rect className="carte" x="94" y="2" width="58" height="80" rx="7" />
        </g>
        <rect className="talon" x="0" y="86.5" width="160" height="3.5" />
        <rect className="carte" x="0" y="86.5" width="42" height="3.5" />
      </svg>
      <span className="marque">Au crible 2027</span>
      <span className="sujet">{titre}</span>
      <span className="lecture" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 2.8v18.4c0 .8.9 1.3 1.6.9l15-9.2a1 1 0 0 0 0-1.8l-15-9.2C5.9 1.5 5 2 5 2.8z" />
        </svg>
      </span>
      <span className="duree">{video ? video.duree : "Bientôt"}</span>
    </>
  );

  return video ? (
    <button type="button" className="affiche" onClick={() => setLecture(true)} aria-label={`Lire la vidéo : ${titre}, ${video.duree}`}>
      {contenu}
    </button>
  ) : (
    <div className="affiche sans-video" role="img" aria-label={`Vidéo à venir : ${titre}`}>
      {contenu}
    </div>
  );
}
