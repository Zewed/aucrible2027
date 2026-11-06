"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VideoExplicative } from "@/lib/contenu";

/** Sous cette largeur, l'affiche est une vignette à côté de la question : la vidéo s'ouvre en plein écran. */
const EN_VIGNETTE = "(max-width: 1199.98px)";

/**
 * La vignette de la vidéo explicative, debout comme la vidéo (9:16) : la carte du thème, un gros bouton lecture, le sujet
 * en quelques mots et la durée. Avec une vidéo, toucher l'affiche la lance ; en vignette, elle s'ouvre en plein écran, et
 * en sortir ramène l'affiche, la vidéo reprenant où elle s'était arrêtée. Sans vidéo, l'affiche dit « Bientôt » et ne se
 * touche pas. Une vidéo constat, dont on connaît les écrans, se lit comme une story ; une autre, avec les commandes du
 * navigateur.
 */
export function VignetteVideo({ titre, video }: { titre: string; video?: VideoExplicative }) {
  const [lecture, setLecture] = useState(false);
  const [enVignette, setEnVignette] = useState(false);
  const lecteur = useRef<HTMLVideoElement>(null);
  const [reprise, setReprise] = useState(0);

  useEffect(() => {
    const video = lecteur.current;
    if (!lecture || !video) return;
    // Quitter la page arrête la vidéo : le routeur garde parfois la page précédente en mémoire, cachée mais vivante.
    const arreter = () => video.pause();
    window.addEventListener("pagehide", arreter);
    const refermer = () => {
      setReprise(video.ended ? 0 : video.currentTime);
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

  /** La story refermée : l'affiche revient, et la vidéo reprendra là. */
  const refermer = (ou: number) => {
    setReprise(ou);
    setLecture(false);
  };

  if (video?.ecrans && lecture && !enVignette) {
    return <Story titre={titre} video={video} ecrans={video.ecrans} enVignette={false} depart={reprise} refermer={refermer} />;
  }
  if (video && !video.ecrans && lecture) {
    return (
      <video
        ref={lecteur}
        className="affiche"
        src={video.url}
        controls
        autoPlay
        onLoadedMetadata={(evenement) => {
          evenement.currentTarget.currentTime = reprise;
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
    <>
      <button
        type="button"
        className="affiche"
        onClick={() => {
          setEnVignette(matchMedia(EN_VIGNETTE).matches);
          setLecture(true);
        }}
        aria-label={`Lire la vidéo : ${titre}, ${video.duree}`}
      >
        {contenu}
      </button>
      {/* En vignette, la story couvre l'écran par-dessus la page, et l'affiche garde sa place dessous. */}
      {video.ecrans && lecture && createPortal(
        <Story titre={titre} video={video} ecrans={video.ecrans} enVignette depart={reprise} refermer={refermer} />,
        document.body,
      )}
    </>
  ) : (
    <div className="affiche sans-video" role="img" aria-label={`Vidéo à venir : ${titre}`}>
      {contenu}
    </div>
  );
}

/** Au-delà d'une seconde et demie dans un écran, revenir en arrière le reprend à son début plutôt qu'au précédent. */
const REPRENDRE_L_ECRAN = 1.5;
/** Rester appuyé ce temps-là, en millisecondes, met en pause au lieu de changer d'écran. */
const APPUI_LONG = 250;

/** Ce que la story retient d'une fiche à l'autre, dans le stockage local du navigateur : le son coupé, le défilement. */
const SON_COUPE = "aucrible:son-coupe";
const EN_DEFILEMENT = "aucrible:defilement";
const retenu = (cle: string) => {
  try {
    return localStorage.getItem(cle) === "oui";
  } catch {
    return false;
  }
};
const retenir = (cle: string, oui: boolean) => {
  try {
    if (oui) localStorage.setItem(cle, "oui");
    else localStorage.removeItem(cle);
  } catch {}
};

/** Dans le défilement, les quatre flèches du clavier passent à l'image suivante ou reviennent à la précédente. */
const FLECHES: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** L'écran où l'on est à cet instant de la vidéo, en secondes. */
const ecranA = (ecrans: number[], t: number) => {
  let i = 0;
  while (i < ecrans.length - 1 && ecrans[i + 1] <= t + 0.05) i++;
  return i;
};

/**
 * La vidéo constat lue comme une story, sans les commandes du navigateur : toucher à droite passe à l'écran suivant, à
 * gauche revient au précédent, rester appuyé met en pause, et les flèches du clavier font de même. Les tirets en haut de
 * la vidéo disent déjà où l'on en est. En haut à droite, on coupe le son, et, quand la fiche a les images de ses écrans,
 * on passe au défilement : la dernière image de chaque écran, l'une sous l'autre, le schéma fini et tout le texte. En
 * vignette, elle couvre l'écran ; la croix, Échap, la sortie du plein écran ou la fin de la vidéo ramènent l'affiche.
 */
function Story({
  titre,
  video,
  ecrans,
  enVignette,
  depart,
  refermer,
}: {
  titre: string;
  video: VideoExplicative;
  /** Le début de chaque écran, en secondes, la question comprise. */
  ecrans: number[];
  enVignette: boolean;
  /** Où reprendre la vidéo, en secondes. */
  depart: number;
  /** Refermer la story, en disant où la vidéo s'est arrêtée. */
  refermer: (ou: number) => void;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const appui = useRef({ minuteur: 0, tenu: false, ignorerLeClic: false });
  /** Où mettre la vidéo dès qu'elle sait sa durée : là où l'on reprend, ou l'écran que l'on regardait en images. */
  const reprise = useRef(depart);
  const [enPause, setEnPause] = useState(false);
  const [bloquee, setBloquee] = useState(false);
  const [muet, setMuet] = useState(() => retenu(SON_COUPE));
  const [defilement, setDefilement] = useState(() => Boolean(video.images) && retenu(EN_DEFILEMENT));
  /** L'image où s'ouvre le défilement : l'écran où en était la vidéo. */
  const [depuis, setDepuis] = useState(() => ecranA(ecrans, depart));

  /** L'image que l'on regarde dans le défilement. */
  const imageVue = () => {
    const l = liste.current;
    return l && l.clientHeight ? Math.min(ecrans.length - 1, Math.round(l.scrollTop / l.clientHeight)) : depuis;
  };

  const fermer = () => {
    const v = lecteur.current;
    if (defilement) refermer(ecrans[imageVue()]);
    else refermer(!v || v.ended ? 0 : v.currentTime);
  };

  const lire = (v: HTMLVideoElement) =>
    v.play().catch((erreur: DOMException) => {
      if (erreur.name === "NotAllowedError") setBloquee(true);
    });

  const passerAuDefilement = () => {
    const v = lecteur.current;
    v?.pause();
    setDepuis(ecranA(ecrans, v ? v.currentTime : depart));
    setEnPause(false);
    setBloquee(false);
    setDefilement(true);
    retenir(EN_DEFILEMENT, true);
  };
  const revenirALaVideo = () => {
    const v = lecteur.current;
    reprise.current = ecrans[imageVue()];
    setDefilement(false);
    retenir(EN_DEFILEMENT, false);
    if (!v) return;
    v.currentTime = reprise.current;
    lire(v);
  };

  const changerDEcran = (sens: 1 | -1) => {
    const v = lecteur.current;
    if (!v) return;
    const t = v.currentTime;
    const i = ecranA(ecrans, t);
    if (sens > 0 && i === ecrans.length - 1) {
      // Après la question, il n'y a plus d'écran : en vignette, on revient à la fiche ; sinon la vidéo s'arrête sur elle.
      if (enVignette) refermer(0);
      else if (Number.isFinite(v.duration)) {
        v.pause();
        v.currentTime = v.duration;
      }
      return;
    }
    v.currentTime = sens > 0 ? ecrans[i + 1] : t - ecrans[i] > REPRENDRE_L_ECRAN || i === 0 ? ecrans[i] : ecrans[i - 1];
    v.play().catch(() => {});
  };

  const appuyer = () => {
    clearTimeout(appui.current.minuteur);
    appui.current.ignorerLeClic = false;
    appui.current.minuteur = window.setTimeout(() => {
      appui.current.tenu = true;
      lecteur.current?.pause();
      setEnPause(true);
    }, APPUI_LONG);
  };
  const relacher = () => {
    clearTimeout(appui.current.minuteur);
    if (!appui.current.tenu) return;
    appui.current.tenu = false;
    appui.current.ignorerLeClic = true;
    lecteur.current?.play().catch(() => {});
    setEnPause(false);
  };
  // Le clic qui suit un appui long ne change pas d'écran : il ne faisait que relâcher la pause.
  const toucher = (sens: 1 | -1) => {
    if (appui.current.ignorerLeClic) appui.current.ignorerLeClic = false;
    else changerDEcran(sens);
  };

  const surTouche = useEffectEvent((evenement: KeyboardEvent) => {
    const sens = FLECHES[evenement.key];
    const l = liste.current;
    if (defilement && sens && l) {
      evenement.preventDefault();
      l.scrollTo({ top: (imageVue() + sens) * l.clientHeight });
    } else if (evenement.key === "ArrowRight" || evenement.key === "ArrowLeft") {
      evenement.preventDefault();
      changerDEcran(evenement.key === "ArrowRight" ? 1 : -1);
    } else if (evenement.key === "Escape" && enVignette) fermer();
  });
  const surPleinEcran = useEffectEvent(() => {
    if (document.fullscreenElement !== cadre.current) fermer();
  });
  const demarrer = useEffectEvent((v: HTMLVideoElement) => {
    if (!defilement) lire(v);
  });

  // Le défilement s'ouvre sur l'écran où en était la vidéo, sans glisser jusqu'à lui.
  useLayoutEffect(() => {
    const l = liste.current;
    if (defilement && l) l.scrollTo({ top: depuis * l.clientHeight, behavior: "instant" });
  }, [defilement, depuis]);

  useEffect(() => {
    const v = lecteur.current;
    const c = cadre.current;
    if (!v || !c) return;
    // Quitter la page arrête la vidéo : le routeur garde parfois la page précédente en mémoire, cachée mais vivante.
    // La lecture part du toucher de l'affiche ; un navigateur qui la refuse sans un toucher de plus montre le bouton lecture.
    demarrer(v);
    const arreter = () => v.pause();
    const touche = (evenement: KeyboardEvent) => surTouche(evenement);
    const pleinEcran = () => surPleinEcran();
    window.addEventListener("pagehide", arreter);
    document.addEventListener("keydown", touche);
    const html = document.documentElement;
    const debordement = html.style.overflow;
    if (enVignette) {
      // La page ne défile plus sous la story ; là où le navigateur le permet, elle passe aussi en plein écran.
      html.style.overflow = "hidden";
      c.addEventListener("fullscreenchange", pleinEcran);
      c.requestFullscreen?.().catch(() => c.removeEventListener("fullscreenchange", pleinEcran));
    }
    return () => {
      window.removeEventListener("pagehide", arreter);
      document.removeEventListener("keydown", touche);
      c.removeEventListener("fullscreenchange", pleinEcran);
      html.style.overflow = debordement;
      if (document.fullscreenElement === c) document.exitFullscreen().catch(() => {});
      arreter();
    };
  }, [enVignette]);

  return (
    <div ref={cadre} className={enVignette ? "affiche story-video en-vignette" : "affiche story-video"} role="group" aria-label={`Vidéo : ${titre}, ${video.duree}`}>
      <video
        ref={lecteur}
        src={video.url}
        playsInline
        muted={muet}
        preload={defilement ? "metadata" : "auto"}
        onLoadedMetadata={(evenement) => {
          evenement.currentTarget.currentTime = reprise.current;
        }}
        onEnded={() => {
          if (enVignette) fermer();
        }}
      />
      {defilement && video.images ? (
        <div ref={liste} className="defilement">
          {ecrans.map((_, i) => (
            // Les images sont déjà à la taille de la vidéo, en WebP : rien à faire passer par next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`${video.images}${String(i + 1).padStart(2, "0")}.webp`}
              alt={`Écran ${i + 1} sur ${ecrans.length}`}
              fetchPriority={i === depuis ? "high" : "auto"}
              draggable={false}
            />
          ))}
        </div>
      ) : (
        <>
          {([-1, 1] as const).map((sens) => (
            <button
              key={sens}
              type="button"
              className={sens < 0 ? "cote precedent" : "cote suivant"}
              aria-label={sens < 0 ? "Écran précédent" : "Écran suivant"}
              onPointerDown={appuyer}
              onPointerUp={relacher}
              onPointerLeave={relacher}
              onPointerCancel={relacher}
              onContextMenu={(evenement) => evenement.preventDefault()}
              onClick={() => toucher(sens)}
            >
              <span className="fleche" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d={sens < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
                </svg>
              </span>
            </button>
          ))}
          {enPause && (
            <span className="en-pause" aria-hidden="true">
              <span className="rond">
                <svg viewBox="0 0 24 24">
                  <rect x="5" y="4" width="5" height="16" rx="1" />
                  <rect x="14" y="4" width="5" height="16" rx="1" />
                </svg>
              </span>
            </span>
          )}
          {bloquee && (
            <button
              type="button"
              className="relancer"
              aria-label="Lire la vidéo"
              onClick={() => {
                setBloquee(false);
                if (lecteur.current) lire(lecteur.current);
              }}
            >
              <span className="rond" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 2.8v18.4c0 .8.9 1.3 1.6.9l15-9.2a1 1 0 0 0 0-1.8l-15-9.2C5.9 1.5 5 2 5 2.8z" />
                </svg>
              </span>
            </button>
          )}
        </>
      )}
      <div className="commandes">
        {!defilement && (
          <button
            type="button"
            className="outil"
            aria-label={muet ? "Remettre le son" : "Couper le son"}
            onClick={() => {
              setMuet(!muet);
              retenir(SON_COUPE, !muet);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path className="plein" d="M3.5 9.5h3.5l5-4.5v14l-5-4.5H3.5z" />
              <path d={muet ? "M16 9.5l5 5M21 9.5l-5 5" : "M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"} />
            </svg>
          </button>
        )}
        {video.images && (
          <button
            type="button"
            className="outil"
            aria-label={defilement ? "Revenir à la vidéo" : "Faire défiler les images"}
            onClick={defilement ? revenirALaVideo : passerAuDefilement}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {defilement ? (
                <path className="plein" d="M7.5 4.8v14.4c0 .7.8 1.2 1.4.8l11.2-7.2a1 1 0 0 0 0-1.6L8.9 4c-.6-.4-1.4.1-1.4.8z" />
              ) : (
                <>
                  <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
                  <circle className="plein" cx="9" cy="10" r="1.8" />
                  <path d="M4.5 17.5l5-5 4 4 2.5-2.5 4 4" />
                </>
              )}
            </svg>
          </button>
        )}
        {enVignette && (
          <button type="button" className="outil fermer" aria-label="Fermer la vidéo" onClick={fermer}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
