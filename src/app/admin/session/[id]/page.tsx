import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pion } from "@/components/Pion";
import { analyserLesSessions, quand, sessionCourte } from "@/lib/analyse";
import { estLAuteur } from "@/lib/auteur";
import { lireThemes } from "@/lib/contenu";
import { dateCourte } from "@/lib/date";
import { lireCandidatsEnLice, lireQuestionsDuCalcul, lireQuestionsPubliees } from "@/lib/publication";
import { JE_NE_SAIS_PAS } from "@/lib/reponses";
import { lireLesReponsesDeLaSession } from "@/lib/reponses-partagees";
import { Connexion } from "../../Connexion";
import { SupprimerLaSession } from "../../SupprimerDesSessions";
import "../../admin.css";

export const metadata: Metadata = { title: "Session — Espace de l'auteur — Décrypte 2027", robots: { index: false, follow: false } };

/**
 * Une session, en entier : son classement, calculé comme sur l'appareil, puis chacune de ses réponses, avec les candidats
 * qui ont la même. Une session est un onglet, jamais une personne : rien ne mène d'ici à une autre session.
 */
async function Session({ id }: { id: string }) {
  if (!(await estLAuteur())) return <Connexion />;
  const [reponses, publiees, duCalcul, candidats] = await Promise.all([
    lireLesReponsesDeLaSession(id),
    lireQuestionsPubliees(),
    lireQuestionsDuCalcul(),
    lireCandidatsEnLice(),
  ]);
  if (reponses.length === 0) notFound();
  const [session] = analyserLesSessions(reponses, duCalcul, candidats);
  const themes = lireThemes();

  return (
    <>
      <section className="adm-head">
        <Link className="an-retour" href="/admin">
          ← Tableau de bord
        </Link>
        <h1>
          Session {sessionCourte(session.session)}
          <span>.</span>
        </h1>
        <SupprimerLaSession session={session.session} />
      </section>
      <section className="an-kpis" aria-label="Chiffres clés">
        <p>
          <b>{session.reponses.length}</b>
          <span>réponses</span>
        </p>
        <p>
          <b>{session.comptees}</b>
          <span>comptées</span>
        </p>
        <p>
          <b>{session.reponses.length - session.comptees}</b>
          <span>« Je ne sais pas »</span>
        </p>
        <p className="an-kpi-texte">
          <b>{quand(session, true)}</b>
          <span>{session.session}</span>
        </p>
      </section>

      <div className="an-grille an-grille--session">
        <section className="sec an-bloc" aria-labelledby="h-cl">
          <div className="sec-h">
            <h2 id="h-cl">Classement</h2>
          </div>
          <table className="an-table an-cands">
            <tbody>
              {session.classement.map(({ candidat, pourcentage }) => (
                <tr key={candidat.id}>
                  <th scope="row">
                    <span className="an-qui">
                      <Pion candidat={candidat} clair />
                      <span>
                        <b>{candidat.nom}</b>
                        <small>{candidat.parti}</small>
                      </span>
                    </span>
                  </th>
                  <td className="an-barre">
                    <i style={{ width: `${pourcentage ?? 0}%` }}></i>
                  </td>
                  <td className="an-pc">{pourcentage == null ? "—" : `${pourcentage} %`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="sec an-bloc" aria-labelledby="h-sr">
          <div className="sec-h">
            <h2 id="h-sr">Réponses</h2>
          </div>
          <ul className="rp-list">
            {session.reponses.map((r) => {
              const question = publiees.find((q) => q.numero === r.question);
              const theme = themes.find((t) => t.id === question?.theme);
              const nsp = r.option === JE_NE_SAIS_PAS;
              const option = question?.options.find((o) => o.id === r.option);
              const memes = nsp ? [] : candidats.filter((c) => question?.positions[c.id]?.option === r.option);
              return (
                <li key={r.question} className={`sg an-rep ${theme?.classe ?? ""}`} aria-label={`Question n° ${r.question}`}>
                  <p className="sg-meta">
                    <span className="sg-q">Question n° {r.question}</span>
                    {theme && <span className="sg-type an-theme">{theme.nom}</span>}
                    <span>{dateCourte(r.jour)}</span>
                  </p>
                  <p className="an-question">{question?.question ?? "Question retirée"}</p>
                  <p className="an-choix">
                    <b>{nsp ? "Je ne sais pas" : `${r.option}. ${option?.libelle ?? ""}`}</b>
                    {r.importance != null && <span className="an-imp">×{r.importance}</span>}
                  </p>
                  {memes.length > 0 && (
                    <p className="an-memes">
                      <span>Même réponse</span>
                      {memes.map((c) => (
                        <span key={c.id} className="an-qui an-qui--petit" title={c.nom}>
                          <Pion candidat={c} clair />
                          <span>{c.nom}</span>
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function PageSession({ params }: PageProps<"/admin/session/[id]">) {
  return (
    <main className="adm">
      <Suspense>{params.then(({ id }) => <Session id={id} />)}</Suspense>
    </main>
  );
}
