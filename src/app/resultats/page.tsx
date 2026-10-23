import { Suspense } from "react";
import { BandeauRetour } from "@/components/BandeauRetour";
import { lireAujourdhui } from "@/lib/publication";

/** « Mes résultats » : pour l'instant son titre ; le classement et ce qui le compose viennent ensuite. */
async function Resultats() {
  const jour = await lireAujourdhui();
  return (
    <>
      <BandeauRetour jour={jour} />
      <main className="res">
        <section className="res-hero">
          <div className="res-top">
            <div>
              <h1>
                Mes résultats<span>.</span>
              </h1>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function PageResultats() {
  return (
    <Suspense>
      <Resultats />
    </Suspense>
  );
}
