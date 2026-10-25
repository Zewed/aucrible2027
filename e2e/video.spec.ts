import { execFile, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import { getVideoMetadata, RenderInternals } from "@remotion/renderer";
import { PNG } from "pngjs";

/**
 * La vidéo du jour, rendue pour de vrai par `pnpm video`, comme sur l'ordinateur de l'auteur. Un rendu complet prend
 * plusieurs minutes : ces tests forment leur propre projet, lancé après les autres (playwright.config.ts).
 */
test.describe.configure({ mode: "default" });

const executer = promisify(execFile);

/** `pnpm video` avec ces arguments ; un jeu de fiches de test se lit comme sur le serveur des tests. */
const pnpmVideo = (...args: string[]) =>
  executer("node", ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/video.mts", ...args], {
    env: { ...process.env, AUCRIBLE_FICHES_DE_TEST: "e2e/fiches" },
  });

/** Décode la vidéo de bout en bout avec le ffmpeg de Remotion : le nombre d'images lues, et les erreurs. */
function lireJusquAuBout(fichier: string) {
  const ffmpeg = RenderInternals.getExecutablePath({ type: "ffmpeg", indent: false, logLevel: "error", binariesDirectory: null });
  const lecture = spawnSync(ffmpeg, ["-v", "error", "-stats", "-i", fichier, "-c:v", "rawvideo", "-f", "null", "-"], { cwd: path.dirname(ffmpeg), encoding: "utf8" });
  const images = [...lecture.stderr.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1];
  return { code: lecture.status, images: Number(images), erreurs: lecture.stderr.replace(/frame=[^\r\n]*[\r\n]*/g, "").trim() };
}

test("je génère la vidéo de la fiche du jour (n° 24) : une vidéo verticale de 1080 × 1920, que je peux lire jusqu'au bout", async () => {
  test.setTimeout(10 * 60_000);
  const testInfo = test.info();
  const sortie = testInfo.outputPath("video.mp4");
  await pnpmVideo("--jour", "2026-10-23", "--sortie", sortie);
  const video = await getVideoMetadata(sortie, { logLevel: "error" });
  expect({ largeur: video.width, hauteur: video.height, duree: video.durationInSeconds, codec: video.codec }).toEqual({ largeur: 1080, hauteur: 1920, duree: 75, codec: "h264" });
  expect(lireJusquAuBout(sortie)).toEqual({ code: 0, images: 75 * 30, erreurs: "" });
});

test("je corrige dans la fiche « 1,7 » en « 1,6 » et je régénère : l'image des chiffres change, et elle seule", async () => {
  test.setTimeout(3 * 60_000);
  const testInfo = test.info();
  const dossier = "e2e/fiches/video-corrigee";
  mkdirSync(dossier, { recursive: true });
  try {
    writeFileSync(`${dossier}/024.yaml`, readFileSync("content/questions/024-retraite.yaml", "utf8").replace('valeur: "1,7"', 'valeur: "1,6"'));
    const image = async (seconde: number, jeu?: string) => {
      const sortie = testInfo.outputPath(`${jeu ?? "fiche"}-${seconde}s.png`);
      await pnpmVideo("--jour", "2026-10-23", "--image", String(seconde), "--sortie", sortie, ...(jeu ? ["--jeu", jeu] : []));
      return PNG.sync.read(readFileSync(sortie));
    };
    const [chiffres, chiffresCorriges, carte, carteCorrigee] = [await image(20), await image(20, "video-corrigee"), await image(1), await image(1, "video-corrigee")];
    expect([chiffres.width, chiffres.height]).toEqual([1080, 1920]);
    // À 20 s, l'image des chiffres : le premier chiffre a changé, le reste de l'image non. Deux rendus d'une même image
    // peuvent différer de quelques nuances sur un bord lissé : seul compte un pixel qui change franchement.
    const difference = (a: PNG, b: PNG, haut: number, bas: number) => {
      let pixels = 0;
      for (let y = haut; y < bas; y++)
        for (let x = 0; x < a.width; x++) {
          const i = (y * a.width + x) * 4;
          if (Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c]))) > 32) pixels++;
        }
      return pixels;
    };
    expect(difference(chiffres, chiffresCorriges, 0, 1920)).toBeGreaterThan(500);
    expect(difference(chiffres, chiffresCorriges, 880, 1920)).toBe(0);
    // À 1 s, la carte question ne dépend pas des chiffres : elle ne bouge pas d'un pixel.
    expect(difference(carte, carteCorrigee, 0, 1920)).toBe(0);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});
