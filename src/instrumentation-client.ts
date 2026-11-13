import posthog from "posthog-js";
import { estLAppareilDeLAuteur } from "@/lib/appareil-de-l-auteur";
import { CLE_POSTHOG } from "@/lib/mesure";

/**
 * PostHog démarre avant que la page réponde (instrumentation-client de Next). Rien ne part tant que l'électeur n'a pas
 * répondu au bandeau ; s'il refuse, la mesure continue sans cookie (cookieless_mode « on_reject », à activer aussi dans
 * les réglages du projet PostHog). Les appareils de l'auteur ne sont pas mesurés, comme pour les visites.
 */
if (CLE_POSTHOG && !estLAppareilDeLAuteur()) {
  try {
    posthog.init(CLE_POSTHOG, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.includes("eu.") ? "https://eu.posthog.com" : "https://us.posthog.com",
      defaults: "2026-08-30",
      cookieless_mode: "on_reject",
      person_profiles: "identified_only",
    });
  } catch {
    // La mesure ne doit jamais empêcher le site de marcher.
  }
}
