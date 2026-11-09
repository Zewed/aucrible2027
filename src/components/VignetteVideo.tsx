"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VideoExplicative } from "@/lib/contenu";

/**
 * La vidéo explicative, pour aller plus loin : une petite carte, l'affiche en miniature (9:16, la carte du thème et le
 * bouton lecture) et, à côté, le sujet en quelques mots et la durée. La toucher ouvre la vidéo par-dessus la fiche, en
 * plein écran ; en sortir ramène la fiche, et la vidéo reprendra où elle s'était arrêtée. Sans vidéo, la carte dit
 * « Bientôt » et ne se touche pas. Une vidéo constat, dont on connaît les écrans, se lit comme une story ; une autre,
 * avec les commandes du navigateur.
 */
export function VignetteVideo({ titre, video }: { titre: string; video?: VideoExplicative }) {
  const [lecture, setLecture] = useState(false);
  const [reprise, setReprise] = useState(0);

  /** La vidéo refermée : la fiche revient, et la vidéo reprendra là. */
  const refermer = (ou: number) => {
    setReprise(ou);
    setLecture(false);
  };

  const carte = (
    <>
      <span className="affiche mini" aria-hidden="true">
        <Art />
        {video && (
          <span className="lecture">
            <svg viewBox="0 0 24 24">
              <path d="M5 2.8v18.4c0 .8.9 1.3 1.6.9l15-9.2a1 1 0 0 0 0-1.8l-15-9.2C5.9 1.5 5 2 5 2.8z" />
            </svg>
          </span>
        )}
      </span>
      <span className="vid-texte">
        <span className="vid-titre">{titre}</span>
        <span className="vid-duree">{video ? `Vidéo · ${video.duree}` : "Bientôt"}</span>
      </span>
    </>
  );

  return video ? (
    <>
      <button type="button" className="vid-carte" onClick={() => setLecture(true)} aria-label={`Lire la vidéo : ${titre}, ${video.duree}`}>
        {carte}
      </button>
      {lecture &&
        createPortal(
          video.ecrans ? (
            <Story titre={titre} video={video} ecrans={video.ecrans} depart={reprise} refermer={refermer} />
          ) : (
            <VideoSeule titre={titre} video={video} depart={reprise} refermer={refermer} />
          ),
          document.body,
        )}
    </>
  ) : (
    <div className="vid-carte sans-video" role="img" aria-label={`Vidéo à venir : ${titre}`}>
      {carte}
    </div>
  );
}

/** Le dessin de l'affiche : la carte du thème posée sur l'encre. */
function Art() {
  return (
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
  );
}

/**
 * Une vidéo dont on ne connaît pas les écrans : avec les commandes du navigateur, par-dessus la fiche et en plein écran.
 * La croix, Échap ou la sortie du plein écran ramènent la fiche.
 */
function VideoSeule({ titre, video, depart, refermer }: { titre: string; video: VideoExplicative; depart: number; refermer: (ou: number) => void }) {
  const cadre = useRef<HTMLDivElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const fermer = () => {
    const v = lecteur.current;
    refermer(!v || v.ended ? 0 : v.currentTime);
  };
  const surTouche = useEffectEvent((evenement: KeyboardEvent) => {
    if (evenement.key === "Escape") fermer();
  });
  const surPleinEcran = useEffectEvent(() => {
    if (!document.fullscreenElement) fermer();
  });

  useEffect(() => {
    const c = cadre.current;
    const v = lecteur.current;
    if (!c || !v) return;
    // Quitter la page arrête la vidéo : le routeur garde parfois la page précédente en mémoire, cachée mais vivante.
    const arreter = () => v.pause();
    const touche = (evenement: KeyboardEvent) => surTouche(evenement);
    const pleinEcran = () => surPleinEcran();
    window.addEventListener("pagehide", arreter);
    document.addEventListener("keydown", touche);
    // Sur iPhone, la vidéo passe d'elle-même en plein écran ; ailleurs, on le demande pour le cadre.
    v.addEventListener("webkitendfullscreen", pleinEcran);
    c.addEventListener("fullscreenchange", pleinEcran);
    c.requestFullscreen?.().catch(() => c.removeEventListener("fullscreenchange", pleinEcran));
    const html = document.documentElement;
    const debordement = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("pagehide", arreter);
      document.removeEventListener("keydown", touche);
      v.removeEventListener("webkitendfullscreen", pleinEcran);
      c.removeEventListener("fullscreenchange", pleinEcran);
      html.style.overflow = debordement;
      if (document.fullscreenElement === c) document.exitFullscreen().catch(() => {});
      arreter();
    };
  }, []);

  return (
    <div ref={cadre} className="affiche story-video" role="group" aria-label={`Vidéo : ${titre}, ${video.duree}`}>
      <video
        ref={lecteur}
        src={video.url}
        controls
        autoPlay
        playsInline
        onLoadedMetadata={(evenement) => {
          evenement.currentTarget.currentTime = depart;
        }}
      />
      <div className="commandes">
        <button type="button" className="outil fermer" aria-label="Fermer la vidéo" onClick={fermer}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
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
/** La part de la largeur, à gauche, où toucher revient en arrière : celle du bouton « Écran précédent ». */
const COTE_PRECEDENT = 0.3;
/** Un geste de la molette passe une image : les crans qui suivent de moins de ce temps, en millisecondes, n'y ajoutent rien. */
const GESTE_DE_MOLETTE = 200;

/** L'écran où l'on est à cet instant de la vidéo, en secondes. */
const ecranA = (ecrans: number[], t: number) => {
  let i = 0;
  while (i < ecrans.length - 1 && ecrans[i + 1] <= t + 0.05) i++;
  return i;
};

/**
 * La vidéo constat lue comme une story, sans les commandes du navigateur : toucher à droite passe à l'écran suivant, à
 * gauche revient au précédent, rester appuyé met en pause, et les flèches du clavier font de même. Les tirets en haut de
 * la vidéo disent déjà où l'on en est ; toucher l'un d'eux mène à son écran. En haut à droite, on coupe le son, et,
 * quand la fiche a les images de ses écrans, on passe au défilement : la dernière image de chaque écran, l'une à côté de
 * l'autre, le schéma fini et tout le texte, qui se touchent comme la vidéo et glissent aussi sous le doigt. Elle couvre
 * la fiche ; la croix, Échap, la sortie du plein écran, la fin de la vidéo ou passer la question ramènent la fiche.
 */
function Story({
  titre,
  video,
  ecrans,
  depart,
  refermer,
}: {
  titre: string;
  video: VideoExplicative;
  /** Le début de chaque écran, en secondes, la question comprise. */
  ecrans: number[];
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
  /** L'écran que l'on regarde, en vidéo ou en images : sur la question, il n'y a plus de tirets à toucher. */
  const [vu, setVu] = useState(depuis);
  /** Le côté du défilement sous la souris, où paraît la flèche : -1 à gauche, 1 à droite, 0 ailleurs. */
  const [survol, setSurvol] = useState<-1 | 0 | 1>(0);

  /** L'image que l'on regarde dans le défilement. */
  const imageVue = () => {
    const l = liste.current;
    return l && l.clientWidth ? Math.min(ecrans.length - 1, Math.round(l.scrollLeft / l.clientWidth)) : depuis;
  };
  const glisserA = (i: number) => {
    const l = liste.current;
    l?.scrollTo({ left: Math.max(0, i) * l.clientWidth });
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
    if (defilement) {
      const i = imageVue();
      // Après la question, on revient à la fiche, comme à la fin de la vidéo.
      if (sens > 0 && i === ecrans.length - 1) refermer(0);
      else glisserA(i + sens);
      return;
    }
    if (!v) return;
    const t = v.currentTime;
    const i = ecranA(ecrans, t);
    // Après la question, il n'y a plus d'écran : on revient à la fiche.
    if (sens > 0 && i === ecrans.length - 1) {
      refermer(0);
      return;
    }
    v.currentTime = sens > 0 ? ecrans[i + 1] : t - ecrans[i] > REPRENDRE_L_ECRAN || i === 0 ? ecrans[i] : ecrans[i - 1];
    v.play().catch(() => {});
  };

  /** Toucher un tiret : son écran, du début en vidéo. */
  const allerA = (i: number) => {
    const v = lecteur.current;
    if (defilement) glisserA(i);
    else if (v) {
      v.currentTime = ecrans[i];
      lire(v);
    }
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

  /** Où l'on touche le défilement : sur sa gauche, le précédent ; ailleurs, le suivant. */
  const coteDe = (evenement: { currentTarget: Element; clientX: number }) => {
    const boite = evenement.currentTarget.getBoundingClientRect();
    return evenement.clientX - boite.left < boite.width * COTE_PRECEDENT ? -1 : 1;
  };

  const surTouche = useEffectEvent((evenement: KeyboardEvent) => {
    const sens = FLECHES[evenement.key];
    if (defilement && sens) {
      evenement.preventDefault();
      changerDEcran(sens);
    } else if (evenement.key === "ArrowRight" || evenement.key === "ArrowLeft") {
      evenement.preventDefault();
      changerDEcran(evenement.key === "ArrowRight" ? 1 : -1);
    } else if (evenement.key === "Escape") fermer();
  });
  const surPleinEcran = useEffectEvent(() => {
    if (document.fullscreenElement !== cadre.current) fermer();
  });
  const demarrer = useEffectEvent((v: HTMLVideoElement) => {
    if (!defilement) lire(v);
  });

  // Les images glissent de côté : la molette, qui monte et descend, passe donc elle-même à l'image voisine, un geste
  // pour une image ; le glissé de côté du pavé tactile, lui, fait défiler de lui-même.
  const molette = useRef({ minuteur: 0, prete: true });
  const surMolette = useEffectEvent((evenement: WheelEvent) => {
    if (Math.abs(evenement.deltaY) <= Math.abs(evenement.deltaX)) return;
    evenement.preventDefault();
    const m = molette.current;
    clearTimeout(m.minuteur);
    m.minuteur = window.setTimeout(() => (m.prete = true), GESTE_DE_MOLETTE);
    if (!m.prete) return;
    m.prete = false;
    glisserA(imageVue() + Math.sign(evenement.deltaY));
  });
  useEffect(() => {
    const l = liste.current;
    if (!defilement || !l) return;
    const tourner = (evenement: WheelEvent) => surMolette(evenement);
    l.addEventListener("wheel", tourner, { passive: false });
    return () => l.removeEventListener("wheel", tourner);
  }, [defilement]);

  // Le défilement s'ouvre sur l'écran où en était la vidéo, sans glisser jusqu'à lui.
  useLayoutEffect(() => {
    const l = liste.current;
    if (defilement && l) l.scrollTo({ left: depuis * l.clientWidth, behavior: "instant" });
  }, [defilement, depuis]);

  useEffect(() => {
    const v = lecteur.current;
    const c = cadre.current;
    if (!v || !c) return;
    // Quitter la page arrête la vidéo : le routeur garde parfois la page précédente en mémoire, cachée mais vivante.
    // La lecture part du toucher de la carte ; un navigateur qui la refuse sans un toucher de plus montre le bouton lecture.
    demarrer(v);
    const arreter = () => v.pause();
    const touche = (evenement: KeyboardEvent) => surTouche(evenement);
    const pleinEcran = () => surPleinEcran();
    window.addEventListener("pagehide", arreter);
    document.addEventListener("keydown", touche);
    // La page ne défile plus sous la story ; là où le navigateur le permet, elle passe aussi en plein écran.
    const html = document.documentElement;
    const debordement = html.style.overflow;
    html.style.overflow = "hidden";
    c.addEventListener("fullscreenchange", pleinEcran);
    c.requestFullscreen?.().catch(() => c.removeEventListener("fullscreenchange", pleinEcran));
    return () => {
      window.removeEventListener("pagehide", arreter);
      document.removeEventListener("keydown", touche);
      c.removeEventListener("fullscreenchange", pleinEcran);
      html.style.overflow = debordement;
      if (document.fullscreenElement === c) document.exitFullscreen().catch(() => {});
      arreter();
    };
  }, []);

  return (
    <div ref={cadre} className="affiche story-video" role="group" aria-label={`Vidéo : ${titre}, ${video.duree}`}>
      <video
        ref={lecteur}
        src={video.url}
        playsInline
        muted={muet}
        preload={defilement ? "metadata" : "auto"}
        onLoadedMetadata={(evenement) => {
          evenement.currentTarget.currentTime = reprise.current;
        }}
        onTimeUpdate={(evenement) => {
          if (!defilement) setVu(ecranA(ecrans, evenement.currentTarget.currentTime));
        }}
        onEnded={fermer}
      />
      {defilement && video.images && (
        // Le doigt fait glisser les images ; toucher sans glisser fait comme sur la vidéo, que les côtés, laissés
        // dessous, ne reçoivent plus : ils ne gardent que le clavier.
        <div
          ref={liste}
          className="defilement"
          onScroll={() => setVu(imageVue())}
          onClick={(evenement) => changerDEcran(coteDe(evenement))}
          onPointerMove={(evenement) => {
            if (evenement.pointerType === "mouse") setSurvol(coteDe(evenement));
          }}
          onPointerLeave={() => setSurvol(0)}
        >
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
      )}
      {([-1, 1] as const).map((sens) => (
        <button
          key={sens}
          type="button"
          className={`cote ${sens < 0 ? "precedent" : "suivant"}${defilement && survol === sens ? " survole" : ""}`}
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
      {!defilement && (
        <>
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
      {/* Par-dessus les tirets de la vidéo et des images, un bouton par écran ; la question n'a pas de tiret. */}
      {vu < ecrans.length - 1 && (
        <div className="cadre">
          <div className="tirets">
            {ecrans.slice(0, -1).map((_, i) => (
              <button
                key={i}
                type="button"
                className="tiret"
                aria-label={`Aller à l'écran ${i + 1}`}
                aria-current={i === vu ? "step" : undefined}
                onClick={() => allerA(i)}
              />
            ))}
          </div>
        </div>
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
        <button type="button" className="outil fermer" aria-label="Fermer la vidéo" onClick={fermer}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
