"use client";

import Link from "next/link";
import { useActionState } from "react";
import { envoyerUnSignalement } from "@/app/signaler/actions";

/**
 * Le formulaire de « Signaler une erreur » : la fiche et le type (rendus par la page), « Qu'est-ce qui ne va pas ? », la source, l'e-mail,
 * la promesse des 72 h, puis « Envoyer », qui garde le signalement sans demander de compte. Le remerciement, le refus d'un texte vide et
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
      <div className="f-block">
        <label className="f-label" htmlFor="lien">
          Ta source (lien) <span className="opt-tag">facultatif</span>
        </label>
        <input className="f-input" id="lien" name="lien" type="url" inputMode="url" placeholder="https://" />
      </div>
      <div className="f-block">
        <label className="f-label" htmlFor="mel">
          Ton e-mail <span className="opt-tag">facultatif</span>
        </label>
        <input className="f-input" id="mel" name="mel" type="email" inputMode="email" autoComplete="email" placeholder="toi@exemple.fr" />
        <p className="f-help">Pour qu&apos;on te réponde. Il ne sert qu&apos;à ça.</p>
      </div>
      {/* La promesse de la maquette, juste au-dessus du bouton (SPEC.md, « Corrections » : réponse sous 72 h). */}
      <p className="promise">
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.5l3.5 2" />
        </svg>
        <span>
          <b>On répond sous 72&nbsp;h.</b> Chaque correction est publiée dans le <Link href="/journal">journal des corrections</Link>.
        </span>
      </p>
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
