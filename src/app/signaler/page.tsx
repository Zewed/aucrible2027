import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { lireAujourdhui } from "@/lib/publication";
import "./signaler.css";

/**
 * « Signaler une erreur » (maquettes/signaler.html) : le titre et l'introduction. Le formulaire, la fiche concernée
 * et l'envoi viennent avec les tickets 161 à 170.
 */
async function Signaler() {
  const jour = await lireAujourdhui();
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="sig">
        <section className="sig-head">
          <h1>
            Signaler une erreur<span>.</span>
          </h1>
          <p className="sig-intro">
            Un chiffre faux, une position mal attribuée, une phrase qui penche&nbsp;? <span className="nb">Dis-le-nous</span>&nbsp;: on
            vérifie et on corrige.
          </p>
        </section>
      </main>
    </>
  );
}

export default function PageSignaler() {
  return (
    <Suspense>
      <Signaler />
    </Suspense>
  );
}
