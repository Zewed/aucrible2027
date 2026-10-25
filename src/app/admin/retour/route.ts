import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { lireLaSession } from "@/lib/auteur";

/** Le même « state » que celui du départ, comparé sans fuite de temps. */
function memeState(attendu: string | undefined, recu: string | null) {
  if (!attendu || !recu || attendu.length !== recu.length) return false;
  return timingSafeEqual(Buffer.from(attendu), Buffer.from(recu));
}

/**
 * Le retour de GitHub après « Se connecter avec GitHub » : si le « state » est celui du départ, le code est échangé
 * contre un jeton (AUTH_GITHUB_ID et AUTH_GITHUB_SECRET), qui sert une seule fois à lire le compte GitHub. La session ne
 * garde que son numéro et son nom ; /admin décide ensuite si c'est l'auteur. Sinon, rien n'est ouvert.
 */
export async function GET(requete: NextRequest) {
  const session = await lireLaSession();
  const vers = NextResponse.redirect(new URL("/admin", requete.nextUrl.origin));
  const code = requete.nextUrl.searchParams.get("code");
  if (!code || !memeState(session.state, requete.nextUrl.searchParams.get("state"))) {
    session.destroy();
    return vers;
  }
  delete session.state;
  const reponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH_GITHUB_ID,
      client_secret: process.env.AUTH_GITHUB_SECRET,
      code,
      redirect_uri: new URL("/admin/retour", requete.nextUrl.origin).toString(),
    }),
  });
  const { access_token: jeton } = (await reponse.json()) as { access_token?: string };
  if (!jeton) {
    session.destroy();
    return vers;
  }
  const compte = (await (await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${jeton}`, Accept: "application/vnd.github+json" } })).json()) as {
    id?: number;
    login?: string;
  };
  if (typeof compte.id !== "number" || !compte.login) {
    session.destroy();
    return vers;
  }
  session.github = { id: compte.id, login: compte.login };
  await session.save();
  return vers;
}
