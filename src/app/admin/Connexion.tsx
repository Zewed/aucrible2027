"use client";

import { useActionState } from "react";
import { entrer } from "./actions";

/** Le mot de passe, puis « Entrer » ; après un mauvais mot de passe, le refus au-dessus. */
export function Connexion() {
  const [etat, envoyer, enCours] = useActionState(entrer, { refuse: false });
  return (
    <form className="adm-login" action={envoyer}>
      {etat.refuse && (
        <p className="adm-refus theme-sante" role="alert">
          Mauvais mot de passe.
        </p>
      )}
      <input
        className="adm-mdp"
        type="password"
        name="mot-de-passe"
        aria-label="Mot de passe"
        placeholder="Mot de passe"
        autoComplete="current-password"
        autoFocus
        required
      />
      <button className="go" type="submit" disabled={enCours}>
        Entrer
      </button>
    </form>
  );
}
