"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { supprimerDesSessions, supprimerLaSession } from "./actions";

const sessions = (n: number) => (n > 1 ? `${n} sessions` : "la session");

/** Le bouton d'envoi, qui se grise le temps de l'effacement. */
function Bouton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="an-supprimer" disabled={pending}>
      {pending ? "Suppression…" : children}
    </button>
  );
}

/** Demande avant d'effacer : les réponses supprimées ne reviennent pas. */
function confirmer(evenement: FormEvent, combien: number) {
  if (!confirm(`Supprimer ${sessions(combien)} ? Leurs réponses seront effacées.`)) evenement.preventDefault();
}

/**
 * Le tableau des sessions, avec une case par ligne (et une pour toutes, dans l'en-tête) : dès qu'une est cochée, le bouton
 * « Supprimer » apparaît en bas à droite.
 */
export function ChoixDesSessions({ children }: { children: ReactNode }) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [cochees, setCochees] = useState(0);
  const cases = () => [...(formulaire.current?.querySelectorAll<HTMLInputElement>('input[name="session"]') ?? [])];

  function changer(evenement: FormEvent<HTMLFormElement>) {
    const cible = evenement.target as HTMLInputElement;
    if (cible.name === "toutes") for (const c of cases()) c.checked = cible.checked;
    const toutes = formulaire.current?.querySelector<HTMLInputElement>('input[name="toutes"]');
    const n = cases().filter((c) => c.checked).length;
    if (toutes) toutes.checked = n > 0 && n === cases().length;
    setCochees(n);
  }

  return (
    <form
      ref={formulaire}
      onChange={changer}
      onSubmit={(e) => confirmer(e, cochees)}
      action={async (donnees) => {
        await supprimerDesSessions(donnees);
        formulaire.current?.reset();
        setCochees(0);
      }}
    >
      {children}
      {cochees > 0 && (
        <div className="an-barre-suppr">
          <Bouton>Supprimer {sessions(cochees)}</Bouton>
        </div>
      )}
    </form>
  );
}

/** « Supprimer la session », sur la page d'une session : ses réponses sont effacées, retour au tableau de bord. */
export function SupprimerLaSession({ session }: { session: string }) {
  return (
    <form action={supprimerLaSession} onSubmit={(e) => confirmer(e, 1)}>
      <input type="hidden" name="session" value={session} />
      <Bouton>Supprimer la session</Bouton>
    </form>
  );
}
