"use client";

import qrcode from "qrcode-generator";
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

/** La carte 1 de « Changer d'appareil » : sur l'appareil qui a les réponses, le QR code qui les emporte. */
export function EnvoyerMesReponses() {
  const adresse = adresseDesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
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
          <div className="qr-wrap">
            <QrCode adresse={adresse} />
            <p className="qr-cap">Scanne-le avec ton autre appareil</p>
          </div>
        ) : (
          <p className="qr-cap">Aucune réponse à envoyer.</p>
        )}
      </div>
    </section>
  );
}
