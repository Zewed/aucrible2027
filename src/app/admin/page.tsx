import type { Metadata } from "next";
import { Suspense } from "react";
import { lAuteur } from "@/lib/auteur";
import { lireLesSignalements, TYPES } from "@/lib/signalement";
import { seDeconnecter } from "./actions";
import "./admin.css";

// L'espace de l'auteur : privé, aucune page publique n'y mène, et les moteurs de recherche n'ont pas à le trouver.
export const metadata: Metadata = { title: "Espace de l'auteur — Au crible 2027", robots: { index: false, follow: false } };

const LE_JOUR_ET_L_HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });

/** « Se connecter avec GitHub » ; après un compte GitHub qui n'est pas celui de l'auteur, le refus au-dessus. */
function Connexion({ refuse }: { refuse: boolean }) {
  return (
    <div className="adm-login">
      {refuse && <p className="adm-refus theme-sante">Ce compte GitHub n&apos;a pas accès.</p>}
      {/* Une route qui part vers GitHub, pas une page : un lien ordinaire, sans préchargement. */}
      <a className="go" href="/admin/connexion">
        Se connecter avec GitHub
      </a>
    </div>
  );
}

/** La boîte privée : chaque signalement reçu, avec sa question, son type, son texte et son heure d'arrivée. */
async function Boite() {
  const signalements = await lireLesSignalements();
  return (
    <section className="sec" aria-labelledby="h-sg">
      <div className="sec-h">
        <h2 id="h-sg">Signalements</h2>
        <p>{signalements.length > 1 ? `${signalements.length} reçus` : signalements.length === 1 ? "1 reçu" : "aucun"}</p>
      </div>
      {signalements.length === 0 && <p className="sg-vide">Aucun signalement pour l&apos;instant.</p>}
      <ul className="sg-list">
        {signalements.map((s) => (
          <li key={s.id}>
            <article className="sg" aria-label={`Signalement sur la question n° ${s.question}`}>
              <p className="sg-meta">
                <span className="sg-q">Question n° {s.question}</span>
                <span className="sg-type">{TYPES.find((t) => t.valeur === s.type)?.nom ?? s.type}</span>
                <time dateTime={s.recuLe.toISOString()}>{LE_JOUR_ET_L_HEURE.format(s.recuLe)}</time>
              </p>
              <p className="sg-texte">{s.texte}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Qui est là : l'auteur voit sa boîte ; tout autre compte, ou personne, voit seulement la connexion. */
async function Espace() {
  const auteur = await lAuteur();
  if (!auteur || auteur === "refuse") return <Connexion refuse={auteur === "refuse"} />;
  return (
    <>
      <form className="adm-qui" action={seDeconnecter}>
        <span>Connecté : {auteur.login}</span>
        <button type="submit">Se déconnecter</button>
      </form>
      <Boite />
    </>
  );
}

/**
 * L'espace de l'auteur (SPEC.md, « Décisions de l'auteur du 25/10/2026 ») : on y entre avec son compte GitHub, et seul
 * celui de l'auteur passe. Pour l'instant, la boîte privée des signalements ; les outils de l'auteur viendront ici.
 */
export default function PageAdmin() {
  return (
    <main className="adm">
      <section className="adm-head">
        <h1>
          Espace de l&apos;auteur<span>.</span>
        </h1>
      </section>
      <Suspense>
        <Espace />
      </Suspense>
    </main>
  );
}
