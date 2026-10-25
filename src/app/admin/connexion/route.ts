import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { lireLaSession } from "@/lib/auteur";

/**
 * « Se connecter avec GitHub » : part vers GitHub avec un « state » tiré au hasard, gardé dans la session, que le retour
 * (/admin/retour) devra rapporter. L'app OAuth GitHub est celle d'AUTH_GITHUB_ID.
 */
export async function GET(requete: NextRequest) {
  const session = await lireLaSession();
  session.state = randomBytes(24).toString("base64url");
  await session.save();
  const versGitHub = new URL("https://github.com/login/oauth/authorize");
  versGitHub.searchParams.set("client_id", process.env.AUTH_GITHUB_ID ?? "");
  versGitHub.searchParams.set("redirect_uri", new URL("/admin/retour", requete.nextUrl.origin).toString());
  versGitHub.searchParams.set("state", session.state);
  versGitHub.searchParams.set("allow_signup", "false");
  return NextResponse.redirect(versGitHub);
}
