"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { envoyerUnSignalement } from "@/app/signaler/actions";

/**
 * Après un envoi réussi (maquettes/signaler.html, « après l'envoi ») : le remerciement prend la place du formulaire,
 * qu'on ne renvoie pas une seconde fois par mégarde.
 */
function Merci() {
  return (
    <div className="state-card state-ok" role="status">
      <span className="state-ic">
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <div>
        <p className="state-t">Merci&nbsp;! Ton signalement est arrivé.</p>
        <p className="state-s">Si tu as laissé ton e-mail, on te répond sous 72&nbsp;h.</p>
        <Link className="btn-ink" href="/">
          Retour aux questions
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/**
 * Le formulaire de « Signaler une erreur » : la fiche et le type (rendus par la page), « Qu'est-ce qui ne va pas ? »,
 * la source, l'e-mail, la promesse des 72 h, puis « Envoyer », qui garde le signalement sans demander de compte, et
 * remercie. Un texte vide, ou fait seulement d'espaces, ne part pas. L'envoi passe par le script de la page : rien de
 * ce qui est écrit n'est effacé quand il est refusé. L'échec d'envoi vient avec le ticket 169.
 */
export function FormulaireDeSignalement({ numero, children }: { numero: number; children: React.ReactNode }) {
  const [etat, envoyer, enCours] = useActionState(envoyerUnSignalement, { envoye: false });
  const [videIci, setVideIci] = useState(false);
  const [, demarrer] = useTransition();
  if (etat.envoye) return <Merci />;
  const vide = videIci || etat.vide === true;

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const quoi = formulaire.elements.namedItem("quoi") as HTMLTextAreaElement;
    setVideIci(!quoi.value.trim());
    if (!quoi.value.trim()) return quoi.focus();
    const donnees = new FormData(formulaire);
    demarrer(() => envoyer(donnees));
  }

  return (
    <form className="sig-card" action={envoyer} onSubmit={soumettre}>
      <input type="hidden" name="question" value={numero} />
      {children}
      <div className="f-block">
        <label className="f-label" htmlFor="quoi">
          Qu&apos;est-ce qui ne va pas ?
        </label>
        <textarea
          className="f-input"
          id="quoi"
          name="quoi"
          rows={5}
          placeholder="Dis-nous ce que tu as vu, avec tes mots."
          aria-invalid={vide || undefined}
          aria-describedby={vide ? "quoi-vide" : undefined}
        ></textarea>
        {vide && (
          <p className="f-err theme-sante" id="quoi-vide" role="alert">
            Écris ce qui ne va pas avant d&apos;envoyer.
          </p>
        )}
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
    </form>
  );
}
