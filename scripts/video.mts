/**
 * `pnpm video` : la vidéo verticale du jour (1080 × 1920), rendue par Remotion depuis la fiche du jour.
 *
 *   pnpm video                       la fiche d'aujourd'hui, dans videos/AAAA-MM-JJ-n°.mp4
 *   pnpm video --jour 2026-10-23     la fiche d'un autre jour
 *   pnpm video --image 20            une seule image, à 20 s, en PNG, pour relire sans tout rendre
 *   pnpm video --sortie f.mp4        ailleurs que dans videos/
 *   pnpm video --reportage           le reportage 16:9 de la fiche, sur la musique de son thème (pnpm musiques)
 *
 * Les chiffres et les textes viennent de la fiche vérifiée (content/questions), jamais d'une IA : corriger la fiche
 * puis relancer corrige la vidéo. Chrome est celui de Playwright, déjà installé pour les tests.
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { lireMusiques, lireQuestions, lireThemes } from "../src/lib/contenu.ts";
import { aujourdhuiAParis } from "../src/lib/date.ts";

const racine = path.resolve(import.meta.dirname, "..");
const { values: options } = parseArgs({
  options: {
    jour: { type: "string", default: aujourdhuiAParis() },
    // Pour les tests seulement : un jeu de fiches de test (e2e/fiches/<jeu>), lu si AUCRIBLE_FICHES_DE_TEST le permet.
    jeu: { type: "string" },
    image: { type: "string" },
    sortie: { type: "string" },
    // Le reportage 16:9 (la vidéo de la fiche) au lieu de la vidéo verticale du jour.
    reportage: { type: "boolean", default: false },
  },
});

const question = lireQuestions(options.jeu).find((q) => q.date === options.jour);
if (!question) {
  console.error(`Pas de fiche le ${options.jour} : pas de vidéo.`);
  process.exit(1);
}
const theme = lireThemes().find((t) => t.id === question.theme)!;

// La musique du thème, si elle a été téléchargée (pnpm musiques).
const son = path.join(racine, "videos", "son");
const morceau = lireMusiques()[theme.id];
const musique =
  options.reportage && morceau && existsSync(path.join(son, `${theme.id}.mp3`))
    ? { src: `${theme.id}.mp3`, tempo: morceau.tempo, premierTemps: morceau.premierTemps }
    : undefined;
if (options.reportage && !musique) console.warn(`Pas de musique pour « ${theme.nom} » : lancer pnpm musiques.`);
const inputProps = { question, theme, ...(musique ? { musique } : {}) };

const serveUrl = await bundle({
  entryPoint: path.join(racine, "src/video/racine.tsx"),
  // La musique du reportage est servie depuis son dossier.
  ...(musique ? { publicDir: son } : {}),
  // Les mêmes chemins « @/… » que l'app, pour que la vidéo dessine les mêmes images que le storyboard.
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: { ...(config.resolve?.alias as object), "@": path.join(racine, "src") } },
  }),
});
const navigateur = { browserExecutable: chromium.executablePath(), chromeMode: "chrome-for-testing" as const };
const composition = await selectComposition({ serveUrl, id: options.reportage ? "reportage" : "video-du-jour", inputProps, ...navigateur });

const nom = `${options.jour}-${String(question.numero).padStart(3, "0")}${options.reportage ? "-reportage" : ""}`;
if (options.image !== undefined) {
  // Une ou plusieurs images (« 3,14,28 »), rendues avec le même paquet.
  for (const seconde of options.image.split(",")) {
    const sortie = options.sortie ?? path.join(racine, "videos", `${nom}-${seconde}s.png`);
    mkdirSync(path.dirname(sortie), { recursive: true });
    await renderStill({ composition, serveUrl, inputProps, output: sortie, frame: Math.round(Number(seconde) * composition.fps), ...navigateur });
    console.log(sortie);
  }
} else {
  const sortie = options.sortie ?? path.join(racine, "videos", `${nom}.mp4`);
  mkdirSync(path.dirname(sortie), { recursive: true });
  // Trois images rendues à la fois : mesuré plus rapide que six ou huit ici, et Remotion ne cale plus en ouvrant
  // tous ses onglets d'un coup quand la machine est chargée.
  await renderMedia({ composition, serveUrl, inputProps, codec: "h264", outputLocation: sortie, concurrency: 3, ...navigateur });
  console.log(sortie);
}
