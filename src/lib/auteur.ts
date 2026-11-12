import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { connection } from "next/server";

/** Ce que garde la session : l'auteur est entré avec son mot de passe. */
export type Session = { auteur?: true };

/** La session de l'espace de l'auteur : un cookie chiffré par AUTH_SECRET, qui ne garde pas le mot de passe. */
function options(): SessionOptions {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET manque : pas de session possible.");
  return {
    password: process.env.AUTH_SECRET,
    cookieName: "aucrible-auteur",
    cookieOptions: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 8 * 60 * 60 },
  };
}

/** La session de cette requête. Elle se lit à la requête, jamais à l'avance : sa date d'expiration compte. */
export async function lireLaSession() {
  await connection();
  return getIronSession<Session>(await cookies(), options());
}

/**
 * Le mot de passe tapé est-il celui de l'auteur (ADMIN_PASSWORD) ? Comparé sans fuite de temps ; sans ADMIN_PASSWORD,
 * personne n'entre.
 */
export function bonMotDePasse(tape: string) {
  const attendu = process.env.ADMIN_PASSWORD;
  if (!attendu || !tape) return false;
  const empreinte = (texte: string) => createHash("sha256").update(texte).digest();
  return timingSafeEqual(empreinte(attendu), empreinte(tape));
}

/** L'auteur est-il entré ? Chaque lecture de l'espace de l'auteur passe par ici. */
export async function estLAuteur() {
  return (await lireLaSession()).auteur === true;
}
