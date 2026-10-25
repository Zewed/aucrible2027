import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { EnvoyerMesReponses } from "@/components/EnvoyerMesReponses";
import { RecupererMesReponses } from "@/components/RecupererMesReponses";
import { lireAujourdhui } from "@/lib/publication";
import "./appareil.css";

/**
 * « Changer d'appareil » (maquettes/appareil.html) : emporter ses réponses vers un autre appareil, sans compte ni
 * serveur, ce que le bandeau du haut promet (les réponses voyagent après le # du lien, que le navigateur n'envoie
 * jamais). La phrase d'introduction de la maquette n'est pas reprise : la page se lit sans elle (décision du 25 octobre).
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
          <div className="promise" role="note">
            <span className="promise-ico" aria-hidden="true">
              <svg className="ic" viewBox="0 0 28 28">
                <rect x="6.5" y="2.5" width="15" height="23" rx="3.5" />
                <rect x="10.5" y="14.5" width="7" height="6" rx="1.4" />
                <path d="M12 14.5v-1.6a2 2 0 0 1 4 0v1.6" />
              </svg>
            </span>
            <div>
              <p className="promise-t">Tes réponses ne quittent ton téléphone que si tu le décides.</p>
              <p className="promise-s">Pas de compte, pas de serveur.</p>
            </div>
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
