"use client";

import { useActionState } from "react";
import { envoyerUnSignalement } from "@/app/signaler/actions";

/**
 * Le formulaire de « Signaler une erreur » : la fiche et le type (rendus par la page), « Qu'est-ce qui ne va pas ? »,
 * puis « Envoyer », qui garde le signalement sans demander de compte. Le remerciement, le refus d'un texte vide et
 * l'échec d'envoi viennent avec les tickets 167 à 169.
 */
export function FormulaireDeSignalement({ numero, children }: { numero: number; children: React.ReactNode }) {
  const [etat, envoyer, enCours] = useActionState(envoyerUnSignalement, { envoye: false });
  return (
    <form className="sig-card" action={envoyer}>
      <input type="hidden" name="question" value={numero} />
      {children}
      <div className="f-block">
        <label className="f-label" htmlFor="quoi">
          Qu&apos;est-ce qui ne va pas ?
        </label>
        <textarea className="f-input" id="quoi" name="quoi" rows={5} placeholder="Dis-nous ce que tu as vu, avec tes mots."></textarea>
      </div>
      <button className="go" type="submit" disabled={enCours}>
        Envoyer
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
      {etat.envoye && (
        <p className="f-help" role="status">
          Envoyé.
        </p>
      )}
    </form>
  );
}
