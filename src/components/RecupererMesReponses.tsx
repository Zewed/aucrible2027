"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

/**
 * La carte 2 de « Changer d'appareil » : sur le nouvel appareil, « Scanner un QR code » ouvre l'appareil photo et lit
 * le QR code de l'ancien ; son adresse (`/i#…`) importe les réponses. Rien ne passe par un serveur : l'image est lue
 * dans la page.
 */
export function RecupererMesReponses() {
  const [flux, setFlux] = useState<MediaStream | null>(null);
  const [refus, setRefus] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  async function scanner() {
    setRefus(false);
    try {
      setFlux(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }));
    } catch {
      setRefus(true);
    }
  }

  // Tant que l'appareil photo filme, chaque image est lue ; le premier QR code d'une adresse de transfert l'emporte.
  useEffect(() => {
    if (!flux || !video.current) return;
    const lecteur = video.current;
    lecteur.srcObject = flux;
    void lecteur.play();
    const toile = document.createElement("canvas");
    let suivante = 0;
    const lire = () => {
      if (lecteur.videoWidth > 0) {
        toile.width = lecteur.videoWidth;
        toile.height = lecteur.videoHeight;
        const dessin = toile.getContext("2d", { willReadFrequently: true })!;
        dessin.drawImage(lecteur, 0, 0);
        const code = jsQR(dessin.getImageData(0, 0, toile.width, toile.height).data, toile.width, toile.height);
        if (code?.data.startsWith(`${location.origin}/i#`)) {
          flux.getTracks().forEach((piste) => piste.stop());
          location.assign(code.data);
          return;
        }
      }
      suivante = requestAnimationFrame(lire);
    };
    suivante = requestAnimationFrame(lire);
    return () => {
      cancelAnimationFrame(suivante);
      flux.getTracks().forEach((piste) => piste.stop());
    };
  }, [flux]);

  return (
    <section className="app-card theme-eco" aria-labelledby="h-get" id="recuperer">
      <div className="app-card-top">
        <p className="app-kick">
          <span className="app-step" aria-hidden="true">
            2
          </span>
          <span className="app-where">Sur le nouvel appareil</span>
        </p>
        <h2 id="h-get">Récupérer mes réponses</h2>
      </div>
      <div className="app-card-body">
        {flux ? (
          <video ref={video} className="cam" muted playsInline aria-label="L'appareil photo"></video>
        ) : (
          <button className="go scan-first" type="button" onClick={scanner}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16" />
            </svg>
            Scanner un QR code
          </button>
        )}
        {/* Texte provisoire : la maquette ne dessine pas le refus de l'appareil photo. */}
        {refus && <p className="caution theme-sante">Pas d&apos;accès à l&apos;appareil photo.</p>}
      </div>
    </section>
  );
}
