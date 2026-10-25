import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Les comptes GitHub qui entrent dans l'espace de l'auteur (SPEC.md, « Décisions de l'auteur du 25/10/2026 ») : celui
 * de l'auteur, Zewed. Reconnu à son numéro GitHub, qui ne change pas, et non à son nom, qu'un autre pourrait reprendre.
 */
const AUTEURS = [{ id: 44063631, login: "Zewed" }];

/** Ce que garde la session : le compte GitHub connecté, et le « state » d'une connexion en cours. */
export type Session = { github?: { id: number; login: string }; state?: string };

/** La session de l'espace de l'auteur : un cookie chiffré par AUTH_SECRET, qui ne garde aucun jeton GitHub. */
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
 * Qui est connecté : l'auteur (son compte GitHub), un autre compte GitHub (« refuse »), ou personne. Chaque lecture de
 * l'espace de l'auteur passe par ici.
 */
export async function lAuteur(): Promise<{ login: string } | "refuse" | null> {
  const { github } = await lireLaSession();
  if (!github) return null;
  return AUTEURS.some((a) => a.id === github.id) ? { login: github.login } : "refuse";
}
