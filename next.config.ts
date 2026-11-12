import type { NextConfig } from "next";

// PostHog passe par le site (/ingest) plutôt que par son propre domaine, que les bloqueurs coupent (src/lib/mesure.ts).
const POSTHOG = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_FICHIERS = POSTHOG.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // PostHog envoie vers des adresses à barre finale, que Next redirigerait sinon.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:chemin*", destination: `${POSTHOG_FICHIERS}/static/:chemin*` },
      { source: "/ingest/array/:chemin*", destination: `${POSTHOG_FICHIERS}/array/:chemin*` },
      { source: "/ingest/:chemin*", destination: `${POSTHOG}/:chemin*` },
    ];
  },
};

export default nextConfig;
