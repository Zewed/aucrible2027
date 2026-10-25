"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useCoteClient } from "@/lib/cote-client";
import { lesReponses, lireReponses, remplacerLesReponses } from "@/lib/reponses";
import { decoderLesReponses } from "@/lib/transfert";

const sansAbonnement = () => () => {};

/** « Cet appareil a déjà 5 réponses. Les remplacer par les 23 importées ? », avec le schéma 5 → 23 (maquettes/appareil.html). */
function Remplacer({ existantes, importees, remplacer, annuler }: { existantes: number; importees: number; remplacer: () => void; annuler: () => void }) {
  const question = `Cet appareil a déjà ${existantes} ${existantes > 1 ? "réponses" : "réponse"}. Les remplacer par ${importees > 1 ? `les ${importees} importées` : "celle importée"} ?`;
  return (
    <div className="case">
      <div className="case-box theme-eco" role="alertdialog" aria-label={question}>
        <div className="case-head">
          <span className="case-ico" aria-hidden="true">
            <svg className="ic" viewBox="0 0 24 24">
              <path d="M12 3.5 2.8 19.5h18.4Z" />
              <path d="M12 10v4.5M12 17.4v.2" />
            </svg>
          </span>
          <p className="case-msg">{question.replace(" ?", "\u00a0?")}</p>
        </div>
        <div className="swap" aria-hidden="true">
          <div className="old">
            <b>{existantes}</b>
            <span>sur cet appareil</span>
          </div>
          <svg className="ic" viewBox="0 0 24 24">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
          <div className="new">
            <b>{importees}</b>
            <span>dans le lien</span>
          </div>
        </div>
        <div className="case-btns">
          <button className="btn yes" type="button" onClick={remplacer}>
            Remplacer
          </button>
          <button className="btn no" type="button" onClick={annuler}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * L'import d'un transfert : les réponses après le # de l'adresse. Sur un appareil sans réponse, elles arrivent, et
 * « Mes résultats » s'ouvre. Un appareil qui a déjà des réponses demande d'abord s'il faut les remplacer (jamais les
 * ajouter) ; un code illisible ne touche à rien.
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
      {!importees && <p className="caution theme-sante">Ce code n&apos;est pas lisible. Réessaie ou colle le lien.</p>}
      {importees && existantes > 0 && (
        <Remplacer
          existantes={existantes}
          importees={Object.keys(importees).length}
          remplacer={() => {
            remplacerLesReponses(importees);
            router.replace("/resultats");
          }}
          annuler={() => router.replace("/appareil")}
        />
      )}
    </main>
  );
}
