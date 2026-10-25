"use client";

import qrcode from "qrcode-generator";
import { useState } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";
import { encoderLesReponses } from "@/lib/transfert";

/** L'adresse qui emporte les réponses de cet appareil : celle où tourne le site (le domaine n'est pas encore choisi). */
export function adresseDesReponses(brut: string | null): string | null {
  const reponses = lesReponses(brut);
  if (Object.keys(reponses).length === 0) return null;
  return `${location.origin}/i#${encoderLesReponses(reponses)}`;
}

/** Le QR code de cette adresse, en SVG, pour l'appareil photo d'un autre téléphone. */
function QrCode({ adresse }: { adresse: string }) {
  const qr = qrcode(0, "M");
  qr.addData(adresse);
  qr.make();
  return (
    <div
      className="qr"
      role="img"
      aria-label="QR code de tes réponses"
      dangerouslySetInnerHTML={{ __html: qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) }}
    />
  );
}

/**
 * La carte 1 de « Changer d'appareil » : sur l'appareil qui a les réponses, le QR code qui les emporte, et le même lien
 * à copier, avec l'avertissement qu'il contient les réponses.
 */
export function EnvoyerMesReponses() {
  const brut = useCoteClient(lireReponses, abonnerAuxReponses);
  const adresse = adresseDesReponses(brut);
  const nombre = Object.keys(lesReponses(brut)).length;
  const [copie, setCopie] = useState(false);
  async function copier() {
    if (!adresse) return;
    await navigator.clipboard.writeText(adresse);
    setCopie(true);
  }
  return (
    <section className="app-card theme-immi" aria-labelledby="h-send" id="envoyer">
      <div className="app-card-top">
        <p className="app-kick">
          <span className="app-step" aria-hidden="true">
            1
          </span>
          <span className="app-where">Sur l&apos;appareil qui a tes réponses</span>
        </p>
        <h2 id="h-send">Envoyer mes réponses</h2>
      </div>
      <div className="app-card-body">
        {adresse ? (
          <>
            <div className="qr-wrap">
              <QrCode adresse={adresse} />
              <p className="qr-cap">Scanne-le avec ton autre appareil</p>
            </div>
            <p className="or">
              <span>ou par lien</span>
            </p>
            <p className="linkrow">
              <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
              </svg>
              <span className="one">{adresse.replace(/^https?:\/\//, "")}</span>
            </p>
            <button className="go" type="button" onClick={copier}>
              <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2.5" />
                <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
              </svg>
              {copie ? "Lien copié" : "Copier le lien"}
            </button>
            <p className="caution theme-eco">
              <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.5 2.8 19.5h18.4Z" />
                <path d="M12 10v4.5M12 17.4v.2" />
              </svg>
              <span>
                Le lien contient tes {nombre} {nombre > 1 ? "réponses" : "réponse"}&nbsp;: ne le partage qu&apos;avec{" "}
                <span style={{ whiteSpace: "nowrap" }}>toi-même</span>.
              </span>
            </p>
          </>
        ) : (
          <p className="qr-cap">Aucune réponse à envoyer.</p>
        )}
      </div>
    </section>
  );
}
