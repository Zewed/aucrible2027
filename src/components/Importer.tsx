"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { lesReponses, lireReponses, remplacerLesReponses } from "@/lib/reponses";
import { decoderLesReponses } from "@/lib/transfert";

const sansAbonnement = () => () => {};

/**
 * L'import d'un transfert : les réponses après le # de l'adresse. Sur un appareil sans réponse, elles arrivent, et
 * « Mes résultats » s'ouvre. Un appareil qui a déjà des réponses (183) et un code illisible (184) ne bougent pas.
 */
export function Importer() {
  const router = useRouter();
  const fragment = useSyncExternalStore(sansAbonnement, () => location.hash, () => null);
  const existantes = Object.keys(lesReponses(useCoteClient(lireReponses))).length;
  // Lues une fois par adresse : chaque lecture tire de nouvelles graines.
  const importees = useMemo(() => (fragment === null ? null : decoderLesReponses(fragment)), [fragment]);

  useEffect(() => {
    if (!importees || existantes > 0) return;
    remplacerLesReponses(importees);
    router.replace("/resultats");
  }, [importees, existantes, router]);

  if (fragment === null) return null;
  return (
    <main className="app">
      <section className="app-top">
        <h1>
          Changer <span className="l2">d&apos;appareil<i>.</i></span>
        </h1>
      </section>
      {/* Textes provisoires, en attendant 183 (remplacer ?) et 184 (code illisible). */}
      {!importees && <p className="caution theme-sante">Ce code n&apos;est pas lisible. Réessaie ou colle le lien.</p>}
      {importees && existantes > 0 && <p className="caution theme-eco">Cet appareil a déjà {existantes} réponses.</p>}
    </main>
  );
}
