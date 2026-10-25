"use client";

import Link from "next/link";
import { PuceTheme } from "@/components/PuceTheme";
import type { Question, Theme } from "@/lib/contenu";
import { useCoteClient } from "@/lib/cote-client";
import { dateLisible } from "@/lib/date";
import { abonnerAuxReponses, lesReponses, lireReponses } from "@/lib/reponses";

/** Ce que la liste montre d'une question publiée : de quoi dessiner sa carte, rien de plus. */
export type Carte = Pick<Question, "numero" | "date" | "theme" | "question">;

/** La tuile du haut : combien de questions publiées sont encore sans réponse, et la barre des réponses. */
export function TuileARattraper({ cartes }: { cartes: Carte[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const repondues = cartes.filter((c) => c.numero in reponses).length;
  const reste = cartes.length - repondues;
  const sur = `${repondues > 1 ? "répondues" : "répondue"} sur ${cartes.length} ${cartes.length > 1 ? "publiées" : "publiée"}`;

  return (
    <div className="todo" role="group" aria-label="Sans réponse">
      <b className="todo-n">{reste}</b>{" "}
      <span className="todo-t">sans réponse</span>
      <span
        className="prog"
        role="img"
        aria-label={`${repondues} ${repondues > 1 ? "questions" : "question"} ${sur}`}
        style={{ "--publiees": cartes.length, "--repondues": repondues } as React.CSSProperties}
      >
        <i></i>
      </span>
      <span className="prog-t">
        {repondues} {sur}
      </span>
    </div>
  );
}

/**
 * « Tu es à jour ! », une fois toutes les questions publiées répondues sur l'appareil, avec la question
 * de demain quand il y en a une.
 */
export function AJour({ cartes, numeroDeDemain }: { cartes: Carte[]; numeroDeDemain: number | null }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  if (cartes.length === 0 || !cartes.every((c) => c.numero in reponses)) return null;

  // Ce que dit le bloc quand il n'y a pas de question demain (silence, fin des questions) reste à trancher.
  return (
    <aside className="dp" aria-labelledby="dp-t">
      <div className="dp-box">
        {numeroDeDemain !== null && (
          <span className="dp-card" aria-hidden="true">
            <small>n°</small>
            {numeroDeDemain}
          </span>
        )}
        <div>
          <h2 id="dp-t">Tu es à jour&nbsp;!</h2>
          {numeroDeDemain !== null && <p>Reviens demain pour la question n°&nbsp;{numeroDeDemain}.</p>}
        </div>
      </div>
    </aside>
  );
}

/**
 * Les cartes du rattrapage, dans l'ordre reçu : celles « À répondre » d'abord, puis celles déjà
 * répondues sur cet appareil, grisées et marquées « Répondu ».
 */
export function ListeDeRattrapage({ cartes, themes }: { cartes: Carte[]; themes: Theme[] }) {
  const reponses = lesReponses(useCoteClient(lireReponses, abonnerAuxReponses));
  const repondue = (carte: Carte) => carte.numero in reponses;
  const rangees = [...cartes.filter((c) => !repondue(c)), ...cartes.filter(repondue)];

  return (
    <ul className="qlist">
      {rangees.map((carte, i) => {
        const theme = themes.find((t) => t.id === carte.theme);
        const faite = repondue(carte);
        return (
          <li
            key={carte.numero}
            className={`qitem ${theme?.classe ?? ""}${faite ? " done" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <Link className="qr" href={`/question/${carte.numero}`}>
              <div className="qr-top">
                <div className="qr-meta">
                  {theme && <PuceTheme theme={theme} />}
                  <span className="qr-no">n°&nbsp;{carte.numero}</span>
                </div>
                <h3 className="qr-q">{carte.question}</h3>
              </div>
              <div className="qr-foot">
                <span className="power">
                  <span className="power-t">
                    <small>{dateLisible(carte.date, false)}</small>
                  </span>
                </span>
                {faite ? (
                  <span className="st st-done">
                    Répondu{" "}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12.5l4.5 4.5L19 7"
                        style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }}
                      />
                    </svg>
                  </span>
                ) : (
                  <span className="st st-todo">
                    À répondre{" "}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12h13M13 6l6 6-6 6"
                        style={{ fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
                      />
                    </svg>
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
