import posthog from "posthog-js";

/**
 * La mesure d'audience (SPEC.md, « Données », amendé le 12/11/2026) : PostHog, servi par le site lui-même sous /ingest
 * (next.config.ts), pour que les bloqueurs ne la coupent pas. Sans clé, rien ne part et le bandeau ne s'affiche pas.
 */
export const CLE_POSTHOG = process.env.NEXT_PUBLIC_POSTHOG_KEY;

const CHOIX = "aucrible:cookies";
const ROUVRIR = "aucrible:cookies-rouvrir";

export type Consentement = "accepte" | "refuse" | "a-demander";

/** Le choix de l'appareil ; null quand la mesure ne tourne pas (pas de clé, appareil de l'auteur, rendu serveur). */
export function lireConsentement(): Consentement | null {
  if (typeof window === "undefined" || !posthog.__loaded) return null;
  const etat = posthog.get_explicit_consent_status();
  return etat === "granted" ? "accepte" : etat === "denied" ? "refuse" : "a-demander";
}

export function choisirConsentement(accepte: boolean) {
  if (accepte) posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
  window.dispatchEvent(new Event(CHOIX));
}

export function abonnerAuConsentement(relire: () => void) {
  window.addEventListener(CHOIX, relire);
  return () => window.removeEventListener(CHOIX, relire);
}

/** « Cookies », dans le pied de page, rouvre le bandeau pour changer d'avis. */
export function rouvrirLeBandeau() {
  window.dispatchEvent(new Event(ROUVRIR));
}

export function quandLeBandeauSeRouvre(rouvrir: () => void) {
  window.addEventListener(ROUVRIR, rouvrir);
  return () => window.removeEventListener(ROUVRIR, rouvrir);
}
