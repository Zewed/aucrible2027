import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompteARebours } from "@/components/CompteARebours";
import { lireCandidats } from "@/lib/contenu";
import { lireAujourdhui } from "@/lib/publication";
import "./candidat.css";

/**
 * La fiche d'un candidat : son pion, le même que pour les 12 autres, et son nom. Le parti, le statut et
 * les positions viennent ensuite.
 */
async function FicheCandidat({ id }: { id: string }) {
  const candidat = lireCandidats().find((c) => c.id === id);
  if (!candidat) notFound();
  const jour = await lireAujourdhui();
  return (
    <>
      {/* Le retour « Mes résultats » de la maquette n'est porté par aucun ticket. */}
      <div className="strip">
        <span></span>
        <CompteARebours jour={jour} />
      </div>
      <main className="fiche">
        <div className="fiche-grid">
          <aside className="fiche-side" aria-label="Qui est-ce">
            <section className="id-card" aria-labelledby="nom">
              <div className="id-top">
                <span className="pawn pawn--paper pawn--big" aria-hidden="true">
                  {candidat.initiales}
                </span>
                <div className="id-name">
                  <p className="kicker">Fiche candidat</p>
                  <h1 id="nom">{candidat.nom}</h1>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

export default function PageCandidat({ params }: PageProps<"/candidat/[id]">) {
  return <Suspense>{params.then(({ id }) => <FicheCandidat id={id} />)}</Suspense>;
}
