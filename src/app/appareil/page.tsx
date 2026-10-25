import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { EnvoyerMesReponses } from "@/components/EnvoyerMesReponses";
import { RecupererMesReponses } from "@/components/RecupererMesReponses";
import { lireAujourdhui } from "@/lib/publication";
import "./appareil.css";

/**
 * « Changer d'appareil » (maquettes/appareil.html) : emporter ses réponses vers un autre appareil, sans compte ni
 * serveur. La phrase d'introduction de la maquette n'est pas reprise : la page se lit sans elle (décision du 25 octobre).
 */
async function Appareil() {
  return (
    <>
      <BandeauRetour jour={await lireAujourdhui()} />
      <main className="app">
        <section className="app-top" aria-labelledby="h-app">
          <div>
            <h1 id="h-app">
              Changer <span className="l2">d&apos;appareil<i>.</i></span>
            </h1>
          </div>
        </section>
        <div className="app-grid">
          <EnvoyerMesReponses />
          <div className="app-col">
            <RecupererMesReponses />
          </div>
        </div>
      </main>
    </>
  );
}

export default function PageAppareil() {
  return (
    <Suspense>
      <Appareil />
    </Suspense>
  );
}
