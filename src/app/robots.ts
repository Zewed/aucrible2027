import type { MetadataRoute } from "next";

/** Version alpha : aucun moteur de recherche n'explore le site, qui se partage par lien. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
