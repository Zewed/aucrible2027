"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoExplicative } from "@/lib/contenu";

/** Sous cette largeur, l'affiche est une vignette à côté de la question : la vidéo s'ouvre en plein écran. */
const EN_VIGNETTE = "(max-width: 1199.98px)";

/**
 * La vignette de la vidéo explicative, debout comme la vidéo (9:16) : la carte du thème, un gros bouton lecture, le sujet
 * en quelques mots et la durée. Avec une vidéo, toucher l'affiche la lance ; en vignette, elle s'ouvre en plein écran, et
 * en sortir ramène l'affiche, la vidéo reprenant où elle s'était arrêtée. Sans vidéo, l'affiche dit « Bientôt » et ne se
 * touche pas.
 */
export function VignetteVideo({ titre, video }: { titre: string; video?: VideoExplicative }) {
  const [lecture, setLecture] = useState(false);
  const lecteur = useRef<HTMLVideoElement>(null);
  const reprise = useRef(0);

  useEffect(() => {
    const video = lecteur.current;
    if (!lecture || !video) return;
    // Quitter la page arrête la vidéo : le routeur garde parfois la page précédente en mémoire, cachée mais vivante.
    const arreter = () => video.pause();
    window.addEventListener("pagehide", arreter);
    const refermer = () => {
      reprise.current = video.ended ? 0 : video.currentTime;
      setLecture(false);
    };
    const surPleinEcran = () => {
      if (document.fullscreenElement !== video) refermer();
    };
    if (matchMedia(EN_VIGNETTE).matches) {
      video.addEventListener("fullscreenchange", surPleinEcran);
      // Sur iPhone, la vidéo passe d'elle-même en plein écran ; ailleurs, on le lui demande.
      video.addEventListener("webkitendfullscreen", refermer);
      video.requestFullscreen?.().catch(() => {});
    }
    return () => {
      window.removeEventListener("pagehide", arreter);
      video.removeEventListener("fullscreenchange", surPleinEcran);
      video.removeEventListener("webkitendfullscreen", refermer);
      arreter();
    };
  }, [lecture]);

  if (video && lecture) {
    return (
      <video
        ref={lecteur}
        className="affiche"
        src={video.url}
        controls
        autoPlay
        onLoadedMetadata={(evenement) => {
          evenement.currentTarget.currentTime = reprise.current;
        }}
        aria-label={`Vidéo : ${titre}, ${video.duree}`}
      />
    );
  }

  const contenu = (
    <>
      <svg className="art" viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="points-affiche" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle className="point" cx="2.5" cy="2.5" r="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="90" height="160" fill="url(#points-affiche)" />
        <g transform="rotate(-8 45 58)">
          <rect className="carte-bord" x="18" y="22" width="54" height="72" rx="7" transform="translate(2.4 3)" />
          <rect className="carte" x="18" y="22" width="54" height="72" rx="7" />
        </g>
        <rect className="talon" x="0" y="156.5" width="90" height="3.5" />
        <rect className="carte" x="0" y="156.5" width="24" height="3.5" />
      </svg>
      <span className="marque">Au crible 2027</span>
      <span className="lecture" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 2.8v18.4c0 .8.9 1.3 1.6.9l15-9.2a1 1 0 0 0 0-1.8l-15-9.2C5.9 1.5 5 2 5 2.8z" />
        </svg>
      </span>
      <span className="pied">
        <span className="sujet">{titre}</span>
        <span className="duree">{video ? video.duree : "Bientôt"}</span>
      </span>
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
