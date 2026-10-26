import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { sealData } from "iron-session";
import postgres from "postgres";
import { parse } from "yaml";
import jsQR from "jsqr";
import qrcode from "qrcode-generator";
import { PNG } from "pngjs";

const CANDIDATS = [
  "Marine Le Pen", "Jean-Luc Mélenchon", "Édouard Philippe", "Raphaël Glucksmann",
  "Bruno Retailleau", "David Lisnard", "Gabriel Attal", "Éric Zemmour",
  "Marine Tondelier", "Fabien Roussel", "Nicolas Dupont-Aignan", "François Ruffin",
  "Nathalie Arthaud",
];

/** Le cookie par lequel, en test seulement, le serveur apprend le jour simulé. */
const HORLOGE_DE_TEST = "aucrible-horloge-de-test";

/**
 * Fixer le jour pour le navigateur et pour le serveur, qui ne publie que les fiches datées
 * d'aujourd'hui ou avant.
 */
async function fixerLeJour(page: Page, jour: string) {
  await page.clock.setFixedTime(new Date(jour));
  await page.context().addCookies([{ name: HORLOGE_DE_TEST, value: new Date(jour).toISOString(), url: "http://localhost:3127" }]);
}

/** Les options de la fiche, de A à la dernière, sans la carte « Je ne sais pas ». */
const optionsDeLaFiche = (page: Page) =>
  page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio", { name: /^[A-E] / });

/** Passer à la seconde étape de la fiche, celle des propositions, si on est encore sur la première. */
async function voirLesPropositions(page: Page) {
  const bouton = page.getByRole("button", { name: "Voir les propositions" });
  await expect(bouton.or(page.getByRole("radiogroup", { name: "Les options" }))).toBeVisible();
  if (await bouton.isVisible()) await bouton.click();
}

/** Choisir une option comme le fait l'électeur : en touchant sa carte (après « Voir les propositions »). */
async function choisir(page: Page, libelle: string) {
  await voirLesPropositions(page);
  await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).click();
  await expect(page.getByRole("radio", { name: libelle })).toBeChecked();
}

/**
 * L'ordre des questions de l'appareil, d'habitude tiré au hasard : ici du plus grand numéro au plus petit, à chaque
 * page, pour que l'accueil propose d'abord la question la plus récente déjà parue (l'ancienne question du jour).
 */
const fixerLOrdre = (contexte: BrowserContext) =>
  contexte.addInitScript(() => localStorage.setItem("aucrible:ordre", JSON.stringify(Array.from({ length: 1000 }, (_, i) => 1000 - i))));

test.beforeEach(async ({ page }) => {
  await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
  await fixerLOrdre(page.context());
});

test("le 23 octobre 2026, l'accueil affiche la question du jour, ses cinq options et aucun nom de candidat", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);

  await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
  for (const option of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    await expect(page.getByRole("radio", { name: option })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
  for (const nom of CANDIDATS) {
    await expect(page.getByText(nom)).toHaveCount(0);
  }
});

test("valider « À la carte, avec un système à points » révèle Nicolas Dupont-Aignan et Édouard Philippe", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "À la carte, avec un système à points");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  await expect(page).toHaveURL(/\/revelation$/);
  const defenseurs = page.getByRole("list", { name: "Sur ce sujet, tu es aligné·e avec" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(2);
  await expect(defenseurs.getByText("Nicolas Dupont-Aignan")).toBeVisible();
  await expect(defenseurs.getByText("Édouard Philippe")).toBeVisible();
});

test("valider « 62 ans » révèle Marine Le Pen, Marine Tondelier et Raphaël Glucksmann", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "62 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();

  const defenseurs = page.getByRole("list", { name: "Sur ce sujet, tu es aligné·e avec" });
  await expect(defenseurs.getByRole("listitem")).toHaveCount(3);
  for (const nom of ["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]) {
    await expect(defenseurs.getByText(nom)).toBeVisible();
  }
  await expect(defenseurs.getByText("Édouard Philippe")).toHaveCount(0);
});

test("la carte de la question n° 24 affiche la puce « Travail & retraites » au-dessus de la question", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const puce = carte.getByText("Travail & retraites", { exact: true });
  await expect(puce).toBeVisible();
  const question = carte.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const [hautPuce, hautQuestion] = await Promise.all([puce.boundingBox(), question.boundingBox()]);
  expect(hautPuce!.y).toBeLessThan(hautQuestion!.y);
});

test("une question d'un autre thème affiche son propre thème dans la puce", async ({ page }) => {
  await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
  await page.goto("/");
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  await expect(carte.getByText("Écologie & énergie", { exact: true })).toBeVisible();
  await expect(carte.getByText("Travail & retraites", { exact: true })).toHaveCount(0);
});

const ORANGE = "rgb(255, 122, 26)";
const VERT = "rgb(34, 184, 90)";
const fond = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);

test("la question n° 24 (Travail & retraites) s'affiche en orange", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(ORANGE);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(ORANGE);
});

test("une question d'Écologie & énergie s'affiche en vert, et les 11 thèmes ont 11 couleurs", async ({ page }) => {
  await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
  await page.goto("/");
  await voirLesPropositions(page);
  const carte = page.getByRole("article", { name: "Faut-il sortir du nucléaire ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(VERT);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(VERT);

  const couleurs = await page.evaluate(() =>
    ["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"].map((t) => {
      const el = document.createElement("div");
      el.className = `theme-${t}`;
      el.style.background = "var(--theme)";
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    }),
  );
  expect(new Set(couleurs).size).toBe(11);
});

test.describe("numéro et date de la question", () => {
  test("sur téléphone, le bandeau affiche seulement « Question n° 24 »", async ({ page }) => {
    await page.goto("/");
    const numero = page.getByText(/^Question n° 24/);
    await expect(numero).toBeVisible();
    await expect(numero).toHaveText("Question n° 24", { useInnerText: true });
  });

  test("le samedi 24 octobre 2026, la nouvelle question affiche « Question n° 25 »", async ({ page }) => {
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByText(/^Question n° 25/)).toBeVisible();
  });

  test("après validation, la révélation garde « Question n° 24 »", async ({ page }) => {
    await page.goto("/");
    await choisir(page, "62 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24", { useInnerText: true });
  });
});

test.describe("sur ordinateur, le menu est une colonne d'icônes à gauche, et la page commence en haut", () => {
  test.use({ viewport: { width: 1000, height: 550 }, isMobile: false, hasTouch: false });

  test("à 1000 × 550, la question commence en haut de l'écran : ni barre ni bandeau au-dessus, le compte à rebours est en bas du menu", async ({ page }) => {
    await page.goto("/");
    const titre = page.getByRole("heading", { level: 1 }).filter({ visible: true });
    await expect(titre).toHaveText("À quel âge devrait-on pouvoir partir à la retraite ?");
    expect((await titre.boundingBox())!.y).toBeLessThan(150);
    await expect(page.locator(".strip").filter({ visible: true })).toHaveCount(0);
    const compte = page.getByRole("banner").getByLabel("J-177 avant le 1er tour");
    await expect(compte).toBeVisible();
    expect((await compte.boundingBox())!.y).toBeGreaterThan(400);
  });

  test("la révélation aussi commence en haut, sans bandeau", async ({ page }) => {
    await page.goto("/");
    await choisir(page, "62 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByRole("heading", { level: 1, name: "La révélation" }).filter({ visible: true })).toBeVisible();
    await expect(page.locator(".strip").filter({ visible: true })).toHaveCount(0);
  });
});

test("la fiche n° 24 affiche sous « Le contexte » exactement trois phrases, lisibles en entier", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const contexte = carte.getByRole("region", { name: "Le contexte" });
  const phrases = contexte.getByRole("paragraph");
  await expect(phrases).toHaveCount(3);
  await expect(phrases.first()).toHaveText(
    "La réforme de 2023 a commencé à repousser l'âge légal de 62 à 64 ans, puis sa hausse a été suspendue fin 2025.",
  );
  for (const phrase of await phrases.all()) {
    await expect(phrase).toBeVisible();
    expect(await phrase.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  }
});

test("la fiche n° 24 affiche sous « 3 chiffres clés » 1,7, 14 % et 62 ans, chacun avec sa légende", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const chiffres = carte.getByRole("region", { name: "3 chiffres clés" }).getByRole("listitem");
  await expect(chiffres).toHaveCount(3);
  const attendus = [
    ["1,7", "cotisant pour 1 retraité"],
    ["14 %", "du PIB : environ ce que représentent les retraites"],
    ["62 ans", "et 10 mois : l'âge moyen de départ"],
  ];
  for (const [i, [chiffre, legende]] of attendus.entries()) {
    await expect(chiffres.nth(i).getByText(chiffre, { exact: true })).toBeVisible();
    await expect(chiffres.nth(i).getByText(legende, { exact: true })).toBeVisible();
  }
});

/** Les chiffres clés de la fiche du jour, chacun vérifié visible et entier, sans rien de coupé. */
async function chiffresEntiers(page: Page, question: string) {
  const carte = page.getByRole("article", { name: question });
  const chiffres = carte.getByRole("region", { name: /chiffres clés$/ }).getByRole("listitem");
  const boiteCarte = (await carte.boundingBox())!;
  for (const chiffre of await chiffres.all()) {
    await expect(chiffre).toBeVisible();
    const boite = (await chiffre.boundingBox())!;
    expect(boite.x).toBeGreaterThanOrEqual(boiteCarte.x);
    expect(boite.x + boite.width).toBeLessThanOrEqual(boiteCarte.x + boiteCarte.width);
    // Coupé : un texte qui déborde de sa boîte en largeur, ou qu'une boîte rogne en hauteur.
    const coupe = await chiffre.evaluate((el) =>
      [el, ...el.querySelectorAll("*")].some(
        (e) =>
          e.scrollWidth > e.clientWidth + 1 ||
          (getComputedStyle(e).overflowY !== "visible" && e.scrollHeight > e.clientHeight + 1),
      ),
    );
    expect(coupe).toBe(false);
  }
  return chiffres;
}

test.describe("une fiche affiche autant de chiffres clés qu'elle en a", () => {
  test("le 24 octobre, la fiche à deux chiffres clés en affiche deux", async ({ page }) => {
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "2 chiffres clés" })).toBeVisible();
    await expect(await chiffresEntiers(page, "Faut-il sortir du nucléaire ?")).toHaveCount(2);
  });

  test("le 25 octobre, la fiche à quatre chiffres clés en affiche quatre", async ({ page }) => {
    await fixerLeJour(page, "2026-10-25T09:00:00+01:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "4 chiffres clés" })).toBeVisible();
    await expect(await chiffresEntiers(page, "Faut-il réguler l'installation des médecins ?")).toHaveCount(4);
  });
});

test.describe("une fiche affiche autant de chiffres clés qu'elle en a, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("la fiche à quatre chiffres clés les affiche tous les quatre, entiers", async ({ page }) => {
    await fixerLeJour(page, "2026-10-25T09:00:00+01:00");
    await page.goto("/");
    await expect(await chiffresEntiers(page, "Faut-il réguler l'installation des médecins ?")).toHaveCount(4);
  });
});

test("sur la fiche n° 24, chaque chiffre clé est suivi de sa source datée", async ({ page }) => {
  await page.goto("/");
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  const chiffres = carte.getByRole("region", { name: "3 chiffres clés" }).getByRole("listitem");
  const attendus = [
    ["1,7", "Source : COR, rapport 2025"],
    ["14 %", "Source : COR, 2025"],
    ["62 ans", "Source : DREES, 2025"],
  ];
  for (const [i, [chiffre, source]] of attendus.entries()) {
    const nombre = chiffres.nth(i).getByText(chiffre, { exact: true });
    const ligne = chiffres.nth(i).getByText(source, { exact: true });
    await expect(ligne).toBeVisible();
    const [haut, bas] = await Promise.all([nombre.boundingBox(), ligne.boundingBox()]);
    expect(bas!.y).toBeGreaterThan(haut!.y);
  }
});

test("sur aucune fiche un chiffre clé n'apparaît sans son organisme ni son année", async ({ page }) => {
  const fiches = [
    ["2026-10-23T09:00:00+02:00", "À quel âge devrait-on pouvoir partir à la retraite ?"],
    ["2026-10-24T09:00:00+02:00", "Faut-il sortir du nucléaire ?"],
    ["2026-10-25T09:00:00+01:00", "Faut-il réguler l'installation des médecins ?"],
  ];
  for (const [jour, question] of fiches) {
    await fixerLeJour(page, jour);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    // Entiers : une source rognée par les points de suspension perdrait son année.
    for (const chiffre of await (await chiffresEntiers(page, question)).all()) {
      await expect(chiffre.getByText(/^Source : \S.*, (.+ )?(19|20)\d{2}$/)).toBeVisible();
    }
  }
});

/** Les lettres des cartes réponse, dans l'ordre où l'électeur les voit. */
async function lettresDesOptions(page: Page) {
  await voirLesPropositions(page);
  const options = optionsDeLaFiche(page);
  await expect(options.first()).toBeAttached();
  const lettres = [];
  for (const option of await options.all()) {
    const lettre = option.locator("xpath=..").locator(".opt-letter");
    await expect(lettre).toBeVisible();
    lettres.push(await lettre.innerText());
  }
  return lettres;
}

test("les cinq cartes réponse de la question n° 24 portent, dans l'ordre, les lettres A à E", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D", "E"]);
  const options = optionsDeLaFiche(page);
  await expect(options.nth(0)).toHaveAccessibleName("A 60 ans");
  await expect(options.nth(4)).toHaveAccessibleName("E À la carte, avec un système à points");
});

test("une fiche à trois options affiche A, B, C seulement ; une fiche à quatre, A à D", async ({ page }) => {
  await fixerLeJour(page, "2026-10-25T09:00:00+01:00");
  await page.goto("/");
  await voirLesPropositions(page);
  await expect(page.getByRole("heading", { name: "Faut-il réguler l'installation des médecins ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C"]);

  await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faut-il sortir du nucléaire ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D"]);
});

test("chaque option de la question n° 24 dit, sous son titre et sans la toucher, ce qu'elle implique", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const options = optionsDeLaFiche(page);
  await expect(options).toHaveCount(5);
  const attendues: Record<number, string> = {
    0: "Retour à l'âge légal d'avant 2010, financé par de nouvelles cotisations.",
    4: "Chacun part quand il veut ; la pension dépend des points acquis.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const carte = option.locator("xpath=..");
    const titre = carte.locator(".opt-title");
    const implication = carte.locator(".opt-impl");
    await expect(implication).toBeVisible();
    await expect(implication).not.toBeEmpty();
    if (attendues[rang]) await expect(implication).toHaveText(attendues[rang]);
    const [haut, bas] = await Promise.all([titre.boundingBox(), implication.boundingBox()]);
    expect(bas!.y).toBeGreaterThan(haut!.y);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

/** Les noms des candidats, leurs noms de famille et leurs partis, lus dans le contenu, plus les partis en toutes lettres et les sigles courants. */
const NOMS_ET_PARTIS: string[] = [
  ...(parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string; parti: string }[]).flatMap((c) => [
    c.nom,
    c.nom.split(" ").slice(1).join(" "),
    c.parti,
  ]),
  ...["Rassemblement national", "La France insoumise", "Place publique", "Parti socialiste", "Les Républicains", "Parti communiste français", "Debout la France", "Lutte ouvrière"],
];
const SIGLES = /\b(RN|LFI|LR|PS|PCF|EELV|LO|NPA|DLF|UDI|MoDem)\b/;
/** Un nom ou un parti n'est trouvé qu'en mot entier : les sigles du contenu (RN, LR, LO…) ne sont pas des bouts de mots. */
const enMotEntier = (n: string) => new RegExp(`(?<!\\p{L})${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\p{L})`, "u");
const nomsOuPartisDans = (texte: string) => [
  ...NOMS_ET_PARTIS.filter((n) => enMotEntier(n).test(texte)),
  ...(texte.match(SIGLES) ?? []).slice(0, 1),
];

test("chaque option de la question n° 24 dit ce qu'en disent ses défenseurs, lisible sans rien choisir, sans nom ni parti", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const options = optionsDeLaFiche(page);
  await expect(options).toHaveCount(5);
  const attendus: Record<number, string> = {
    0: "Deux ans de retraite en bonne santé en plus, d'abord pour ceux qui ont commencé tôt.",
    3: "On vit plus longtemps : travailler un peu plus protège le niveau des pensions.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const bloc = option.locator("xpath=..").getByText("Ce qu'en disent ses défenseurs", { exact: true }).locator("xpath=..");
    await expect(bloc).toBeVisible();
    const argument = (await bloc.innerText()).replace("Ce qu'en disent ses défenseurs", "").trim();
    expect(argument.length).toBeGreaterThan(10);
    if (attendus[rang]) expect(argument).toBe(attendus[rang]);
    expect(nomsOuPartisDans(argument)).toEqual([]);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

/** Le texte de chaque bloc d'arguments portant ce titre, sur la fiche de chaque jour de démonstration. */
async function argumentsDesFiches(page: Page, titre: string) {
  const textes: string[] = [];
  for (const jour of ["2026-10-23T09:00:00+02:00", "2026-10-24T09:00:00+02:00", "2026-10-25T09:00:00+01:00"]) {
    await fixerLeJour(page, jour);
    await page.goto("/");
    await voirLesPropositions(page);
    const options = optionsDeLaFiche(page);
    await expect(options.first()).toBeAttached();
    for (const option of await options.all()) {
      const bloc = option.locator("xpath=..").getByText(titre, { exact: true }).locator("xpath=..");
      await expect(bloc).toBeVisible();
      textes.push((await bloc.innerText()).replace(titre, "").trim());
    }
  }
  return textes;
}

test("sur aucune fiche, ce qu'en disent les défenseurs ne nomme un candidat ou un parti", async ({ page }) => {
  const textes = await argumentsDesFiches(page, "Ce qu'en disent ses défenseurs");
  expect(textes).toHaveLength(5 + 4 + 3);
  for (const texte of textes) expect(nomsOuPartisDans(texte), texte).toEqual([]);
});

test("chaque option de la question n° 24 dit ce que lui reprochent ses critiques, lisible sans rien choisir", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const options = optionsDeLaFiche(page);
  await expect(options).toHaveCount(5);
  const attendus: Record<number, string> = {
    0: "Un coût élevé, qui pèserait sur les salaires ou sur les entreprises.",
    4: "La valeur du point peut baisser : la pension devient moins prévisible.",
  };
  for (const [rang, option] of (await options.all()).entries()) {
    const bloc = option.locator("xpath=..").getByText("Ce que lui reprochent ses critiques", { exact: true }).locator("xpath=..");
    await expect(bloc).toBeVisible();
    const critique = (await bloc.innerText()).replace("Ce que lui reprochent ses critiques", "").trim();
    expect(critique.length).toBeGreaterThan(10);
    if (attendus[rang]) expect(critique).toBe(attendus[rang]);
  }
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

test("sur aucune fiche, ce que reprochent les critiques ne nomme un candidat ou un parti", async ({ page }) => {
  const textes = await argumentsDesFiches(page, "Ce que lui reprochent ses critiques");
  expect(textes).toHaveLength(5 + 4 + 3);
  for (const texte of textes) expect(nomsOuPartisDans(texte), texte).toEqual([]);
});

test.describe("les arguments des options, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("les titres « Ce qu'en disent ses défenseurs » et « Ce que lui reprochent ses critiques » se lisent en entier", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    for (const titre of ["Ce qu'en disent ses défenseurs", "Ce que lui reprochent ses critiques"]) {
      const titres = page.getByRole("radiogroup", { name: "Les options" }).getByText(titre, { exact: true });
      await expect(titres).toHaveCount(5);
      for (const t of await titres.all()) {
        await expect(t).toBeVisible();
        expect(await t.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), titre).toBe(true);
      }
    }
  });
});

test("au-dessus des options, ni titre ni phrase d'explication : les options viennent directement", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choisis ta carte" })).toHaveCount(0);
  await expect(page.getByText(/Les noms des candidats s'affichent/)).toHaveCount(0);
  await expect(page.locator(".answer-head")).toHaveCount(0);
  await expect(page.getByText("Tu passes.", { exact: true })).toHaveCount(0);
});

test.describe("sur ordinateur, la carte question se pose à côté des cartes réponse", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("à 1280 px, la carte question est à gauche et les cartes réponse à droite, côte à côte", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    const options = page.getByRole("radiogroup", { name: "Les options" });
    const [c, o] = await Promise.all([carte.boundingBox(), options.boundingBox()]);
    expect(c!.x + c!.width).toBeLessThanOrEqual(o!.x);
    expect(c!.y).toBeLessThan(o!.y + o!.height);
    expect(o!.y).toBeLessThan(c!.y + c!.height);
  });

  test("en défilant les cinq options, la carte question reste visible à gauche", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    for (const libelle of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
      await voirLesPropositions(page);
      await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).scrollIntoViewIfNeeded();
      await expect(carte).toBeInViewport({ ratio: 0.9 });
    }
    // Sans bandeau au-dessus, la page défile moins qu'avant : ce qui compte, c'est qu'elle ait défilé.
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});

test.describe("sur un petit téléphone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("à 375 px, la carte question vient d'abord, puis les cartes réponse en dessous", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    const options = page.getByRole("radiogroup", { name: "Les options" });
    const [c, o] = await Promise.all([carte.boundingBox(), options.boundingBox()]);
    expect(c!.y + c!.height).toBeLessThanOrEqual(o!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

/** La carte réponse (le libellé cliquable) d'une option. */
const carteReponse = (page: Page, libelle: string) =>
  page.getByRole("radiogroup", { name: "Les options" }).locator("label").filter({ has: page.getByRole("radio", { name: libelle }) });

test("toucher « 64 ans » colore la carte C, la soulève et la marque « Ta carte » ; les autres restent blanches", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  const choisie = carteReponse(page, "64 ans");
  await expect(choisie.getByText("Ta carte", { exact: true })).toBeVisible();
  const face = choisie.locator(".opt-face");
  await expect.poll(() => fond(face)).toBe(ORANGE);
  expect(await face.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");

  for (const libelle of ["60 ans", "62 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    const autre = carteReponse(page, libelle);
    expect(await fond(autre.locator(".opt-face"))).toBe("rgb(255, 255, 255)");
    await expect(autre.getByText("Ta carte", { exact: true })).toBeHidden();
  }
});

test("avec « réduire les animations », la carte choisie est marquée aussitôt, sans mouvement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await voirLesPropositions(page);
  await carteReponse(page, "64 ans").getByText("64 ans", { exact: true }).click();
  const choisie = carteReponse(page, "64 ans");
  const etat = await choisie.evaluate((el) => ({
    animations: document.getAnimations().length,
    fond: getComputedStyle(el.querySelector(".opt-face")!).backgroundColor,
    etiquette: getComputedStyle(el.querySelector(".picked")!).opacity,
  }));
  expect(etat).toEqual({ animations: 0, fond: ORANGE, etiquette: "1" });
  await expect(choisie.getByText("Ta carte", { exact: true })).toBeVisible();
});

test("choisir A puis B, sans valider, fait passer « Ta carte » de A à B", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "60 ans");
  await expect(carteReponse(page, "60 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await choisir(page, "62 ans");
  await expect(carteReponse(page, "62 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await expect(carteReponse(page, "60 ans").getByText("Ta carte", { exact: true })).toBeHidden();
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
});

test("après A puis B et validation, la révélation nomme les défenseurs de B, pas ceux de A", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "60 ans");
  await choisir(page, "62 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  const defenseurs = page.getByRole("list", { name: "Sur ce sujet, tu es aligné·e avec" });
  for (const nom of ["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]) await expect(defenseurs.getByText(nom)).toBeVisible();
  for (const nom of ["Jean-Luc Mélenchon", "Fabien Roussel", "Nathalie Arthaud"]) await expect(defenseurs.getByText(nom)).toHaveCount(0);
});

/**
 * Ce que l'app a gardé de l'électeur, sans l'ordre des questions de l'appareil ni le jour où sa visite a été comptée
 * (ticket 192) : ni l'un ni l'autre n'est une réponse.
 */
const reponsesEnregistrees = (page: Page) =>
  page.evaluate(() =>
    [...Object.keys(sessionStorage), ...Object.keys(localStorage)].filter((cle) => cle.startsWith("aucrible") && cle !== "aucrible:ordre" && cle !== "aucrible:visite"),
  );

test("sans rien choisir, « Valider ma réponse » est inactif : le toucher n'ouvre pas la révélation et n'enregistre rien", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const valider = page.getByRole("button", { name: "Valider ma réponse" });
  await expect(valider).toBeVisible();
  await expect(valider).toBeDisabled();
  await valider.click({ force: true });
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/$/);
  expect(await reponsesEnregistrees(page)).toEqual([]);
});

test("dès qu'une option est choisie, « Valider ma réponse » ouvre la révélation", async ({ page }) => {
  await page.goto("/");
  const valider = page.getByRole("button", { name: "Valider ma réponse" });
  await choisir(page, "65 ans ou plus");
  await expect(valider).toBeEnabled();
  await valider.click();
  await expect(page).toHaveURL(/\/revelation$/);
});

test("choisir « Je ne sais pas » puis valider enregistre la réponse et ouvre la révélation de la question n° 24", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "Je ne sais pas");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toBeVisible();
  expect(await reponsesEnregistrees(page)).not.toEqual([]);
});

test("choisir « Je ne sais pas » après « 64 ans » décoche « 64 ans » : une seule carte est choisie", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  await choisir(page, "Je ne sais pas");
  await expect(page.getByRole("radio", { name: "64 ans" })).not.toBeChecked();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(0);
});

const importance = (page: Page) => page.getByRole("group", { name: "Ce sujet compte pour toi ?" });

/** Choisir une importance comme le fait l'électeur : en touchant sa carte. */
async function peser(page: Page, poids: "×1" | "×2" | "×3") {
  await importance(page).getByText(poids, { exact: true }).click();
  await expect(importance(page).getByRole("radio", { name: new RegExp(`^${poids} `) })).toBeChecked();
}

test("sous « Ce sujet compte pour toi ? », la fiche n° 24 propose ×1 « Un peu », ×2 « Beaucoup », ×3 « Essentiel »", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  const choix = importance(page).getByRole("radio");
  await expect(choix).toHaveCount(3);
  for (const [rang, nom] of ["×1 Un peu", "×2 Beaucoup", "×3 Essentiel"].entries()) {
    await expect(choix.nth(rang)).toHaveAccessibleName(nom);
    await expect(importance(page).getByText(nom.split(" ")[0], { exact: true })).toBeVisible();
  }
  const [options, groupe] = await Promise.all([page.getByRole("radiogroup", { name: "Les options" }).boundingBox(), importance(page).boundingBox()]);
  expect(groupe!.y).toBeGreaterThan(options!.y + options!.height - 1);
});

test("toucher ×3 marque ×3 et décoche le choix précédent ; un seul est marqué à la fois", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  await peser(page, "×1");
  await peser(page, "×3");
  await expect(importance(page).getByRole("radio", { name: /^×1 / })).not.toBeChecked();
  await expect(importance(page).getByRole("radio", { checked: true })).toHaveCount(1);
});

test("changer d'importance ne change pas l'option choisie : « Ta carte » reste sur la même carte", async ({ page }) => {
  await page.goto("/");
  await choisir(page, "64 ans");
  await peser(page, "×2");
  await peser(page, "×3");
  await expect(page.getByRole("radio", { name: "64 ans" })).toBeChecked();
  await expect(carteReponse(page, "64 ans").getByText("Ta carte", { exact: true })).toBeVisible();
  await expect(page.getByText("Ta carte", { exact: true }).filter({ visible: true })).toHaveCount(1);
});

/** Répondre à la question du jour et arriver sur sa révélation. */
async function repondre(page: Page, libelle: string) {
  // Repartir d'un appareil sans réponse : une question déjà répondue rouvre sur sa révélation.
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("/");
  await choisir(page, libelle);
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  await expect(quiDefendQuoi(page)).toBeVisible();
}

const quiDefendQuoi = (page: Page) => page.getByRole("region", { name: "Qui défend quoi" });
/** Les blocs des options A à E, sans celui des positions inconnues. */
const blocsDOption = (page: Page) => quiDefendQuoi(page).getByRole("article", { name: /^Option / });

/** Les noms posés sous un bloc d'option de la révélation, triés (l'ordre affiché est l'affaire du ticket 025). */
async function nomsSous(page: Page, option: string) {
  const bloc = quiDefendQuoi(page).getByRole("article", { name: option });
  await expect(bloc).toBeVisible();
  return (await bloc.getByRole("listitem").locator(".def-name").allInnerTexts()).map((t) => t.trim()).sort();
}

test("la révélation de la question n° 24 nomme, sous chaque option, les candidats qui la défendent", async ({ page }) => {
  await repondre(page, "62 ans");
  expect(await nomsSous(page, "Option A : 60 ans")).toEqual(["Fabien Roussel", "Jean-Luc Mélenchon", "Nathalie Arthaud"]);
  expect(await nomsSous(page, "Option B : 62 ans")).toEqual(["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]);
  expect(await nomsSous(page, "Option C : 64 ans")).toEqual(["Gabriel Attal", "Éric Zemmour"]);
  expect(await nomsSous(page, "Option D : 65 ans ou plus")).toEqual(["Bruno Retailleau"]);
  expect(await nomsSous(page, "Option E : À la carte, avec un système à points")).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
});

test("quelle que soit la réponse, les cinq blocs s'affichent, annoncent leur nombre de candidats, et nul n'apparaît deux fois", async ({ page }) => {
  const attendus = { A: "3 candidats", B: "3 candidats", C: "2 candidats", D: "1 candidat", E: "2 candidats" };
  for (const reponse of ["60 ans", "À la carte, avec un système à points", "Je ne sais pas"]) {
    await repondre(page, reponse);
    const blocs = blocsDOption(page);
    await expect(blocs).toHaveCount(5);
    const tous: string[] = [];
    for (const [rang, [lettre, compte]] of Object.entries(attendus).entries()) {
      const bloc = blocs.nth(rang);
      await expect(bloc).toHaveAccessibleName(new RegExp(`^Option ${lettre} : `));
      await expect(bloc.getByText(compte, { exact: true })).toBeVisible();
      const noms = await bloc.getByRole("listitem").locator(".def-name").allInnerTexts();
      expect(`${noms.length} candidat${noms.length > 1 ? "s" : ""}`).toBe(compte);
      tous.push(...noms);
    }
    expect(new Set(tous).size).toBe(tous.length);
  }
});

test.describe("la révélation rappelle l'option choisie", () => {
  for (const [lettre, libelle] of [["E", "À la carte, avec un système à points"], ["B", "62 ans"]]) {
    test(`après ${lettre} (${libelle}), l'encart « Ta réponse » l'affiche et « Ta carte » est sur le bloc ${lettre}, nulle part ailleurs`, async ({ page }) => {
      await repondre(page, libelle);
      const encart = page.getByRole("region", { name: `Ta réponse : ${lettre} · ${libelle}` });
      await expect(encart).toBeVisible();
      await expect(encart.getByText(lettre, { exact: true })).toBeVisible();
      await expect(encart.getByText(libelle, { exact: true })).toBeVisible();
      const bloc = quiDefendQuoi(page).getByRole("article", { name: `Option ${lettre} : ${libelle}` });
      await expect(bloc.getByText("Ta carte", { exact: true })).toBeVisible();
      await expect(quiDefendQuoi(page).getByText("Ta carte", { exact: true })).toHaveCount(1);
    });
  }
});

test.describe("la révélation rappelle l'importance donnée", () => {
  for (const [poids, pleines] of [["×1", 1], ["×2", 2], ["×3", 3]] as const) {
    test(`après validation avec ${poids}, l'encart affiche « Importance ${poids} » avec ${pleines} pastille(s) pleine(s) sur 3`, async ({ page }) => {
      await page.goto("/");
      await choisir(page, "62 ans");
      await peser(page, poids);
      await page.getByRole("button", { name: "Valider ma réponse" }).click();
      const encart = page.getByRole("region", { name: `Ta réponse : B · 62 ans. Importance ${poids}` });
      await expect(encart.getByText(`Importance ${poids}`, { exact: true })).toBeVisible();
      const pastilles = encart.locator(".chips i");
      await expect(pastilles).toHaveCount(3);
      await expect(encart.locator(".chips i.off")).toHaveCount(3 - pleines);
    });
  }
});

/** La ligne de source posée sous le nom d'un candidat révélé. */
const sourceDe = (page: Page, nom: string) =>
  quiDefendQuoi(page).getByRole("listitem").filter({ has: page.getByText(nom, { exact: true }) }).locator(".def-doc");

test("sur la révélation n° 24, chaque nom est suivi de la source datée de sa position", async ({ page }) => {
  await repondre(page, "62 ans");
  const attendues = {
    "Fabien Roussel": "Interview franceinfo, 21/09/2026",
    "Nathalie Arthaud": "Programme 2022, p. 6",
    "Marine Le Pen": "Vote du groupe à l'Assemblée, 2023",
    "Bruno Retailleau": "Discours de rentrée, 12/09/2026",
  };
  for (const [nom, source] of Object.entries(attendues)) {
    await expect(sourceDe(page, nom)).toHaveText(source);
    const [n, s] = await Promise.all([quiDefendQuoi(page).getByText(nom, { exact: true }).boundingBox(), sourceDe(page, nom).boundingBox()]);
    expect(s!.y).toBeGreaterThan(n!.y);
  }
});

test("les 11 candidats rangés sous une option ont tous une source, lisible en entier", async ({ page }) => {
  await repondre(page, "62 ans");
  const lignes = blocsDOption(page).getByRole("listitem");
  await expect(lignes).toHaveCount(11);
  for (const ligne of await lignes.all()) {
    const source = ligne.locator(".def-doc");
    await expect(source).toBeVisible();
    expect((await source.innerText()).trim().length).toBeGreaterThan(3);
    expect(await source.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});

/** La ligne d'un candidat révélé, sous son option. */
const ligneDe = (page: Page, nom: string) =>
  quiDefendQuoi(page).getByRole("listitem").filter({ has: page.getByText(nom, { exact: true }) });

test("sur la révélation n° 24, Roussel porte « position officielle », Arthaud et Le Pen « position déduite »", async ({ page }) => {
  await repondre(page, "62 ans");
  await expect(ligneDe(page, "Fabien Roussel").getByText("position officielle", { exact: true })).toBeVisible();
  for (const nom of ["Nathalie Arthaud", "Marine Le Pen"]) {
    await expect(ligneDe(page, nom).getByText("position déduite", { exact: true })).toBeVisible();
  }
});

test("les 11 candidats sourcés portent l'un ou l'autre badge, jamais les deux : 5 officielles, 6 déduites", async ({ page }) => {
  await repondre(page, "62 ans");
  const lignes = blocsDOption(page).getByRole("listitem");
  await expect(lignes).toHaveCount(11);
  let officielles = 0;
  let deduites = 0;
  for (const ligne of await lignes.all()) {
    const o = await ligne.getByText("position officielle", { exact: true }).filter({ visible: true }).count();
    const d = await ligne.getByText("position déduite", { exact: true }).filter({ visible: true }).count();
    expect(o + d).toBe(1);
    officielles += o;
    deduites += d;
  }
  expect({ officielles, deduites }).toEqual({ officielles: 5, deduites: 6 });
});

test("sur la révélation n° 24, Ruffin et Lisnard sont rangés sous « Position inconnue », sans source, avec leur badge", async ({ page }) => {
  await repondre(page, "62 ans");
  const bloc = quiDefendQuoi(page).getByRole("article", { name: "Position inconnue" });
  await expect(bloc.getByText("2 candidats", { exact: true })).toBeVisible();
  expect(await nomsSous(page, "Position inconnue")).toEqual(["David Lisnard", "François Ruffin"]);
  for (const ligne of await bloc.getByRole("listitem").all()) {
    await expect(ligne.getByText("Pas de source à ce jour", { exact: true })).toBeVisible();
    await expect(ligne.getByText("position inconnue", { exact: true })).toBeVisible();
  }
});

test("les candidats sans source n'apparaissent sous aucune option : 11 sous les options, 2 inconnus, 13 en tout", async ({ page }) => {
  await repondre(page, "62 ans");
  const sousOptions = await blocsDOption(page).getByRole("listitem").locator(".def-name").allInnerTexts();
  const inconnus = await nomsSous(page, "Position inconnue");
  expect(sousOptions).toHaveLength(11);
  expect(inconnus).toHaveLength(2);
  expect(new Set([...sousOptions, ...inconnus]).size).toBe(13);
  for (const nom of inconnus) expect(sousOptions).not.toContain(nom);
});

test("la mention « ordre mélangé » se lit à côté de « Qui défend quoi »", async ({ page }) => {
  await repondre(page, "62 ans");
  const titre = quiDefendQuoi(page).getByRole("heading", { name: "Qui défend quoi" });
  const mention = quiDefendQuoi(page).getByText("ordre mélangé", { exact: true });
  await expect(mention).toBeVisible();
  const [t, m] = await Promise.all([titre.boundingBox(), mention.boundingBox()]);
  expect(m!.x).toBeGreaterThan(t!.x + t!.width - 1);
  expect(Math.abs(m!.y + m!.height / 2 - (t!.y + t!.height / 2))).toBeLessThan(t!.height);
});

test("d'un appareil à l'autre, l'ordre des défenseurs de A change, sans suivre l'alphabet ni les partis", async ({ browser }) => {
  // Seize appareils l'un après l'autre : 20 à 30 s, au bord des 30 s d'un test ordinaire quand la suite tourne.
  test.slow();
  const ordres = new Set<string>();
  for (let appareil = 0; appareil < 16; appareil++) {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await fixerLOrdre(contexte);
    const page = await contexte.newPage();
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await repondre(page, "62 ans");
    const bloc = quiDefendQuoi(page).getByRole("article", { name: "Option A : 60 ans" });
    await expect(bloc.getByRole("listitem")).toHaveCount(3);
    ordres.add((await bloc.locator(".def-name").allInnerTexts()).join(" / "));
    await contexte.close();
  }
  // Six ordres possibles : au moins trois différents, donc au moins un qui n'est ni alphabétique ni celui des partis.
  expect(ordres.size).toBeGreaterThanOrEqual(3);
});

const INITIALES = {
  "Fabien Roussel": "FRo", "Nathalie Arthaud": "NA", "Jean-Luc Mélenchon": "JLM", "Marine Le Pen": "MLP",
  "Marine Tondelier": "MT", "Raphaël Glucksmann": "RG", "Éric Zemmour": "ÉZ", "Gabriel Attal": "GA",
  "Bruno Retailleau": "BR", "Nicolas Dupont-Aignan": "NDA", "Édouard Philippe": "ÉP", "François Ruffin": "FRu",
  "David Lisnard": "DL",
};

/** Le pion de chaque candidat révélé : ses initiales, sa forme, sa teinte. */
async function pionsDeLaRevelation(page: Page) {
  const pions: Record<string, { initiales: string; forme: string; teinte: string }> = {};
  for (const ligne of await quiDefendQuoi(page).getByRole("listitem").all()) {
    const nom = (await ligne.locator(".def-name").innerText()).trim();
    const pion = ligne.locator(".pawn");
    await expect(pion).toBeVisible();
    pions[nom] = await pion.evaluate((el) => {
      const s = getComputedStyle(el);
      return { initiales: el.textContent!.trim(), forme: `${s.width}×${s.height} ${s.borderRadius}`, teinte: s.backgroundColor };
    });
  }
  return pions;
}

test("sur la révélation n° 24, les 13 candidats ont le même pion à leurs initiales, sans couleur de parti", async ({ page }) => {
  await repondre(page, "62 ans");
  const pions = await pionsDeLaRevelation(page);
  expect(Object.fromEntries(Object.entries(pions).map(([nom, p]) => [nom, p.initiales]))).toEqual(INITIALES);
  expect(new Set(Object.values(pions).map((p) => p.forme)).size).toBe(1);
  // Une seule teinte sous les options, une seule (la variante claire) sous « Position inconnue » : jamais une teinte par candidat.
  const sousOptions = new Set(Object.entries(pions).filter(([nom]) => !["François Ruffin", "David Lisnard"].includes(nom)).map(([, p]) => p.teinte));
  const inconnus = new Set([pions["François Ruffin"].teinte, pions["David Lisnard"].teinte]);
  expect(sousOptions.size).toBe(1);
  expect(inconnus.size).toBe(1);
  const neutres = await page.evaluate(() =>
    ["--ink", "--pawn"].map((jeton) => {
      const el = document.createElement("div");
      el.style.background = `var(${jeton})`;
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    }),
  );
  expect(neutres).toEqual([...sousOptions, ...inconnus]);
});

test("les initiales distinguent les candidats qui se ressemblent : FRo pour Fabien Roussel, FRu pour François Ruffin", async ({ page }) => {
  await repondre(page, "62 ans");
  const pions = await pionsDeLaRevelation(page);
  expect(pions["Fabien Roussel"].initiales).toBe("FRo");
  expect(pions["François Ruffin"].initiales).toBe("FRu");
  expect(new Set(Object.values(pions).map((p) => p.initiales)).size).toBe(13);
});

const alignes = (page: Page) => page.getByRole("list", { name: "Sur ce sujet, tu es aligné·e avec" });
const nomsDe = async (liste: import("@playwright/test").Locator) =>
  (await liste.getByRole("listitem").allInnerTexts()).map((t) => t.replace(/^\S+\s+/, "").trim()).sort();

test("après E, la révélation dit « Sur ce sujet, tu es aligné·e avec » Nicolas Dupont-Aignan et Édouard Philippe", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByRole("heading", { name: "Sur ce sujet, tu es aligné·e avec" })).toBeVisible();
  expect(await nomsDe(alignes(page))).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
});

test("après B, aligné·e avec Le Pen, Tondelier et Glucksmann ; Ruffin et Lisnard n'y figurent jamais", async ({ page }) => {
  await repondre(page, "62 ans");
  expect(await nomsDe(alignes(page))).toEqual(["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]);
  for (const libelle of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
    await repondre(page, libelle);
    await expect(alignes(page).getByRole("listitem").first()).toBeVisible();
    for (const nom of ["François Ruffin", "David Lisnard"]) await expect(alignes(page).getByText(nom)).toHaveCount(0);
  }
});

test("sous les listes, pas de note qui définit « aligné·e », « proche » et « opposé·e » : les titres se lisent seuls", async ({ page }) => {
  await repondre(page, "62 ans");
  await expect(page.getByRole("heading", { name: "Sur ce sujet, tu es aligné·e avec" })).toBeVisible();
  await expect(page.getByText(/même carte que toi/)).toHaveCount(0);
  await expect(page.locator(".align-note")).toHaveCount(0);
});

const proches = (page: Page) => page.getByRole("list", { name: "et proche de" });

test("après E, la révélation dit « et proche de » Bruno Retailleau (D, voisine de E)", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByRole("heading", { name: "et proche de" })).toBeVisible();
  expect(await nomsDe(proches(page))).toEqual(["Bruno Retailleau"]);
});

test("après A, la révélation dit « et proche de » Le Pen, Tondelier et Glucksmann (B, voisine de A)", async ({ page }) => {
  await repondre(page, "60 ans");
  expect(await nomsDe(proches(page))).toEqual(["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]);
});

const opposes = (page: Page) => page.getByRole("list", { name: "opposé·e à" });

test("après E, la révélation dit « opposé·e à » Mélenchon, Roussel et Arthaud (A), avec des pions clairs", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByRole("heading", { name: "opposé·e à" })).toBeVisible();
  expect(await nomsDe(opposes(page))).toEqual(["Fabien Roussel", "Jean-Luc Mélenchon", "Nathalie Arthaud"]);
  const [clair, sombre] = await Promise.all([
    opposes(page).locator(".pawn").first().evaluate((el) => getComputedStyle(el).backgroundColor),
    alignes(page).locator(".pawn").first().evaluate((el) => getComputedStyle(el).backgroundColor),
  ]);
  expect(clair).not.toBe(sombre);
});

test("après A, la révélation dit « opposé·e à » Nicolas Dupont-Aignan et Édouard Philippe (E)", async ({ page }) => {
  await repondre(page, "60 ans");
  expect(await nomsDe(opposes(page))).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
});

test("après « Je ne sais pas », la révélation montre les cinq options, leurs candidats et « Position inconnue »", async ({ page }) => {
  await repondre(page, "Je ne sais pas");
  await expect(blocsDOption(page)).toHaveCount(5);
  expect(await nomsSous(page, "Option A : 60 ans")).toEqual(["Fabien Roussel", "Jean-Luc Mélenchon", "Nathalie Arthaud"]);
  expect(await nomsSous(page, "Option E : À la carte, avec un système à points")).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
  expect(await nomsSous(page, "Position inconnue")).toEqual(["David Lisnard", "François Ruffin"]);
});

test("après « Je ne sais pas », la révélation n'affiche ni aligné·e, ni proche, ni opposé·e", async ({ page }) => {
  await repondre(page, "Je ne sais pas");
  await expect(blocsDOption(page).first()).toBeVisible();
  for (const texte of ["Sur ce sujet, tu es aligné·e avec", "et proche de", "opposé·e à"]) {
    await expect(page.getByText(texte)).toHaveCount(0);
  }
  await expect(page.getByRole("region", { name: "Alignement sur ce sujet" })).toHaveCount(0);
});

/** Le minutage du retournement de chaque bloc de « Qui défend quoi », dans l'ordre de la page. */
const minutages = (page: Page) =>
  quiDefendQuoi(page)
    .getByRole("article")
    .evaluateAll((blocs) =>
      blocs.map((bloc) => {
        const animations = bloc.getAnimations();
        const timing = animations[0]?.effect?.getComputedTiming();
        return {
          nom: bloc.getAttribute("aria-labelledby"),
          animations: animations.length,
          debut: Number(timing?.delay ?? 0),
          fin: Number(timing?.endTime ?? 0),
        };
      }),
    );

test("en arrivant sur la révélation, les blocs A à E puis « Position inconnue » se retournent l'un après l'autre, tous posés en moins de 2 s", async ({ page }) => {
  await repondre(page, "62 ans");
  const blocs = await minutages(page);
  expect(blocs).toHaveLength(6);
  for (const bloc of blocs) expect(bloc.animations).toBe(1);
  for (let i = 1; i < blocs.length; i++) expect(blocs[i].debut).toBeGreaterThan(blocs[i - 1].debut);
  expect(Math.max(...blocs.map((b) => b.fin))).toBeLessThan(2000);
  await page.waitForTimeout(2000);
  const poses = await quiDefendQuoi(page).getByRole("article").evaluateAll((bs) => bs.map((b) => [getComputedStyle(b).opacity, getComputedStyle(b).transform]));
  // Posé : opaque, sans rotation ni décalage (la fin du retournement laisse la matrice identité).
  for (const [opacite, transformation] of poses) {
    expect(opacite).toBe("1");
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transformation);
  }
});

test("avec « réduire les animations », les blocs sont posés d'emblée, sans retournement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await repondre(page, "62 ans");
  const blocs = await minutages(page);
  expect(blocs).toHaveLength(6);
  for (const bloc of blocs) expect(bloc.animations).toBe(0);
  const poses = await quiDefendQuoi(page).getByRole("article").evaluateAll((bs) => bs.map((b) => getComputedStyle(b).opacity));
  expect(poses).toEqual(["1", "1", "1", "1", "1", "1"]);
});

const pourAllerPlusLoin = (page: Page) => page.getByRole("region", { name: "Pour aller plus loin" });

test("la révélation n° 24 propose sous « Pour aller plus loin » trois liens vers le COR, la DREES et la Cour des comptes", async ({ page }) => {
  await repondre(page, "62 ans");
  const liens = pourAllerPlusLoin(page).getByRole("link");
  await expect(liens).toHaveCount(3);
  for (const [rang, nom] of ["COR, rapport annuel 2025", "DREES, Les retraités et les retraites, 2025", "Cour des comptes, retraites, 2025"].entries()) {
    await expect(liens.nth(rang)).toHaveAccessibleName(new RegExp(`^${nom}`));
    await expect(liens.nth(rang)).toBeVisible();
  }
});

test("toucher un lien « Pour aller plus loin » ouvre le site de l'organisme dans un nouvel onglet ; la révélation reste ouverte", async ({ page, context }) => {
  // Pas de vrai réseau : le site de l'organisme est simulé.
  await context.route("https://www.cor-retraites.fr/**", (route) => route.fulfill({ contentType: "text/html", body: "<title>COR</title>" }));
  await repondre(page, "62 ans");
  const [onglet] = await Promise.all([
    page.waitForEvent("popup"),
    pourAllerPlusLoin(page).getByRole("link", { name: /^COR, rapport annuel 2025/ }).click(),
  ]);
  await onglet.waitForLoadState();
  expect(onglet.url()).toMatch(/^https:\/\/www\.cor-retraites\.fr\//);
  await expect(page).toHaveURL(/\/revelation$/);
  await expect(quiDefendQuoi(page)).toBeVisible();
});

test.describe("une question déjà répondue rouvre sur sa révélation", () => {
  /** Fermer l'app, puis rouvrir la question n° 24 (depuis la liste, ou par son adresse) sur le même appareil. */
  async function rouvrir(page: Page) {
    const contexte = page.context();
    await page.close();
    const rouverte = await contexte.newPage();
    await fixerLeJour(rouverte, "2026-10-23T18:00:00+02:00");
    await rouverte.goto("/question/24");
    return rouverte;
  }

  test("après E, fermer l'app puis rouvrir la question n° 24 ouvre sa révélation, Dupont-Aignan et Philippe sous E", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    const rouverte = await rouvrir(page);
    await expect(rouverte).toHaveURL(/\/question\/24\/revelation$/);
    expect(await nomsSous(rouverte, "Option E : À la carte, avec un système à points")).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
    await expect(rouverte.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
  });

  test("une réponse « Je ne sais pas » est gardée de la même façon", async ({ page }) => {
    await repondre(page, "Je ne sais pas");
    const rouverte = await rouvrir(page);
    await expect(rouverte).toHaveURL(/\/question\/24\/revelation$/);
    await expect(blocsDOption(rouverte)).toHaveCount(5);
    await expect(rouverte.getByRole("region", { name: "Alignement sur ce sujet" })).toHaveCount(0);
  });

  test("sur un autre téléphone, la même question s'ouvre sur une fiche vierge", async ({ page, browser }) => {
    await repondre(page, "À la carte, avec un système à points");
    const autreTelephone = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await fixerLOrdre(autreTelephone);
    const autre = await autreTelephone.newPage();
    await fixerLeJour(autre, "2026-10-23T18:00:00+02:00");
    await autre.goto("/");
    await expect(autre.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
    await expect(autre.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(autre).toHaveURL(/\/$/);
    await autreTelephone.close();
  });
});

test.describe("l'importance donnée est retrouvée en revenant", () => {
  /** Répondre sur cet appareil, sans effacer les réponses déjà données. */
  async function repondreLe(page: Page, jour: string, libelle: string, poids: "×1" | "×2" | "×3") {
    await fixerLeJour(page, jour);
    await page.goto("/");
    await choisir(page, libelle);
    await peser(page, poids);
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
  }

  /** Fermer l'app, puis rouvrir tel jour, sur le même appareil, la question répondue `numero`. */
  async function rouvrirLe(page: Page, jour: string, numero: number) {
    const contexte = page.context();
    await page.close();
    const rouverte = await contexte.newPage();
    await fixerLeJour(rouverte, jour);
    await rouverte.goto(`/question/${numero}`);
    await expect(rouverte).toHaveURL(new RegExp(`/question/${numero}/revelation$`));
    return rouverte;
  }

  const pleines = (page: Page) => page.getByRole("region", { name: /^Ta réponse/ }).locator(".chips i:not(.off)");

  test("après E en ×3, fermer puis rouvrir la question : la révélation n° 24 affiche « Importance ×3 », trois pastilles pleines", async ({ page }) => {
    await repondreLe(page, "2026-10-23T09:00:00+02:00", "À la carte, avec un système à points", "×3");
    const rouverte = await rouvrirLe(page, "2026-10-23T18:00:00+02:00", 24);
    await expect(rouverte.getByText("Importance ×3", { exact: true })).toBeVisible();
    await expect(pleines(rouverte)).toHaveCount(3);
  });

  test("la n° 23 en ×1 et la n° 24 en ×3 gardent chacune leur importance", async ({ page }) => {
    await repondreLe(page, "2026-10-22T09:00:00+02:00", "Seulement là où la ville le demande", "×1");
    await repondreLe(page, "2026-10-23T09:00:00+02:00", "64 ans", "×3");
    let rouverte = await rouvrirLe(page, "2026-10-23T18:00:00+02:00", 24);
    await expect(rouverte.getByText(/^Question n° 24/).filter({ visible: true })).toBeVisible();
    await expect(rouverte.getByText("Importance ×3", { exact: true })).toBeVisible();
    rouverte = await rouvrirLe(rouverte, "2026-10-22T18:00:00+02:00", 23);
    await expect(rouverte.getByText(/^Question n° 23/).filter({ visible: true })).toBeVisible();
    await expect(rouverte.getByText("Importance ×1", { exact: true })).toBeVisible();
    await expect(pleines(rouverte)).toHaveCount(1);
  });
});

test("sous « Valider ma réponse », plus de phrase : la promesse sur les réponses est dans « À propos »", async ({ page }) => {
  await page.goto("/");
  await voirLesPropositions(page);
  await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
  await expect(page.locator("form.answer .go-note")).toHaveCount(0);
});

test("rien dans l'app ne demande de créer un compte ou de se connecter, ni avant ni après la réponse", async ({ page }) => {
  const demandeDeCompte = /créer (un|ton|votre) compte|se connecter|connecte-toi|connectez-vous|s'inscrire|inscris-toi|identifiant|mot de passe|login|sign ?in/i;
  const verifier = async () => {
    const texte = await page.locator("body").innerText();
    expect(texte).not.toMatch(demandeDeCompte);
    await expect(page.locator('input[type="password"], input[type="email"], input[autocomplete="username"]')).toHaveCount(0);
  };
  await page.goto("/");
  await voirLesPropositions(page);
  await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
  await verifier();
  await choisir(page, "64 ans");
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
  await expect(quiDefendQuoi(page)).toBeVisible();
  await verifier();
});

test.describe("la question du jour change chaque jour", () => {
  const questionDuJour = async (page: Page, jour: string) => {
    await fixerLeJour(page, jour);
    await page.goto("/");
    const titre = page.getByRole("article").getByRole("heading", { level: 1 });
    await expect(titre).toBeVisible();
    return (await titre.innerText()).trim();
  };

  test("le vendredi 23 octobre, la fiche du 23 (la retraite) ; le samedi 24, une autre question", async ({ page }) => {
    expect(await questionDuJour(page, "2026-10-23T09:00:00+02:00")).toBe("À quel âge devrait-on pouvoir partir à la retraite ?");
    const samedi = await questionDuJour(page, "2026-10-24T09:00:00+02:00");
    expect(samedi).toBe("Faut-il sortir du nucléaire ?");
    await expect(page.getByText("À quel âge devrait-on pouvoir partir à la retraite ?")).toHaveCount(0);
  });

  test("le dimanche 25 octobre, encore une nouvelle fiche : une question par jour, 7 jours sur 7", async ({ page }) => {
    const questions = [];
    for (const jour of ["2026-10-22T09:00:00+02:00", "2026-10-23T09:00:00+02:00", "2026-10-24T09:00:00+02:00", "2026-10-25T09:00:00+01:00"]) {
      questions.push(await questionDuJour(page, jour));
    }
    expect(questions[3]).toBe("Faut-il réguler l'installation des médecins ?");
    expect(new Set(questions).size).toBe(4);
  });
});

test.describe("une question pas encore publiée reste inaccessible", () => {
  const FICHE_DU_24 = ["Faut-il sortir du nucléaire", "vient du nucléaire", "réacteurs"];

  test("le 23 octobre, aucune page ne montre la fiche du 24, ni à l'écran ni dans le code de la page", async ({ page }) => {
    for (const adresse of ["/", "/revelation"]) {
      const html = await (await page.request.get(adresse)).text();
      for (const morceau of FICHE_DU_24) expect(html.includes(morceau), `${adresse} contient « ${morceau} »`).toBe(false);
    }
    await repondre(page, "62 ans");
    for (const morceau of [...FICHE_DU_24, "Écologie & énergie"]) await expect(page.getByText(morceau)).toHaveCount(0);
  });

  test("le 23, taper une adresse à la main ne montre pas la fiche du 24 ; le 24, elle est la question du jour", async ({ page }) => {
    for (const adresse of ["/revelation", "/question/25", "/questions/25", "/?question=25", "/?date=2026-10-24"]) {
      await page.goto(adresse);
      await expect(page.getByText("Faut-il sortir du nucléaire")).toHaveCount(0);
    }
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Faut-il sortir du nucléaire ?" })).toBeVisible();
  });
});

test.describe("le compte à rebours avant le 1er tour", () => {
  const compteARebours = (page: Page) => page.getByText(/^J-\d+ avant le 1er tour$/).filter({ visible: true });

  test("le 23 octobre 2026, le bandeau affiche « J-177 avant le 1er tour » ; le 24, « J-176 »", async ({ page }) => {
    await page.goto("/");
    await expect(compteARebours(page)).toHaveText("J-177 avant le 1er tour");
    const [rebours, numero] = await Promise.all([compteARebours(page).boundingBox(), page.getByText(/^Question n° 24/).boundingBox()]);
    expect(rebours!.x).toBeLessThan(numero!.x);
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(compteARebours(page)).toHaveText("J-176 avant le 1er tour");
  });

  test("le décompte vise le dimanche 18 avril 2027 : le samedi 17 avril, il affiche « J-1 »", async ({ page }) => {
    await fixerLeJour(page, "2027-04-17T09:00:00+02:00");
    await page.goto("/");
    await expect(compteARebours(page)).toHaveText("J-1 avant le 1er tour");
  });
});

test.describe("avant la première question, l'accueil dit quand elle arrive", () => {
  // La première fiche (de test) est datée du mercredi 30 septembre 2026.
  test("le 28 septembre, l'accueil donne la date de la première question et ne montre aucune question", async ({ page }) => {
    await fixerLeJour(page, "2026-09-28T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /première question.*mercredi 30 septembre/i })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
    await expect(page.getByText(/^Question n° /)).toHaveCount(0);
  });

  test("le jour de la première fiche, la question apparaît à la place du message", async ({ page }) => {
    await fixerLeJour(page, "2026-09-30T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Fiche de test du mercredi 30 septembre ?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /première question/i })).toHaveCount(0);
  });
});

test.describe("quand toutes les questions ont une réponse, l'accueil le dit", () => {
  // Le second test publie une fiche : le premier ne doit pas tourner en même temps.
  test.describe.configure({ mode: "serial" });

  /** Une réponse à chaque question, publiée ou non. */
  async function toutRepondre(page: Page) {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let n = 1; n <= 400; n++) reponses[n] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
    await page.goto("/");
  }

  test("après la dernière réponse, l'accueil dit « Tu as répondu à toutes les questions. » et mène à « Mes résultats »", async ({ page }) => {
    await toutRepondre(page);
    await expect(page.getByRole("heading", { name: "Tu as répondu à toutes les questions." })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
    await page.getByRole("link", { name: "Voir mes résultats" }).click();
    await expect(page).toHaveURL(/\/resultats$/);
  });

  test("si l'auteur publie ensuite une nouvelle fiche, elle apparaît à l'accueil à sa date, à la place du message", async ({ page }) => {
    await fixerLeJour(page, "2027-05-11T09:00:00+02:00");
    await toutRepondre(page);
    await expect(page.getByRole("heading", { name: "Tu as répondu à toutes les questions." })).toBeVisible();

    // L'auteur publie une fiche datée du 11 mai, comme il le ferait : un fichier de plus dans content/questions.
    const fiche = "content/questions/900-fiche-de-test.yaml";
    writeFileSync(
      fiche,
      readFileSync("content/questions/023-loyers.yaml", "utf8")
        .replace(/^numero: 23$/m, "numero: 900")
        .replace(/^date: 2026-10-22$/m, "date: 2027-05-11")
        .replace(/^question: .*$/m, "question: Une fiche publiée après coup ?"),
    );
    try {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Une fiche publiée après coup ?" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Tu as répondu à toutes les questions." })).toHaveCount(0);
    } finally {
      rmSync(fiche);
    }
  });
});

test.describe("aucune nouvelle question ne paraît pendant le silence électoral", () => {
  // Fiches de test (e2e/fiches) datées du 14 au 19 avril, du 30 avril et du 1er mai 2027.
  const fiche = (jour: string) => `Fiche de test du ${jour} ?`;

  /** Ni à l'écran, ni dans le code des pages : la fiche n'apparaît nulle part. */
  async function nullePart(page: Page, question: string) {
    for (const adresse of ["/", "/rattrapage"]) {
      const html = await (await page.request.get(adresse)).text();
      expect(html.includes(question), `${adresse} contient « ${question} »`).toBe(false);
    }
    await page.goto("/");
    await expect(page.getByText(question)).toHaveCount(0);
  }

  test("les vendredi 16 et samedi 17 avril, l'accueil propose encore la question du jeudi 15, et les fiches du 16 et du 17 n'apparaissent nulle part", async ({ page }) => {
    for (const jour of ["2027-04-16T09:00:00+02:00", "2027-04-17T09:00:00+02:00"]) {
      await fixerLeJour(page, jour);
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: fiche("jeudi 15 avril") })).toBeVisible();
      for (const question of [fiche("vendredi 16 avril"), fiche("samedi 17 avril")]) await nullePart(page, question);
    }
  });

  test("avant le 2nd tour aussi : le vendredi 30 avril et le samedi 1er mai, l'accueil propose la question du lundi 19 avril, et les fiches du silence n'apparaissent nulle part", async ({ page }) => {
    for (const jour of ["2027-04-30T09:00:00+02:00", "2027-05-01T09:00:00+02:00"]) {
      await fixerLeJour(page, jour);
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: fiche("lundi 19 avril") })).toBeVisible();
      for (const question of [fiche("vendredi 30 avril"), fiche("samedi 1er mai")]) await nullePart(page, question);
    }
  });
});

// Fiches du 22 au 28 octobre 2026 : celles de démonstration, puis celles de test (e2e/fiches).
const SIX_JOURS = ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"];

/** Répondre à la question du jour, ce jour-là, sans effacer les réponses déjà données. */
async function repondreCeJour(page: Page, jour: string, libelle?: string) {
  await fixerLeJour(page, jour.length > 10 ? jour : `${jour}T09:00:00+02:00`);
  await page.goto("/");
  await voirLesPropositions(page);
  const options = page.getByRole("radiogroup", { name: "Les options" });
  await (libelle ? options.getByText(libelle, { exact: true }) : options.locator("label").first()).click();
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
}

test.describe("la série de jours d'affilée n'existe plus", () => {
  test("après six jours de réponses, ni l'en-tête, ni la révélation, ni la carte « Je ne sais pas » ne parlent de série", async ({ page }) => {
    for (const jour of SIX_JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await voirLesPropositions(page);
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(page.getByRole("banner")).not.toContainText("affilée");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).not.toContainText("série");
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(quiDefendQuoi(page)).toBeVisible();
    await expect(page.getByRole("region", { name: "Ta série" })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("affilée");
  });
});

test.describe("l'électeur ouvre la liste des questions publiées", () => {
  const toutesLesQuestions = (page: Page) => page.getByRole("region", { name: "Toutes les questions" });
  /** La carte de la liste qui porte cette question. */
  const carteDeLaListe = (page: Page, question: string) =>
    toutesLesQuestions(page).getByRole("listitem").filter({ has: page.getByRole("heading", { name: question, exact: true }) });

  test.beforeEach(async ({ page }) => {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/rattrapage");
    await expect(page.getByRole("heading", { level: 1, name: "Les questions." })).toBeVisible();
  });

  test("le 23 octobre, la page annonce « 24 publiées » et contient la carte n° 24 « À quel âge devrait-on pouvoir partir à la retraite ? » (Travail & retraites, 23 octobre)", async ({ page }) => {
    await expect(toutesLesQuestions(page).getByText("24 publiées", { exact: true })).toBeVisible();
    await expect(toutesLesQuestions(page).getByRole("listitem")).toHaveCount(24);
    const carte = carteDeLaListe(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(carte.getByText(/^n°\s24$/)).toBeVisible();
    await expect(carte.getByText("Travail & retraites", { exact: true })).toBeVisible();
    await expect(carte.getByText("23 octobre", { exact: true })).toBeVisible();
  });

  test("la carte n° 9 « Faut-il rétablir l'ISF ? » (Économie & impôts, 8 octobre) y figure aussi, et la question n° 25, pas encore publiée, n'y est pas", async ({ page }) => {
    const carte = carteDeLaListe(page, "Faut-il rétablir l'ISF ?");
    await expect(carte.getByText(/^n°\s9$/)).toBeVisible();
    await expect(carte.getByText("Économie & impôts", { exact: true })).toBeVisible();
    await expect(carte.getByText("8 octobre", { exact: true })).toBeVisible();
    await expect(toutesLesQuestions(page).getByText(/^n°\s25$/)).toHaveCount(0);
    await expect(page.getByText("Faut-il sortir du nucléaire ?")).toHaveCount(0);
  });
});

test.describe("une question de la liste s'ouvre sur sa fiche", () => {
  async function ouvrirDepuisLaListe(page: Page, question: string) {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/rattrapage");
    await page
      .getByRole("region", { name: "Toutes les questions" })
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: question, exact: true }) })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: question })).toBeVisible();
    await voirLesPropositions(page);
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
  }

  test("toucher la carte n° 9 « Faut-il rétablir l'ISF ? » ouvre la fiche de la question n° 9, et non celle que propose l'accueil, la n° 24", async ({ page }) => {
    await ouvrirDepuisLaListe(page, "Faut-il rétablir l'ISF ?");
    await expect(page.getByText(/^Question n° 9/).filter({ visible: true })).toHaveText("Question n° 9", { useInnerText: true });
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" }).filter({ visible: true })).toHaveCount(0);
  });

  test("toucher la carte n° 6 « Faut-il fixer chaque année des quotas d'immigration ? » ouvre la fiche de la question n° 6", async ({ page }) => {
    await ouvrirDepuisLaListe(page, "Faut-il fixer chaque année des quotas d'immigration ?");
    await expect(page.getByText(/^Question n° 6/).filter({ visible: true })).toHaveText("Question n° 6", { useInnerText: true });
  });
});

test.describe("la révélation mène à la question suivante", () => {
  const suivante = (page: Page) => page.getByRole("link", { name: "Question suivante" }).filter({ visible: true });

  test("sur la révélation de la question n° 24 (réponse E validée), « Question suivante » ouvre la prochaine question sans réponse, la n° 23", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    await suivante(page).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il encadrer les loyers dans les grandes villes ?" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/^Question n° 23/).filter({ visible: true })).toBeVisible();
  });

  test("le même bouton est sur la révélation de la n° 9, répondue depuis la liste, et ouvre la n° 24, pas encore répondue", async ({ page }) => {
    await page.goto("/rattrapage");
    await page.getByRole("link", { name: /Faut-il rétablir l'ISF/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il rétablir l'ISF ?" })).toBeVisible();
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/question\/9\/revelation$/);
    await suivante(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "À quel âge devrait-on pouvoir partir à la retraite ?" }).filter({ visible: true })).toBeVisible();
  });

  test("après la dernière question sans réponse, la révélation n'a plus de « Question suivante », mais « Voir mes résultats »", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let n = 1; n <= 23; n++) reponses[n] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByRole("link", { name: "Voir mes résultats" }).filter({ visible: true }).first()).toBeVisible();
    await expect(suivante(page)).toHaveCount(0);
  });
});

test.describe("une question répondue est marquée « Répondu » et passe en fin de liste", () => {
  /** Les cartes de la liste, dans l'ordre de la page : leur question et leur mention. */
  const cartes = (page: Page) =>
    page
      .getByRole("region", { name: "Toutes les questions" })
      .getByRole("listitem")
      .evaluateAll((items) =>
        items.map((item) => ({
          question: item.querySelector("h3")?.textContent,
          mention: item.querySelector(".st")?.textContent?.trim(),
        })),
      );

  async function repondreDepuisLaListe(page: Page, numero: number) {
    await page.goto(`/question/${numero}`);
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(new RegExp(`/question/${numero}/revelation$`));
  }

  test("les questions n° 5 et n° 8, déjà répondues, sont marquées « Répondu » et placées après toutes les cartes « À répondre »", async ({ page }) => {
    await repondreDepuisLaListe(page, 5);
    await repondreDepuisLaListe(page, 8);
    await page.goto("/rattrapage");
    await expect(page.getByText("Répondu", { exact: true })).toHaveCount(2);
    const liste = await cartes(page);
    expect(liste).toHaveLength(24);
    expect(liste.slice(0, 22).every((c) => c.mention === "À répondre")).toBe(true);
    expect(liste.slice(22)).toEqual([
      { question: "Fiche de test du mercredi 7 octobre ?", mention: "Répondu" },
      { question: "Faut-il passer à la semaine de quatre jours ?", mention: "Répondu" },
    ]);
  });

  test("après avoir validé une réponse à la question n° 24, la liste la montre « Répondu », après les cartes « À répondre » qui restent", async ({ page }) => {
    await page.goto("/rattrapage");
    await expect(page.getByRole("region", { name: "Toutes les questions" }).getByRole("listitem")).toHaveCount(24);
    expect((await cartes(page))[0]).toEqual({ question: "À quel âge devrait-on pouvoir partir à la retraite ?", mention: "À répondre" });
    await repondre(page, "64 ans");
    await page.goto("/rattrapage");
    await expect(page.getByText("Répondu", { exact: true })).toHaveCount(1);
    const liste = await cartes(page);
    expect(liste.at(-1)).toEqual({ question: "À quel âge devrait-on pouvoir partir à la retraite ?", mention: "Répondu" });
    expect(liste.slice(0, -1).every((c) => c.mention === "À répondre")).toBe(true);
  });
});

test.describe("la liste affiche le nombre de questions sans réponse", () => {
  const tuile = (page: Page) => page.getByRole("group", { name: "Sans réponse" });
  /** La part remplie de la barre de progression, de 0 à 1 (sa largeur posée, hors animation de croissance). */
  const remplissage = (page: Page) =>
    tuile(page)
      .getByRole("img")
      .evaluate((barre) => barre.querySelector("i")!.offsetWidth / (barre as HTMLElement).offsetWidth);

  /** 14 réponses déjà données sur l'appareil, aux questions n° 1 à 14 (en rattrapage). */
  async function quatorzeReponses(page: Page) {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let numero = 1; numero <= 14; numero++) reponses[numero] = { option: "A", importance: null, graine: 1, jour: "2026-10-22", duJour: false };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
  }

  test("avec 24 questions publiées dont 14 répondues, la tuile affiche « 10 sans réponse » et « 14 répondues sur 24 publiées »", async ({ page }) => {
    await quatorzeReponses(page);
    await page.goto("/rattrapage");
    await expect(tuile(page)).toContainText("10 sans réponse");
    await expect(tuile(page)).toContainText("14 répondues sur 24 publiées");
    await expect(tuile(page).getByRole("img", { name: "14 questions répondues sur 24 publiées" })).toBeVisible();
    expect(await remplissage(page)).toBeCloseTo(14 / 24, 2);
  });

  test("après avoir répondu à la question n° 24, la tuile affiche « 9 sans réponse » et « 15 répondues sur 24 publiées », et la barre avance d'un cran", async ({ page }) => {
    await quatorzeReponses(page);
    await repondreCeJour(page, "2026-10-23");
    await page.goto("/rattrapage");
    await expect(tuile(page)).toContainText("9 sans réponse");
    await expect(tuile(page)).toContainText("15 répondues sur 24 publiées");
    await expect(tuile(page).getByRole("img", { name: "15 questions répondues sur 24 publiées" })).toBeVisible();
    expect(await remplissage(page)).toBeCloseTo(15 / 24, 2);
  });
});

test.describe("l'électeur filtre la liste par thème", () => {
  const carte = (page: Page, question: string) =>
    page
      .getByRole("region", { name: "Toutes les questions" })
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: question, exact: true }) });

  async function filtrer(page: Page, theme: string) {
    const puces = page.getByRole("radiogroup", { name: "Filtrer par thème" });
    // Sur téléphone, les puces sont repliées sous « Filtrer par thème ».
    if (!(await puces.isVisible())) await page.getByText("Filtrer par thème", { exact: true }).click();
    await puces.getByText(theme, { exact: true }).click();
    await expect(puces.getByRole("radio", { name: theme })).toBeChecked();
  }

  test("en choisissant « Travail & retraites », les n° 24 (« À répondre ») et n° 5 (« Répondu ») restent, et la n° 9 « Faut-il rétablir l'ISF ? » disparaît", async ({ page }) => {
    await page.goto("/question/5");
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/question\/5\/revelation$/);
    await page.goto("/rattrapage");
    await filtrer(page, "Travail & retraites");
    await expect(carte(page, "À quel âge devrait-on pouvoir partir à la retraite ?")).toBeVisible();
    await expect(carte(page, "À quel âge devrait-on pouvoir partir à la retraite ?").getByText("À répondre")).toBeVisible();
    await expect(carte(page, "Faut-il passer à la semaine de quatre jours ?").getByText("Répondu")).toBeVisible();
    await expect(carte(page, "Faut-il rétablir l'ISF ?")).toBeHidden();
  });

  test("en choisissant « Santé », la n° 3 reste et les n° 9 et n° 24 disparaissent ; « Tous les thèmes » fait revenir la liste complète", async ({ page }) => {
    await page.goto("/rattrapage");
    await filtrer(page, "Santé");
    await expect(carte(page, "Faut-il réguler l'installation des médecins ?")).toBeVisible();
    await expect(carte(page, "Faut-il rétablir l'ISF ?")).toBeHidden();
    await expect(carte(page, "À quel âge devrait-on pouvoir partir à la retraite ?")).toBeHidden();
    await filtrer(page, "Tous les thèmes");
    await expect(page.getByRole("region", { name: "Toutes les questions" }).getByRole("listitem").filter({ visible: true })).toHaveCount(24);
  });
});

test.describe("tout rattrapé, la liste dit « Tu es à jour ! »", () => {
  /** Des réponses déjà données sur l'appareil, aux questions de ces numéros. */
  async function reponsesAux(page: Page, numeros: number[]) {
    await page.goto("/");
    await page.evaluate((numeros) => {
      const reponses: Record<number, object> = {};
      for (const numero of numeros) reponses[numero] = { option: "A", importance: null, graine: 1, jour: "2026-10-23", duJour: numero === 24 };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    }, numeros);
  }
  const toutes = Array.from({ length: 24 }, (_, i) => i + 1);

  test("le 23 octobre, une fois les 24 questions publiées toutes répondues, la page affiche « Tu es à jour ! » et « Reviens demain pour la question n° 25. »", async ({ page }) => {
    await reponsesAux(page, toutes);
    await page.goto("/rattrapage");
    await expect(page.getByRole("heading", { name: "Tu es à jour !" })).toBeVisible();
    await expect(page.getByText(/^Reviens demain pour la question n°\s25\.$/)).toBeVisible();
  });

  test("tant qu'au moins une question reste « À répondre », ce bloc n'apparaît pas", async ({ page }) => {
    await reponsesAux(page, toutes.filter((numero) => numero !== 9));
    await page.goto("/rattrapage");
    await expect(page.getByText("À répondre", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Tu es à jour !" })).toHaveCount(0);
    await expect(page.getByText(/Reviens demain/)).toHaveCount(0);
  });
});

test.describe("l'électeur ouvre « Mes résultats »", () => {
  test("depuis la fiche de la question n° 24, toucher « Mes résultats » ouvre la page « Mes résultats »", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Mes résultats" }).click();
    await expect(page).toHaveURL(/\/resultats$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mes résultats." })).toBeVisible();
  });

  test("sur cette page, le lien « Questions » en haut ramène à la prochaine question, la n° 24", async ({ page }) => {
    await page.goto("/resultats");
    await page.getByRole("link", { name: "Questions", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "À quel âge devrait-on pouvoir partir à la retraite ?" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toBeVisible();
  });
});

/**
 * 23 réponses déjà données sur l'appareil : A aux questions n° 1 à 23, d'importance ×3 (n° 1 à 8),
 * ×2 (n° 9 à 14) puis ×1. Les fiches de test n° 1 à 22 placent les candidats pour donner le classement
 * de maquettes/resultats.html ; la n° 23 n'a aucune position.
 */
async function vingtTroisReponses(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    const reponses: Record<number, object> = {};
    for (let numero = 1; numero <= 23; numero++) {
      const importance = numero <= 8 ? 3 : numero <= 14 ? 2 : 1;
      reponses[numero] = { option: "A", importance, graine: 1, jour: "2026-10-22", duJour: false };
    }
    localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
  });
}

/** Les lignes de « Ton classement », dans l'ordre : rang, nom, pourcentage. */
const lignesDuClassement = (page: Page) =>
  page
    .getByRole("region", { name: "Ton classement" })
    .getByRole("listitem")
    .evaluateAll((lignes) =>
      lignes.map((ligne) => [".cand-n", ".cand-name", ".cand-pc"].map((classe) => ligne.querySelector(classe)?.textContent)),
    );

test.describe("le classement range les 13 candidats par % de proximité", () => {
  test("avec 23 réponses, « Ton classement » montre 13 lignes numérotées de 1 à 13, de 81 % pour François Ruffin à 22 % pour Éric Zemmour", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByText("proximité, en %")).toBeVisible();
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect(await lignesDuClassement(page)).toEqual([
      ["1", "François Ruffin", "81 %"],
      ["2", "David Lisnard", "76 %"],
      ["3", "Marine Tondelier", "71 %"],
      ["4", "Nicolas Dupont-Aignan", "66 %"],
      ["5", "Raphaël Glucksmann", "62 %"],
      ["6", "Marine Le Pen", "58 %"],
      ["7", "Édouard Philippe", "54 %"],
      ["8", "Fabien Roussel", "49 %"],
      ["9", "Jean-Luc Mélenchon", "45 %"],
      ["10", "Bruno Retailleau", "39 %"],
      ["11", "Nathalie Arthaud", "33 %"],
      ["12", "Gabriel Attal", "28 %"],
      ["13", "Éric Zemmour", "22 %"],
    ]);
  });

  test("les 13 candidats du lancement y figurent tous, une seule fois chacun", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const noms = (await lignesDuClassement(page)).map(([, nom]) => nom);
    expect([...noms].sort((a, b) => a!.localeCompare(b!, "fr"))).toEqual(
      [
        "Marine Le Pen",
        "Jean-Luc Mélenchon",
        "Édouard Philippe",
        "Raphaël Glucksmann",
        "Bruno Retailleau",
        "David Lisnard",
        "Gabriel Attal",
        "Éric Zemmour",
        "Marine Tondelier",
        "Fabien Roussel",
        "Nicolas Dupont-Aignan",
        "François Ruffin",
        "Nathalie Arthaud",
      ].sort((a, b) => a.localeCompare(b, "fr")),
    );
  });
});

test.describe("la révélation mène à « Mes résultats »", () => {
  const pourcentageDe = async (page: Page, nom: string) =>
    Number((await lignesDuClassement(page)).find(([, n]) => n === nom)![2]!.replace(/\D/g, ""));

  async function repondreEALaQuestionDuJour(page: Page) {
    await page.goto("/");
    await choisir(page, "À la carte, avec un système à points");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
  }

  test("sur la révélation de la question n° 24, « Voir mes résultats » ouvre « Mes résultats », sans phrase de plus sous le bouton", async ({ page }) => {
    await vingtTroisReponses(page);
    await repondreEALaQuestionDuJour(page);
    await expect(page.getByText(/Ton classement est recalculé/)).toHaveCount(0);
    await page.getByRole("link", { name: "Voir mes résultats" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/resultats$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mes résultats." }).filter({ visible: true })).toBeVisible();
  });

  test("sur « Mes résultats », le classement tient compte de cette réponse : Nicolas Dupont-Aignan, qui défend l'option E choisie, dépasse les 66 % qu'il avait avant", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect(await pourcentageDe(page, "Nicolas Dupont-Aignan")).toBe(66);
    await repondreEALaQuestionDuJour(page);
    await page.getByRole("link", { name: "Voir mes résultats" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/resultats$/);
    await expect(page.getByRole("region", { name: "Ton classement" }).filter({ visible: true }).getByRole("listitem")).toHaveCount(13);
    expect(await pourcentageDe(page, "Nicolas Dupont-Aignan")).toBeGreaterThan(66);
  });
});

/** Le % d'un candidat pour un électeur qui a les 23 réponses de `vingtTroisReponses`, plus cette option à la n° 24. */
async function pourcentageAvecLa24(page: Page, option: string, nom: string, importance: number | null = null) {
  await vingtTroisReponses(page);
  await page.evaluate(
    ([option, importance]) => {
      const reponses = JSON.parse(localStorage.getItem("aucrible:reponses")!);
      reponses[24] = { option, importance, graine: 1, jour: "2026-10-23", duJour: true };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    },
    [option, importance] as const,
  );
  await page.goto("/resultats");
  await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
  return Number((await lignesDuClassement(page)).find(([, n]) => n === nom)![2]!.replace(/\D/g, ""));
}

test.describe("une option voisine sur l'échelle compte en partie", () => {
  // La n° 24 compte ×3 : sur 23 autres réponses, un cran d'écart à ×1 bougerait le % de moins d'un point.
  test("à la n° 24, le % de Gabriel Attal (position C, 64 ans) est le plus haut avec C, plus bas avec B (62 ans), encore plus bas avec A (60 ans)", async ({ page }) => {
    const [avecC, avecB, avecA] = [
      await pourcentageAvecLa24(page, "C", "Gabriel Attal", 3),
      await pourcentageAvecLa24(page, "B", "Gabriel Attal", 3),
      await pourcentageAvecLa24(page, "A", "Gabriel Attal", 3),
    ];
    expect(avecC).toBeGreaterThan(avecB);
    expect(avecB).toBeGreaterThan(avecA);
  });

  test("avec D (65 ans ou plus), C, B puis A, le % de Bruno Retailleau (position D) baisse à chaque cran d'écart", async ({ page }) => {
    const pourcentages = [];
    for (const option of ["D", "C", "B", "A"]) pourcentages.push(await pourcentageAvecLa24(page, option, "Bruno Retailleau", 3));
    for (let i = 1; i < pourcentages.length; i++) expect(pourcentages[i]).toBeLessThan(pourcentages[i - 1]);
  });
});

test.describe("une option hors échelle compte tout ou rien", () => {
  test("à la n° 24, le % de Nicolas Dupont-Aignan (position E, « À la carte ») est le plus haut avec E, et le même avec D et avec A", async ({ page }) => {
    const avecE = await pourcentageAvecLa24(page, "E", "Nicolas Dupont-Aignan", 3);
    const avecD = await pourcentageAvecLa24(page, "D", "Nicolas Dupont-Aignan", 3);
    const avecA = await pourcentageAvecLa24(page, "A", "Nicolas Dupont-Aignan", 3);
    expect(avecE).toBeGreaterThan(avecD);
    expect(avecD).toBe(avecA);
  });

  test("le % de Bruno Retailleau (position D) est le même que l'électeur réponde E ou A", async ({ page }) => {
    const avecE = await pourcentageAvecLa24(page, "E", "Bruno Retailleau", 3);
    const avecA = await pourcentageAvecLa24(page, "A", "Bruno Retailleau", 3);
    expect(avecE).toBe(avecA);
  });
});

test.describe("l'importance ×2 ou ×3 pèse plus dans le classement", () => {
  test("avec E à la n° 24 en ×3 plutôt qu'en ×1, Nicolas Dupont-Aignan (position E) monte et Jean-Luc Mélenchon (position A) descend", async ({ page }) => {
    const [dupontAignanX1, melenchonX1] = [
      await pourcentageAvecLa24(page, "E", "Nicolas Dupont-Aignan", 1),
      Number((await lignesDuClassement(page)).find(([, n]) => n === "Jean-Luc Mélenchon")![2]!.replace(/\D/g, "")),
    ];
    const [dupontAignanX3, melenchonX3] = [
      await pourcentageAvecLa24(page, "E", "Nicolas Dupont-Aignan", 3),
      Number((await lignesDuClassement(page)).find(([, n]) => n === "Jean-Luc Mélenchon")![2]!.replace(/\D/g, "")),
    ];
    expect(dupontAignanX3).toBeGreaterThan(dupontAignanX1);
    expect(melenchonX3).toBeLessThan(melenchonX1);
  });

  test("sous le classement, pas de note : la méthode est sur la page Méthode", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    await expect(page.locator(".rank-note")).toHaveCount(0);
  });
});

/** Les pourcentages de « Ton classement », par nom, tels que la page les affiche. */
const pourcentagesDuClassement = async (page: Page) =>
  Object.fromEntries((await lignesDuClassement(page)).map(([, nom, pc]) => [nom, Number(pc!.replace(/\D/g, ""))]));

test.describe("une position inconnue ne compte pas pour ce candidat", () => {
  test("répondre E à la n° 24 laisse François Ruffin à 81 % et David Lisnard à 76 % (positions inconnues), alors que Nicolas Dupont-Aignan et Jean-Luc Mélenchon changent", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const avant = await pourcentagesDuClassement(page);
    await pourcentageAvecLa24(page, "E", "François Ruffin", 1);
    const apres = await pourcentagesDuClassement(page);
    expect([apres["François Ruffin"], apres["David Lisnard"]]).toEqual([81, 76]);
    expect(apres["Nicolas Dupont-Aignan"]).not.toBe(avant["Nicolas Dupont-Aignan"]);
    expect(apres["Jean-Luc Mélenchon"]).not.toBe(avant["Jean-Luc Mélenchon"]);
  });

  test("avec l'importance ×3 plutôt que ×1 à la n° 24, François Ruffin et David Lisnard gardent les mêmes pourcentages", async ({ page }) => {
    await pourcentageAvecLa24(page, "E", "François Ruffin", 1);
    const x1 = await pourcentagesDuClassement(page);
    await pourcentageAvecLa24(page, "E", "François Ruffin", 3);
    const x3 = await pourcentagesDuClassement(page);
    expect([x3["François Ruffin"], x3["David Lisnard"]]).toEqual([x1["François Ruffin"], x1["David Lisnard"]]);
  });
});

test.describe("« Je ne sais pas » ne compte pas dans le classement", () => {
  test("avec les 23 réponses de la maquette, répondre « Je ne sais pas » à la n° 24 laisse les 13 pourcentages inchangés", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const avant = await pourcentagesDuClassement(page);
    expect([avant["François Ruffin"], avant["David Lisnard"], avant["Marine Tondelier"]]).toEqual([81, 76, 71]);
    await page.goto("/");
    await choisir(page, "Je ne sais pas");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect(await pourcentagesDuClassement(page)).toEqual(avant);
  });
});

test.describe("chaque candidat du classement a sa barre", () => {
  /** La part remplie de la barre de chaque ligne, dans l'ordre (largeur posée, hors animation). */
  const remplissages = (page: Page) =>
    page
      .getByRole("region", { name: "Ton classement" })
      .getByRole("listitem")
      .evaluateAll((lignes) =>
        lignes.map((ligne) => {
          const barre = ligne.querySelector<HTMLElement>(".bar");
          return barre ? barre.querySelector<HTMLElement>("i")!.offsetWidth / barre.offsetWidth : null;
        }),
      );

  test("la barre sous « François Ruffin 81 % » est remplie aux 81 % de sa longueur, celle sous « Éric Zemmour 22 % » aux 22 %", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const parts = await remplissages(page);
    expect(parts[0]).toBeCloseTo(0.81, 2);
    expect(parts[12]).toBeCloseTo(0.22, 2);
  });

  test("les 13 barres vont de la plus remplie à la moins remplie, dans l'ordre du classement", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const parts = await remplissages(page);
    expect(parts.every((part) => part !== null)).toBe(true);
    for (let i = 1; i < parts.length; i++) expect(parts[i]!).toBeLessThan(parts[i - 1]!);
  });
});

test.describe("tous les candidats du classement ont le même pion", () => {
  /** Le pion de chaque ligne du classement : ses initiales, sa forme, sa teinte. */
  async function pionsDuClassement(page: Page) {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const lignes = page.getByRole("region", { name: "Ton classement" }).getByRole("listitem");
    await expect(lignes).toHaveCount(13);
    const pions: Record<string, { initiales: string; forme: string; teinte: string }> = {};
    for (const ligne of await lignes.all()) {
      const nom = (await ligne.locator(".cand-name").innerText()).trim();
      pions[nom] = await ligne.locator(".pawn").evaluate((el) => {
        const s = getComputedStyle(el);
        return { initiales: el.textContent!.trim(), forme: `${s.width}×${s.height} ${s.borderRadius}`, teinte: s.backgroundColor };
      });
    }
    return pions;
  }

  test("les 13 pions ont la même forme, la même taille et la même couleur, celle des pions : aucune couleur de parti", async ({ page }) => {
    const pions = await pionsDuClassement(page);
    expect(new Set(Object.values(pions).map((p) => p.forme)).size).toBe(1);
    const teintes = new Set(Object.values(pions).map((p) => p.teinte));
    expect(teintes.size).toBe(1);
    const pion = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.background = "var(--pawn)";
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    });
    expect([...teintes]).toEqual([pion]);
  });

  test("les initiales désignent le bon candidat, y compris FRu pour François Ruffin et FRo pour Fabien Roussel", async ({ page }) => {
    const pions = await pionsDuClassement(page);
    expect(Object.fromEntries(Object.entries(pions).map(([nom, p]) => [nom, p.initiales]))).toEqual(INITIALES);
    expect(pions["François Ruffin"].initiales).toBe("FRu");
    expect(pions["Fabien Roussel"].initiales).toBe("FRo");
  });
});

test.describe("les résultats affichent « Ce n'est pas un sondage »", () => {
  test("dès l'ouverture de « Mes résultats », la phrase « Ce n'est pas un sondage : seulement tes réponses, gardées sur ton téléphone. » est sous le titre", async ({ page }) => {
    await page.goto("/resultats");
    const titre = page.getByRole("heading", { level: 1, name: "Mes résultats." });
    const phrase = page.getByText("Ce n'est pas un sondage : seulement tes réponses, gardées sur ton téléphone.");
    await expect(phrase).toBeVisible();
    expect((await phrase.boundingBox())!.y).toBeGreaterThan((await titre.boundingBox())!.y);
  });

  test("en bas de la page, l'étiquette « Ce n'est pas un sondage » figure aussi, en tête du pied de page", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    // Le pied de « Mes résultats » est dans la page (main) : ce n'est pas le pied du site.
    const pied = page.locator("main footer").filter({ hasText: "Ce n'est pas un sondage" });
    await expect(pied.getByText("Ce n'est pas un sondage", { exact: true })).toBeVisible();
    const classement = page.getByRole("region", { name: "Ton classement" });
    await expect(classement.getByRole("listitem")).toHaveCount(13);
    expect((await pied.boundingBox())!.y).toBeGreaterThan((await classement.boundingBox())!.y);
    await pied.getByRole("link", { name: "Retour aux questions" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

/** Des réponses A aux questions n° 1 à `combien`, déjà données sur l'appareil (×1). */
async function premieresReponses(page: Page, combien: number) {
  await page.goto("/");
  await page.evaluate((combien) => {
    const reponses: Record<number, object> = {};
    for (let numero = 1; numero <= combien; numero++) reponses[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22", duJour: false };
    localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
  }, combien);
}

test.describe("avant 10 réponses, le classement dit combien il en manque", () => {
  const classementDeLaPage = (page: Page) => page.getByRole("region", { name: "Ton classement" });

  test("avec 3 réponses, « Ton classement » affiche « Encore 7 réponses pour voir ton classement » et « 3/10 réponses »", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    await expect(classementDeLaPage(page).getByRole("heading", { name: "Encore 7 réponses pour voir ton classement" })).toBeVisible();
    await expect(classementDeLaPage(page).getByText("3/10", { exact: true })).toBeVisible();
    await expect(classementDeLaPage(page).getByRole("img", { name: "3 réponses sur 10" })).toBeVisible();
  });

  test("avec 3 réponses, aucun nom de candidat ni aucun pourcentage réel : seulement l'aperçu estompé « Il ressemblera à ça »", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    await expect(classementDeLaPage(page).getByText("Il ressemblera à ça")).toBeVisible();
    for (const nom of Object.keys(INITIALES)) await expect(page.getByText(nom)).toHaveCount(0);
    await expect(classementDeLaPage(page).getByText(/\d+\s?%/)).toHaveCount(0);
  });

  test("à la 10e réponse, le message disparaît et le classement des 13 candidats prend sa place", async ({ page }) => {
    await premieresReponses(page, 9);
    await page.goto("/resultats");
    await expect(classementDeLaPage(page).getByRole("heading", { name: "Encore 1 réponse pour voir ton classement" })).toBeVisible();
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(classementDeLaPage(page).getByRole("listitem")).toHaveCount(13);
    await expect(page.getByText(/pour voir ton classement/)).toHaveCount(0);
    await expect(page.getByText("Il ressemblera à ça")).toHaveCount(0);
  });
});

/**
 * La place du centre du pion « TOI » sur le champ du plateau, de 0 à 1 sur chaque axe : sa position
 * calculée, au pixel près sans arrondi, hors animation (le pion est centré sur `left` et `top`).
 */
const placeDuToi = (page: Page) =>
  page
    .getByRole("region", { name: "Ton plateau" })
    .locator(".field .you")
    .evaluate((toi: HTMLElement) => {
      const champ = toi.offsetParent as HTMLElement;
      const style = getComputedStyle(toi);
      return { x: parseFloat(style.left) / champ.clientWidth, y: parseFloat(style.top) / champ.clientHeight };
    });

test.describe("le plateau place le pion « toi » sur les deux axes", () => {
  test("avec 23 réponses, « Ton plateau » montre un pion « TOI » près du centre, légèrement côté redistribution (à gauche) et progressiste (en haut)", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const plateau = page.getByRole("region", { name: "Ton plateau" });
    await expect(plateau.locator(".field .you").getByText("TOI", { exact: true })).toBeVisible();
    // Le rendu serveur, sans les réponses de l'appareil, pose le pion au centre : attendre qu'elles soient lues.
    await expect(plateau.locator(".field .pawn")).toHaveCount(13);
    const { x, y } = await placeDuToi(page);
    expect(x).toBeGreaterThan(0.35);
    expect(x).toBeLessThan(0.5);
    expect(y).toBeGreaterThan(0.35);
    expect(y).toBeLessThan(0.5);
  });
});

test.describe("sur ordinateur, le plateau se pose à côté du classement", () => {
  const boites = async (page: Page) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    return {
      classement: (await page.getByRole("region", { name: "Ton classement" }).boundingBox())!,
      plateau: (await page.getByRole("region", { name: "Ton plateau" }).boundingBox())!,
    };
  };

  test.describe("sur un écran d'ordinateur", () => {
    test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

    test("« Ton classement » est à gauche et « Ton plateau » à droite, côte à côte", async ({ page }) => {
      const { classement, plateau } = await boites(page);
      expect(classement.x + classement.width).toBeLessThanOrEqual(plateau.x);
      expect(Math.abs(classement.y - plateau.y)).toBeLessThan(10);
    });
  });

  test.describe("sur un téléphone de 375 px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("le plateau est sous le classement, sans défilement horizontal de la page", async ({ page }) => {
      const { classement, plateau } = await boites(page);
      expect(plateau.y).toBeGreaterThanOrEqual(classement.y + classement.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});

test.describe("le plateau nomme ses deux axes", () => {
  /** Les quatre étiquettes du plateau, avec leur boîte à l'écran, et celle du champ. */
  async function etiquettes(page: Page) {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    // Le classement complet arrive après le rendu serveur et pousse le plateau : mesurer une fois la page posée.
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const plateau = page.getByRole("region", { name: "Ton plateau" });
    const boite = async (texte: string) => {
      const etiquette = plateau.getByText(texte);
      await expect(etiquette).toBeVisible();
      return (await etiquette.boundingBox())!;
    };
    return {
      champ: (await plateau.locator(".field").boundingBox())!,
      haut: await boite("↑ progressiste"),
      bas: await boite("↓ conservateur"),
      gauche: await boite("← plus de redistribution"),
      droite: await boite("plus de marché →"),
    };
  }
  const centre = (b: { x: number; y: number; width: number; height: number }) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

  test("« plus de redistribution » à gauche, « plus de marché » à droite, « progressiste » en haut, « conservateur » en bas", async ({ page }) => {
    const { champ, haut, bas, gauche, droite } = await etiquettes(page);
    expect(centre(haut).y).toBeLessThan(champ.y + 10);
    expect(centre(bas).y).toBeGreaterThan(champ.y + champ.height - 10);
    expect(centre(gauche).x).toBeLessThan(champ.x + 10);
    expect(centre(droite).x).toBeGreaterThan(champ.x + champ.width - 10);
  });

  test.describe("sur un téléphone de 375 px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("les quatre étiquettes restent lisibles et ne se chevauchent pas", async ({ page }) => {
      const { haut, bas, gauche, droite } = await etiquettes(page);
      const boites = [haut, bas, gauche, droite];
      const seChevauchent = (a: (typeof boites)[number], b: (typeof boites)[number]) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) expect(seChevauchent(boites[i], boites[j])).toBe(false);
      for (const b of boites) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(375);
      }
    });
  });
});

test.describe("les 13 candidats sont posés en pions identiques", () => {
  /** Les pions des candidats sur le plateau : initiales, forme, teinte. */
  async function pionsDuPlateau(page: Page) {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const plateau = page.getByRole("region", { name: "Ton plateau" });
    await expect(plateau.locator(".field .you").getByText("TOI", { exact: true })).toBeVisible();
    // Les candidats n'arrivent qu'une fois les réponses de l'appareil lues.
    await expect(plateau.locator(".field .pawn")).toHaveCount(13);
    return plateau.locator(".field .pawn").evaluateAll((pions) =>
      pions.map((pion) => {
        const s = getComputedStyle(pion);
        return { initiales: pion.textContent!.trim(), forme: `${s.width}×${s.height} ${s.borderRadius}`, teinte: s.backgroundColor };
      }),
    );
  }

  test("avec 23 réponses, le plateau montre 13 pions de candidats, un par candidat du lancement, en plus du pion « TOI »", async ({ page }) => {
    const pions = await pionsDuPlateau(page);
    expect(pions.map((p) => p.initiales).sort()).toEqual(Object.values(INITIALES).sort());
    await expect(page.getByRole("region", { name: "Ton plateau" }).getByText("2 axes, 14 pions")).toBeVisible();
  });

  test("les 13 pions sont identiques, sans couleur de parti, et ne se distinguent que par leurs initiales", async ({ page }) => {
    const pions = await pionsDuPlateau(page);
    expect(pions).toHaveLength(13);
    expect(new Set(pions.map((p) => p.forme)).size).toBe(1);
    expect(new Set(pions.map((p) => p.initiales)).size).toBe(13);
    const encre = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.background = "var(--ink)";
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    });
    expect([...new Set(pions.map((p) => p.teinte))]).toEqual([encre]);
  });
});

test.describe("la légende relie chaque pion à son candidat", () => {
  /** Les lignes de la légende du plateau, dans l'ordre : initiales et nom. */
  async function legende(page: Page) {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const liste = page.getByRole("region", { name: "Ton plateau" }).getByRole("list", { name: "Légende du plateau" });
    await expect(liste.getByRole("listitem")).toHaveCount(14);
    return liste.getByRole("listitem").evaluateAll((lignes) =>
      lignes.map((ligne) => ({ initiales: ligne.querySelector(".pawn")!.textContent!.trim(), nom: ligne.querySelector(".pawn + span")!.textContent!.trim() })),
    );
  }

  test("pour chacun des 13 pions du plateau, la légende a une ligne aux mêmes initiales et au nom complet, dont FRu pour François Ruffin et FRo pour Fabien Roussel", async ({ page }) => {
    const lignes = await legende(page);
    expect(lignes[0]).toEqual({ initiales: "TOI", nom: "Toi, ton camembert" });
    const candidats = Object.fromEntries(lignes.slice(1).map(({ initiales, nom }) => [nom, initiales]));
    expect(candidats).toEqual(INITIALES);
    const surLePlateau = await page.getByRole("region", { name: "Ton plateau" }).locator(".field .pawn").allInnerTexts();
    expect(surLePlateau.sort()).toEqual(lignes.slice(1).map((l) => l.initiales).sort());
  });

  test("la légende range les candidats dans un ordre qui n'est ni celui du classement ni l'ordre alphabétique", async ({ page }) => {
    const noms = (await legende(page)).slice(1).map((l) => l.nom);
    const classement = (await lignesDuClassement(page)).map(([, nom]) => nom);
    expect(noms).not.toEqual(classement);
    expect(noms).not.toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
  });
});

test.describe("une option sans note sur un axe ne déplace pas le pion", () => {
  /**
   * La place du pion « TOI » pour un électeur qui a répondu A, avec les importances de `vingtTroisReponses`,
   * aux questions de ces numéros, plus B à la n° 24 si `avecLa24` (une option sans aucune note).
   */
  async function placeAvec(page: Page, numeros: number[], avecLa24 = false) {
    await page.goto("/");
    await page.evaluate(
      ([numeros, avecLa24]) => {
        const reponses: Record<number, object> = {};
        for (const numero of numeros as number[]) {
          const importance = numero <= 8 ? 3 : numero <= 14 ? 2 : 1;
          reponses[numero] = { option: "A", importance, graine: 1, jour: "2026-10-22", duJour: false };
        }
        if (avecLa24) reponses[24] = { option: "B", importance: 2, graine: 1, jour: "2026-10-23", duJour: true };
        localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
      },
      [numeros, avecLa24] as const,
    );
    await page.goto("/resultats");
    // Le rendu serveur, sans les réponses de l'appareil, pose le pion au centre : attendre qu'elles soient lues.
    await expect(page.getByRole("region", { name: "Ton plateau" }).locator(".field .pawn")).toHaveCount(13);
    return placeDuToi(page);
  }
  const vingtTrois = Array.from({ length: 23 }, (_, i) => i + 1);

  test("répondre en plus à une question dont l'option n'a aucune note économique laisse le pion « TOI » à la même place de gauche à droite", async ({ page }) => {
    const sans = await placeAvec(page, vingtTrois);
    const avec = await placeAvec(page, vingtTrois, true);
    expect(avec.x).toBe(sans.x);
  });

  test("une option notée seulement sur l'axe économique déplace le pion de gauche à droite sans changer sa hauteur ; une option sans aucune note ne le déplace pas", async ({ page }) => {
    // La n° 1 n'est notée que sur l'axe économique (A : −2).
    const sansLa1 = await placeAvec(page, vingtTrois.slice(1));
    const avecLa1 = await placeAvec(page, vingtTrois);
    expect(avecLa1.x).toBeLessThan(sansLa1.x);
    expect(avecLa1.y).toBe(sansLa1.y);
    // La n° 24 n'a aucune note.
    const avecLa24 = await placeAvec(page, vingtTrois, true);
    expect(avecLa24).toEqual(avecLa1);
  });
});

test.describe("avant 10 réponses, le plateau montre une position encore floue", () => {
  const plateauDeLaPage = (page: Page) => page.getByRole("region", { name: "Ton plateau" });

  test("avec 3 réponses, le plateau montre un pion « TOI » estompé, sans phrase par-dessus", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    await expect(plateauDeLaPage(page).locator(".board-note")).toHaveCount(0);
    const opacite = await plateauDeLaPage(page).locator(".field .you svg").evaluate((svg) => Number(getComputedStyle(svg).opacity));
    expect(opacite).toBeLessThan(1);
  });

  test("avec 3 réponses, aucun pion de candidat sur le plateau, et la légende dit « Les pions des candidats arrivent à 10 réponses »", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    const legende = plateauDeLaPage(page).getByRole("list", { name: "Légende du plateau" });
    await expect(legende.getByText("Les pions des candidats arrivent à 10 réponses")).toBeVisible();
    await expect(legende.getByText("Toi, ta position encore floue")).toBeVisible();
    await expect(plateauDeLaPage(page).locator(".field .pawn")).toHaveCount(0);
  });
});

test.describe("le camembert affiche 11 parts, une par thème", () => {
  const THEMES = [
    "Économie & impôts", "Travail & retraites", "Écologie & énergie", "Immigration", "Sécurité & justice", "Santé",
    "Éducation & jeunesse", "Logement", "Europe & international", "Institutions & démocratie", "Société",
  ];
  /** Les parts du grand camembert, dans l'ordre : l'angle de leur bord de départ et leur couleur. */
  const partsDuCamembert = (page: Page) =>
    page.locator(".big-token svg path").evaluateAll((parts) =>
      parts.map((part) => {
        const [x, y] = part.getAttribute("d")!.slice(1).split(/[ A]/).map(Number);
        return { angle: (Math.atan2(y - 100, x - 100) * 180) / Math.PI, couleur: getComputedStyle(part).fill };
      }),
    );

  test("sur « Mes résultats », le camembert est découpé en 11 parts égales", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.locator(".big-token svg")).toBeVisible();
    const parts = await partsDuCamembert(page);
    expect(parts).toHaveLength(11);
    for (let i = 0; i < 11; i++) {
      const pas = (((parts[(i + 1) % 11].angle - parts[i].angle) % 360) + 360) % 360;
      expect(pas).toBeCloseTo(360 / 11, 1);
    }
  });

  test("« Tes 11 thèmes » nomme les 11 thèmes de SPEC.md, et la couleur de chaque thème est celle d'une part du camembert", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const themes = page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem");
    await expect(themes).toHaveCount(11);
    const lignes = await themes.evaluateAll((items) =>
      // La couleur du thème est celle du contour de sa part, pleine ou en pointillés.
      items.map((item) => ({ nom: item.querySelector(".th-name")!.textContent, couleur: getComputedStyle(item.querySelector("svg path")!).stroke })),
    );
    expect(lignes.map((l) => l.nom)).toEqual(THEMES);
    expect(new Set(lignes.map((l) => l.couleur)).size).toBe(11);
    // Avec ces réponses, cinq parts sont gagnées : chacune prend la couleur de sa ligne, à sa place.
    await expect(page.locator(".big-token svg path.on")).toHaveCount(5);
    const parts = await partsDuCamembert(page);
    const gagnees = await page.locator(".big-token svg path").evaluateAll((p) => p.map((part) => part.classList.contains("on")));
    for (let i = 0; i < 11; i++) if (gagnees[i]) expect(parts[i].couleur).toBe(lignes[i].couleur);
  });
});

test.describe("une part se remplit après 3 réponses dans son thème", () => {
  /** La ligne d'un thème dans « Tes 11 thèmes » : ses pastilles allumées, et si sa part est remplie. */
  async function ligneDuTheme(page: Page, nom: string) {
    const ligne = page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem").filter({ hasText: nom });
    const pastilles = await ligne.locator(".pips i").evaluateAll((pips) => pips.map((pip) => (pip as HTMLElement).style.background !== ""));
    const index = await page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem").evaluateAll((items, nom) => items.findIndex((i) => i.textContent!.includes(nom)), nom);
    const remplie = await page.locator(".big-token svg path").nth(index).evaluate((part) => part.classList.contains("on"));
    return { allumees: pastilles.filter(Boolean).length, sur: pastilles.length, remplie };
  }
  async function reponsesAuxNumeros(page: Page, numeros: number[]) {
    await page.goto("/");
    await page.evaluate((numeros) => {
      const reponses: Record<number, object> = {};
      for (const numero of numeros) reponses[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22", duJour: false };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    }, numeros);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem")).toHaveCount(11);
  }

  test("avec 2 réponses en Travail & retraites, la ligne montre 2 pastilles allumées sur 3 et la part Travail & retraites est vide", async ({ page }) => {
    await reponsesAuxNumeros(page, [5, 12]);
    await expect(page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem").filter({ hasText: "Travail & retraites" }).locator(".pips")).toHaveAttribute("aria-label", "2 réponses");
    expect(await ligneDuTheme(page, "Travail & retraites")).toEqual({ allumees: 2, sur: 3, remplie: false });
  });

  test("après la réponse à la n° 24, la 3e du thème, les 3 pastilles sont allumées et la part Travail & retraites est remplie", async ({ page }) => {
    await reponsesAuxNumeros(page, [5, 12]);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem").filter({ hasText: "Travail & retraites" }).locator(".pips")).toHaveAttribute("aria-label", "3 réponses");
    expect(await ligneDuTheme(page, "Travail & retraites")).toEqual({ allumees: 3, sur: 3, remplie: true });
  });

  test("une 4e réponse dans un thème déjà gagné (Économie & impôts en a 4) laisse ses 3 pastilles allumées et sa part remplie", async ({ page }) => {
    await reponsesAuxNumeros(page, [1, 2, 4, 9]);
    await expect(page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem").filter({ hasText: "Économie & impôts" }).locator(".pips")).toHaveAttribute("aria-label", "4 réponses");
    expect(await ligneDuTheme(page, "Économie & impôts")).toEqual({ allumees: 3, sur: 3, remplie: true });
  });
});

test.describe("le camembert affiche le nombre de parts gagnées", () => {
  const compteur = (page: Page) => page.locator(".big-token .count");

  test("avec 23 réponses, dont 5 thèmes à 3 réponses ou plus, le camembert affiche « 5/11 parts »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(compteur(page)).toHaveText("5/11parts");
    await expect(page.getByRole("img", { name: "Camembert : 5 thèmes complétés sur 11" })).toBeVisible();
  });

  test("après la réponse à la n° 24, qui gagne la part Travail & retraites, il affiche « 6/11 parts »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(compteur(page)).toHaveText("6/11parts");
  });

  test("avec 3 réponses et aucun thème complet, il affiche « 0/11 »", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    await expect(compteur(page).locator("b")).toHaveText("0/11");
  });
});

/** Ce que dit chaque ligne de « Tes 11 thèmes » sous son nom, par thème. */
const sousLesThemes = async (page: Page) => {
  const lignes = page.getByRole("region", { name: "Tes 11 thèmes" }).getByRole("listitem");
  await expect(lignes).toHaveCount(11);
  return Object.fromEntries(
    await lignes.evaluateAll((items) => items.map((item) => [item.querySelector(".th-name")!.textContent, item.querySelector(".th-who")?.textContent ?? null])),
  );
};

test.describe("chaque thème affiche son candidat le plus proche", () => {
  test("avec 23 réponses, les 5 thèmes gagnés nomment Ruffin, Tondelier, Dupont-Aignan, Lisnard et Roussel", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.locator(".big-token .count b")).toHaveText("5/11");
    const textes = await sousLesThemes(page);
    expect(textes["Économie & impôts"]).toBe("le plus proche : François Ruffin");
    expect(textes["Écologie & énergie"]).toBe("le plus proche : Marine Tondelier");
    expect(textes["Immigration"]).toBe("le plus proche : Nicolas Dupont-Aignan");
    expect(textes["Sécurité & justice"]).toBe("le plus proche : David Lisnard");
    expect(textes["Santé"]).toBe("le plus proche : Fabien Roussel");
  });

  test("le candidat d'un thème peut différer du premier du classement : en Santé, Fabien Roussel, alors que François Ruffin est premier", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect((await lignesDuClassement(page))[0][1]).toBe("François Ruffin");
    expect((await sousLesThemes(page))["Santé"]).toBe("le plus proche : Fabien Roussel");
  });
});

test.describe("un thème sous 3 réponses dit « pas encore assez de réponses »", () => {
  const SOUS_TROIS = ["Travail & retraites", "Éducation & jeunesse", "Logement", "Europe & international", "Institutions & démocratie", "Société"];

  test("avec 23 réponses, les 6 thèmes sous 3 réponses disent « pas encore assez de réponses » et ne nomment aucun candidat", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.locator(".big-token .count b")).toHaveText("5/11");
    const textes = await sousLesThemes(page);
    for (const theme of SOUS_TROIS) expect(textes[theme], theme).toBe("pas encore assez de réponses");
  });

  test("après la réponse à la n° 24, la ligne Travail & retraites, qui a alors 3 réponses, nomme un candidat à la place du message", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(page.locator(".big-token .count b")).toHaveText("6/11");
    expect((await sousLesThemes(page))["Travail & retraites"]).toMatch(/^le plus proche : \S/);
  });
});

test.describe("la question du jour annonce la part en jeu", () => {
  const enJeu = (page: Page) => page.getByRole("link", { name: /Avec cette réponse/ });

  test("sur la fiche n° 24, avec 2 réponses en Travail & retraites et 5 parts gagnées, le bloc annonce la part en jeu et les 6 parts sur 11", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await expect(enJeu(page)).toBeVisible();
    await expect(enJeu(page).getByText("Avec cette réponse", { exact: true })).toBeVisible();
    await expect(enJeu(page).getByText("La part Travail & retraites", { exact: true })).toBeVisible();
    await expect(enJeu(page).getByText("Ton camembert passe à 6 parts sur 11.")).toBeVisible();
  });

  test("toucher ce bloc ouvre « Mes résultats »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await enJeu(page).click();
    await expect(page).toHaveURL(/\/resultats$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mes résultats." }).filter({ visible: true })).toBeVisible();
  });
});

test.describe("la révélation annonce la part gagnée", () => {
  test("avec 2 réponses en Travail & retraites, valider la n° 24 affiche « +1 réponse en Travail & retraites : 3/3, la part est gagnée ! » et « Ton camembert passe à 6 parts sur 11. »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    const bloc = page.getByRole("region", { name: "Ton camembert" }).filter({ visible: true });
    await expect(bloc.getByText("+1 réponse en Travail & retraites : 3/3, la part est gagnée !")).toBeVisible();
    await expect(bloc.getByText("Ton camembert passe à 6 parts sur 11.")).toBeVisible();
  });
});

test.describe("les résultats montrent la carte « Je suis à X % proche de Y »", () => {
  test("avec 23 réponses, la section « Ta carte » dit « Je suis à 81 % proche de François Ruffin. », le premier du classement", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const carte = page.getByRole("region", { name: "Ta carte" });
    await expect(carte.getByText(/^Je suis à 81\s%\sproche de François Ruffin\.$/)).toBeVisible();
    expect((await lignesDuClassement(page))[0]).toEqual(["1", "François Ruffin", "81 %"]);
  });

  test("toucher « Partager ma carte » ouvre la page « Ta carte », où « 81 % » et la phrase sont affichés en grand", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await page.getByRole("link", { name: "Partager ma carte" }).click();
    await expect(page).toHaveURL(/\/carte$/);
    await expect(page.getByRole("heading", { level: 1, name: "Ta carte." }).filter({ visible: true })).toBeVisible();
    const carte = page.getByRole("article", { name: /Carte à partager/ }).filter({ visible: true });
    await expect(carte.getByText(/^81\s%$/)).toBeVisible();
    await expect(carte.getByText(/^Je suis à 81\s%\sproche de François Ruffin\.$/)).toBeVisible();
  });
});

test.describe("la carte affiche réponses et thèmes", () => {
  const piedDeLaCarte = (page: Page) => page.getByRole("article", { name: /Carte à partager/ }).filter({ visible: true }).locator(".sc-f");

  test("avec 23 réponses et 5 parts gagnées, la carte affiche « 23 réponses · 5/11 thèmes »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(piedDeLaCarte(page)).toHaveText("23 réponses · 5/11 thèmes");
  });

  test("après la réponse à la n° 24, la carte affiche « 24 réponses · 6/11 thèmes »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/carte");
    await expect(piedDeLaCarte(page)).toHaveText("24 réponses · 6/11 thèmes");
  });
});

test.describe("la carte affiche le camembert", () => {
  /** Les parts remplies du camembert de la carte, par thème (dans l'ordre des thèmes). */
  const partsDeLaCarte = (page: Page) =>
    page
      .getByRole("article", { name: /Carte à partager/ })
      .filter({ visible: true })
      .locator(".sc-token svg path")
      .evaluateAll((parts) => parts.map((part) => part.classList.contains("on")));
  const THEMES = [
    "Économie & impôts", "Travail & retraites", "Écologie & énergie", "Immigration", "Sécurité & justice", "Santé",
    "Éducation & jeunesse", "Logement", "Europe & international", "Institutions & démocratie", "Société",
  ];
  const remplies = (parts: boolean[]) => THEMES.filter((_, i) => parts[i]);

  test("avec 5 parts gagnées, le camembert de la carte montre les 5 mêmes parts que « Mes résultats »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(page.getByRole("img", { name: "Camembert : 5 thèmes sur 11" })).toBeVisible();
    const parts = await partsDeLaCarte(page);
    expect(parts).toHaveLength(11);
    expect(remplies(parts)).toEqual(["Économie & impôts", "Écologie & énergie", "Immigration", "Sécurité & justice", "Santé"]);
    await page.goto("/resultats");
    await expect(page.locator(".big-token .count b")).toHaveText("5/11");
    const surLesResultats = await page.locator(".big-token svg path").evaluateAll((p) => p.map((part) => part.classList.contains("on")));
    expect(surLesResultats).toEqual(parts);
  });

  test("après la réponse à la n° 24, le camembert de la carte montre 6 parts : Travail & retraites s'est ajoutée", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/carte");
    await expect(page.getByRole("img", { name: "Camembert : 6 thèmes sur 11" })).toBeVisible();
    expect(remplies(await partsDeLaCarte(page))).toEqual(["Économie & impôts", "Travail & retraites", "Écologie & énergie", "Immigration", "Sécurité & justice", "Santé"]);
  });
});

test.describe("l'électeur choisit une carte qui ne montre que son pion", () => {
  const versions = (page: Page) => ({
    candidat: page.locator(".sp-slot").filter({ hasText: "Version 1 · avec mon candidat" }),
    pion: page.locator(".sp-slot").filter({ hasText: "Version 2 · seulement mon pion" }),
  });
  const choisirLaCarte = (page: Page, libelle: string) =>
    page.getByRole("group", { name: "Ce que ma carte montre" }).getByText(libelle, { exact: true }).click();

  test("au départ, la version « avec mon candidat » est « Choisie » ; avec « Seulement mon pion », c'est la version « Mon pion sur le plateau »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    const { candidat, pion } = versions(page);
    await expect(candidat.getByText("Choisie", { exact: true })).toBeVisible();
    await expect(pion.getByText("Choisie", { exact: true })).toBeHidden();
    await choisirLaCarte(page, "Seulement mon pion");
    await expect(pion.getByText("Choisie", { exact: true })).toBeVisible();
    await expect(candidat.getByText("Choisie", { exact: true })).toBeHidden();
  });

  test("la carte « Mon pion sur le plateau » montre le pion « TOI » près du centre, côté redistribution et progressiste, sans nom, pourcentage ni pion de candidat", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    const carte = page.getByRole("article", { name: "Carte à partager : mon pion sur le plateau, sans nom de candidat" });
    await expect(carte.getByRole("heading", { name: "Mon pion sur le plateau" })).toBeVisible();
    await expect(carte.locator(".field .pawn")).toHaveCount(0);
    for (const nom of Object.keys(INITIALES)) await expect(carte.getByText(nom)).toHaveCount(0);
    await expect(carte.getByText(/%/)).toHaveCount(0);
    const { x, y } = await carte.locator(".field .you").evaluate((toi: HTMLElement) => {
      const champ = toi.offsetParent as HTMLElement;
      const style = getComputedStyle(toi);
      return { x: parseFloat(style.left) / champ.clientWidth, y: parseFloat(style.top) / champ.clientHeight };
    });
    expect(x).toBeGreaterThan(0.35);
    expect(x).toBeLessThan(0.5);
    expect(y).toBeGreaterThan(0.35);
    expect(y).toBeLessThan(0.5);
  });

  test("en revenant sur « Mon candidat le plus proche », la version avec « 81 % » et « François Ruffin » redevient la choisie", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await choisirLaCarte(page, "Seulement mon pion");
    await choisirLaCarte(page, "Mon candidat le plus proche");
    const { candidat, pion } = versions(page);
    await expect(candidat.getByText("Choisie", { exact: true })).toBeVisible();
    await expect(pion.getByText("Choisie", { exact: true })).toBeHidden();
    await expect(candidat.getByText(/^81\s%$/)).toBeVisible();
    await expect(candidat.getByText("François Ruffin")).toBeVisible();
  });
});

/**
 * Un partage du téléphone de test : il garde, pour chaque partage, le type et la taille de l'image jointe,
 * et la couleur d'un point de son fond, en bas au milieu.
 */
async function partageDeTest(page: Page) {
  await page.addInitScript(() => {
    const partages: object[] = [];
    Object.assign(window, { partages });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: (donnees?: ShareData) => Boolean(donnees?.files?.length) });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (donnees: ShareData) => {
        const fichier = donnees.files![0];
        const image = await createImageBitmap(fichier);
        const toile = new OffscreenCanvas(image.width, image.height);
        const contexte = toile.getContext("2d")!;
        contexte.drawImage(image, 0, 0);
        const [r, g, b] = contexte.getImageData(Math.round(image.width / 2), Math.round(image.height * 0.985), 1, 1).data;
        partages.push({ type: fichier.type, largeur: image.width, hauteur: image.height, fond: [r, g, b] });
      },
    });
  });
}
const partagesFaits = (page: Page) => page.evaluate(() => (window as unknown as { partages: { type: string; largeur: number; hauteur: number; fond: number[] }[] }).partages);
/** La couleur d'un jeton du kit, en [r, g, b]. */
const couleurDuJeton = (page: Page, jeton: string) =>
  page.evaluate((jeton) => {
    const el = document.createElement("div");
    el.style.background = `var(${jeton})`;
    document.body.append(el);
    const [r, g, b] = getComputedStyle(el).backgroundColor.match(/\d+/g)!.map(Number);
    el.remove();
    return [r, g, b];
  }, jeton);
const proche = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) <= 12);

test.describe("« Partager » envoie l'image 9:16 au partage du téléphone", () => {
  test("toucher « Partager » ouvre le partage du téléphone avec l'image de la carte choisie, au format 9:16", async ({ page }) => {
    await partageDeTest(page);
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(page.getByText("L'image est dessinée sur ton téléphone : rien n'est envoyé.")).toBeVisible();
    await page.getByRole("button", { name: "Partager", exact: true }).click();
    await expect.poll(async () => (await partagesFaits(page)).length).toBe(1);
    const [partage] = await partagesFaits(page);
    expect(partage.type).toBe("image/png");
    expect(partage.largeur * 16).toBe(partage.hauteur * 9);
    expect(proche(partage.fond, await couleurDuJeton(page, "--eco"))).toBe(true);
  });

  test("en mode avion, « Partager » ouvre quand même le partage avec l'image : elle est dessinée sur le téléphone", async ({ page, context }) => {
    await partageDeTest(page);
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(page.getByRole("article", { name: /Carte à partager : 81/ })).toBeVisible();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Partager", exact: true }).click();
    await expect.poll(async () => (await partagesFaits(page)).length).toBe(1);
    expect((await partagesFaits(page))[0].type).toBe("image/png");
    await context.setOffline(false);
  });

  test("l'image jointe est celle de la version choisie : avec « Seulement mon pion », c'est la carte du pion, sans nom", async ({ page }) => {
    await partageDeTest(page);
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await page.getByRole("group", { name: "Ce que ma carte montre" }).getByText("Seulement mon pion", { exact: true }).click();
    await page.getByRole("button", { name: "Partager", exact: true }).click();
    await expect.poll(async () => (await partagesFaits(page)).length).toBe(1);
    const [partage] = await partagesFaits(page);
    expect(proche(partage.fond, await couleurDuJeton(page, "--immi"))).toBe(true);
  });
});

test.describe("« Télécharger l'image » enregistre la carte", () => {
  /** Touche « Télécharger l'image » et lit l'image enregistrée : type, taille, et couleur du fond en bas au milieu. */
  async function telecharger(page: Page) {
    const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Télécharger l'image" }).click()]);
    const chemin = await telechargement.path();
    const octets = (await import("node:fs")).readFileSync(chemin);
    const image = await page.evaluate(async (base64) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
      const toile = new OffscreenCanvas(bitmap.width, bitmap.height);
      const contexte = toile.getContext("2d")!;
      contexte.drawImage(bitmap, 0, 0);
      const [r, g, b] = contexte.getImageData(Math.round(bitmap.width / 2), Math.round(bitmap.height * 0.985), 1, 1).data;
      return { largeur: bitmap.width, hauteur: bitmap.height, fond: [r, g, b] };
    }, octets.toString("base64"));
    return { png: octets.subarray(1, 4).toString() === "PNG", nom: telechargement.suggestedFilename(), ...image };
  }

  test("toucher « Télécharger l'image » enregistre une image de la carte au format story 9:16", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(page.getByRole("article", { name: /Carte à partager : 81/ })).toBeVisible();
    const image = await telecharger(page);
    expect(image.png).toBe(true);
    expect(image.nom).toMatch(/\.png$/);
    expect(image.largeur * 16).toBe(image.hauteur * 9);
    expect(proche(image.fond, await couleurDuJeton(page, "--eco"))).toBe(true);
  });

  test("l'image enregistrée est celle de la version choisie : avec « Seulement mon pion », la carte du pion", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await page.getByRole("group", { name: "Ce que ma carte montre" }).getByText("Seulement mon pion", { exact: true }).click();
    const image = await telecharger(page);
    expect(proche(image.fond, await couleurDuJeton(page, "--immi"))).toBe(true);
  });

  test("en mode avion, le téléchargement fonctionne aussi", async ({ page, context }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    await expect(page.getByRole("article", { name: /Carte à partager : 81/ })).toBeVisible();
    await context.setOffline(true);
    const image = await telecharger(page);
    expect(image.png).toBe(true);
    await context.setOffline(false);
  });
});

test.describe("avant 10 réponses, la carte reste verrouillée", () => {
  /** 3 réponses : les n° 1 et 2 en rattrapage, la n° 23 comme question du jour du 22 octobre. */
  async function troisReponses(page: Page) {
    await premieresReponses(page, 2);
    await page.evaluate(() => {
      const reponses = JSON.parse(localStorage.getItem("aucrible:reponses")!);
      reponses[23] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22", duJour: true };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
  }
  const carte = (page: Page) => page.getByRole("region", { name: "Ta carte" });

  test("avec 3 réponses, la carte est grisée, cadenassée, dit « Je suis à … % proche de … » sans nom ni pourcentage, et son pied dit « 3 réponses · 0/11 parts · 1 jour d'affilée »", async ({ page }) => {
    await troisReponses(page);
    await page.goto("/resultats");
    const apercu = carte(page).getByLabel("Aperçu verrouillé de la carte à partager");
    await expect(apercu).toBeVisible();
    await expect(apercu.locator(".story-lock svg")).toBeVisible();
    await expect(apercu.getByText("Je suis à … % proche de …", { exact: true })).toBeVisible();
    await expect(apercu.getByText(/\d+\s?%/)).toHaveCount(0);
    for (const nom of Object.keys(INITIALES)) await expect(apercu.getByText(nom)).toHaveCount(0);
    await expect(apercu.locator(".story-f")).toHaveText("3 réponses · 0/11 parts");
  });

  test("le bouton « Partager ma carte » est inactif et le texte dit « Ta carte se débloque à 10 réponses. Il t'en reste 7. »", async ({ page }) => {
    await troisReponses(page);
    await page.goto("/resultats");
    await expect(carte(page).getByRole("button", { name: "Partager ma carte" })).toBeDisabled();
    await expect(carte(page).getByText("Ta carte se débloque à 10 réponses. Il t'en reste 7.")).toBeVisible();
  });

  test("à la 10e réponse, la carte se débloque et « Partager ma carte » ouvre la page « Ta carte »", async ({ page }) => {
    await premieresReponses(page, 9);
    await page.goto("/resultats");
    await expect(carte(page).getByRole("button", { name: "Partager ma carte" })).toBeDisabled();
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await carte(page).getByRole("link", { name: "Partager ma carte" }).click();
    await expect(page).toHaveURL(/\/carte$/);
    await expect(page.getByRole("article", { name: /Carte à partager/ }).first()).toBeVisible();
  });
});

test.describe("la carte affiche « Et toi ? aucrible2027.fr »", () => {
  test("en bas de la carte « avec mon candidat », on lit « Et toi ? » et « aucrible2027.fr »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    const bas = page.getByRole("article", { name: /Carte à partager : 81/ }).locator(".sc-ask");
    await expect(bas.getByText("Et toi ?", { exact: true })).toBeVisible();
    await expect(bas.getByText("aucrible2027.fr", { exact: true })).toBeVisible();
  });

  test("en bas de la carte « seulement mon pion », on lit « Et toi, tu te places où ? » et la même adresse", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/carte");
    const bas = page.getByRole("article", { name: "Carte à partager : mon pion sur le plateau, sans nom de candidat" }).locator(".sc-ask");
    await expect(bas.getByText("Et toi, tu te places où ?", { exact: true })).toBeVisible();
    await expect(bas.getByText("aucrible2027.fr", { exact: true })).toBeVisible();
  });
});

test.describe("l'électeur ouvre la fiche d'un candidat", () => {
  /** Le pion en tête de la fiche d'un candidat : initiales, forme, teinte. */
  async function pionDeLaFiche(page: Page, id: string) {
    await page.goto(`/candidat/${id}`);
    return page.locator(".id-card .pawn").evaluate((pion) => {
      const s = getComputedStyle(pion);
      return { initiales: pion.textContent!.trim(), forme: `${s.width}×${s.height} ${s.borderRadius}`, teinte: s.backgroundColor };
    });
  }

  test("la fiche de Marine Tondelier affiche « Fiche candidat », son nom en titre et son pion « MT »", async ({ page }) => {
    await page.goto("/candidat/tondelier");
    await expect(page.getByText("Fiche candidat", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Marine Tondelier" })).toBeVisible();
    expect((await pionDeLaFiche(page, "tondelier")).initiales).toBe("MT");
  });

  test("les fiches de Mélenchon (JLM) et de Le Pen (MLP) ont le même pion que celle de Tondelier : seules les initiales changent", async ({ page }) => {
    const tondelier = await pionDeLaFiche(page, "tondelier");
    const melenchon = await pionDeLaFiche(page, "melenchon");
    const lePen = await pionDeLaFiche(page, "le-pen");
    expect([melenchon.initiales, lePen.initiales]).toEqual(["JLM", "MLP"]);
    for (const pion of [melenchon, lePen]) expect({ forme: pion.forme, teinte: pion.teinte }).toEqual({ forme: tondelier.forme, teinte: tondelier.teinte });
  });
});

test.describe("un nom révélé ouvre la fiche du candidat", () => {
  async function ouvrirLaFiche(page: Page, zone: import("@playwright/test").Locator, nom: string) {
    await zone.getByRole("link", { name: nom }).first().click();
    await expect(page).toHaveURL(/\/candidat\/[a-z-]+$/);
    await expect(page.getByRole("heading", { level: 1, name: nom }).filter({ visible: true })).toBeVisible();
  }

  test("sur la révélation de la n° 24, toucher « Marine Tondelier » sous son option ouvre sa fiche", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    await ouvrirLaFiche(page, quiDefendQuoi(page), "Marine Tondelier");
  });

  test("toucher un nom de « Sur ce sujet, tu es aligné·e avec » (Édouard Philippe) ouvre sa fiche", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    await ouvrirLaFiche(page, alignes(page), "Édouard Philippe");
  });

  test("toucher un nom rangé sous « Position inconnue » (François Ruffin) ouvre aussi sa fiche", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    await ouvrirLaFiche(page, quiDefendQuoi(page).locator(".ropt.unknown"), "François Ruffin");
  });
});

test.describe("un candidat du classement ouvre sa fiche", () => {
  for (const [rang, nom] of [["1er", "François Ruffin"], ["13e", "Éric Zemmour"]]) {
    test(`dans « Mes résultats », toucher la ligne « ${nom} » (${rang}) ouvre sa fiche`, async ({ page }) => {
      await vingtTroisReponses(page);
      await page.goto("/resultats");
      const classement = page.getByRole("region", { name: "Ton classement" });
      await expect(classement.getByRole("listitem")).toHaveCount(13);
      await classement.getByRole("link", { name: new RegExp(nom) }).click();
      await expect(page).toHaveURL(/\/candidat\/[a-z-]+$/);
      await expect(page.getByRole("heading", { level: 1, name: nom }).filter({ visible: true })).toBeVisible();
    });
  }
});

test.describe("la fiche affiche le parti du candidat", () => {
  /** Le parti écrit sur la fiche d'un candidat, et sa couleur. */
  async function parti(page: Page, id: string) {
    await page.goto(`/candidat/${id}`);
    const texte = page.locator(".id-card .party");
    await expect(texte).toBeVisible();
    return { texte: (await texte.innerText()).trim(), couleur: await texte.evaluate((el) => getComputedStyle(el).color) };
  }

  test("les fiches de Tondelier, Glucksmann et Retailleau affichent « Les Écologistes », « Place publique / PS » et « LR »", async ({ page }) => {
    expect((await parti(page, "tondelier")).texte).toBe("Les Écologistes");
    expect((await parti(page, "glucksmann")).texte).toBe("Place publique / PS");
    expect((await parti(page, "retailleau")).texte).toBe("LR");
  });

  test("le parti est écrit en texte, de la même couleur pour tous : jamais celle du parti", async ({ page }) => {
    const couleurs = [];
    for (const id of ["tondelier", "glucksmann", "retailleau", "le-pen", "melenchon"]) couleurs.push((await parti(page, id)).couleur);
    expect(new Set(couleurs).size).toBe(1);
  });
});

test("la fiche de Marine Tondelier affiche le statut de sa candidature, sous le parti", async ({ page }) => {
  await page.goto("/candidat/tondelier");
  const statut = page.locator(".id-card .status");
  await expect(statut).toHaveText("Candidature déclarée — vote des adhérents prévu du 10 au 13 décembre 2026");
  await expect(page.locator(".id-card .party")).toBeVisible();
  const [parti, ligne] = await Promise.all([page.locator(".id-card .party").boundingBox(), statut.boundingBox()]);
  expect(ligne!.y).toBeGreaterThan(parti!.y + parti!.height - 1);
});

/**
 * La fiche de Marine Tondelier sur le jeu de fiches de test « candidat » (les 24 questions de maquettes/candidat.html),
 * pour un électeur qui a répondu aux 24 questions publiées le 23 octobre, ouverte ce jour-là ou le jour donné.
 * Renvoie la section « Ses positions ».
 */
async function positionsDeTondelier(page: Page, jour = "2026-10-23T09:00:00+02:00") {
  await fixerLeJour(page, jour);
  await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "candidat", url: "http://localhost:3127" }]);
  await page.goto("/candidat/tondelier");
  await page.evaluate(() => {
    const reponses: Record<number, object> = {};
    for (let n = 1; n <= 24; n++) reponses[n] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22", duJour: false };
    localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
  });
  await page.reload();
  const positions = page.getByRole("region", { name: "Ses positions" });
  await expect(positions).toBeVisible();
  return positions;
}

test.describe("la fiche range ses positions par thème", () => {
  test("la fiche de Marine Tondelier affiche 11 blocs, un par thème, de « Économie & impôts » à « Société »", async ({ page }) => {
    const positions = await positionsDeTondelier(page);
    await expect(positions.locator(".pos-theme").getByRole("heading", { level: 3 })).toHaveText([
      "Économie & impôts",
      "Travail & retraites",
      "Écologie & énergie",
      "Immigration",
      "Sécurité & justice",
      "Santé",
      "Éducation & jeunesse",
      "Logement",
      "Europe & international",
      "Institutions & démocratie",
      "Société",
    ]);
    await expect(positions.getByRole("region")).toHaveCount(11);
  });

  test("sous « Travail & retraites », Q5, Q13 et Q24 « À quel âge devrait-on pouvoir partir à la retraite ? », avec l'option A « 60 ans »", async ({ page }) => {
    const travail = (await positionsDeTondelier(page)).getByRole("region", { name: "Travail & retraites" });
    await expect(travail.locator(".pos-n")).toHaveText(["Q5", "Q13", "Q24"]);
    const q24 = travail.getByRole("listitem").filter({ hasText: "Q24" });
    await expect(q24.locator(".pos-q")).toHaveText("Q24À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(q24.locator(".pos-letter")).toHaveText("A");
    await expect(q24.locator(".pos-title")).toHaveText("60 ans");
  });

  test("sous « Écologie & énergie », Q4 « Faut-il construire de nouveaux réacteurs nucléaires ? » donne l'option A « Non, miser sur le renouvelable »", async ({ page }) => {
    const ecologie = (await positionsDeTondelier(page)).getByRole("region", { name: "Écologie & énergie" });
    const q4 = ecologie.getByRole("listitem").filter({ hasText: "Q4" });
    await expect(q4.locator(".pos-q")).toHaveText("Q4Faut-il construire de nouveaux réacteurs nucléaires ?");
    await expect(q4.locator(".pos-letter")).toHaveText("A");
    await expect(q4.locator(".pos-title")).toHaveText("Non, miser sur le renouvelable");
  });
});

test.describe("chaque position affiche sa source datée", () => {
  /** La ligne de la fiche de Tondelier pour la question n° numero. */
  const ligne = async (page: Page, numero: number) =>
    (await positionsDeTondelier(page)).getByRole("listitem").filter({ has: page.locator(".pos-n", { hasText: new RegExp(`^Q${numero}$`) }) });

  test("sur Q9, la position C « Oui, sur tout le patrimoine » affiche « Source : Déclaration sur France Inter, 12/09/2026 »", async ({ page }) => {
    const q9 = await ligne(page, 9);
    await expect(q9.locator(".pos-q")).toHaveText("Q9Faut-il rétablir l'impôt sur la fortune ?");
    await expect(q9.locator(".pos-letter")).toHaveText("C");
    await expect(q9.locator(".pos-title")).toHaveText("Oui, sur tout le patrimoine");
    await expect(q9.locator(".pos-src .src")).toHaveText("Source : Déclaration sur France Inter, 12/09/2026");
  });

  test("sur Q24, la position A « 60 ans » affiche « Source : Vote du groupe Écologiste et social, 2024 »", async ({ page }) => {
    const q24 = await ligne(page, 24);
    await expect(q24.locator(".pos-title")).toHaveText("60 ans");
    await expect(q24.locator(".pos-src .src")).toHaveText("Source : Vote du groupe Écologiste et social, 2024");
  });
});

test.describe("chaque position porte son badge", () => {
  /** Le badge et la source de la ligne de la question n° numero, sur la fiche de Tondelier. */
  async function badgeEtSource(page: Page, numero: number) {
    const positions = page.getByRole("region", { name: "Ses positions" });
    const ligne = positions.getByRole("listitem").filter({ has: page.locator(".pos-n", { hasText: new RegExp(`^Q${numero}$`) }) });
    return [(await ligne.locator(".pos-src .badge").innerText()).trim(), (await ligne.locator(".pos-src .src").textContent())!.trim()];
  }

  test("Q9 (« Déclaration sur France Inter, 12/09/2026 ») porte « position officielle », Q24 (« Vote du groupe Écologiste et social, 2024 ») « position déduite »", async ({ page }) => {
    await positionsDeTondelier(page);
    expect(await badgeEtSource(page, 9)).toEqual(["position officielle", "Source : Déclaration sur France Inter, 12/09/2026"]);
    expect(await badgeEtSource(page, 24)).toEqual(["position déduite", "Source : Vote du groupe Écologiste et social, 2024"]);
  });

  test("une déclaration datée donne « position officielle » (Q5), le programme 2022 du parti « position déduite » (Q2)", async ({ page }) => {
    await positionsDeTondelier(page);
    expect(await badgeEtSource(page, 5)).toEqual(["position officielle", "Source : Déclaration sur BFMTV, 21/09/2026"]);
    expect(await badgeEtSource(page, 2)).toEqual(["position déduite", "Source : Programme 2022 des Écologistes"]);
  });
});

test.describe("une question sans source affiche « position inconnue »", () => {
  /** La ligne de la question n° numero, sur la fiche de Tondelier déjà ouverte. */
  const ligneDeLaFiche = (page: Page, numero: number) =>
    page
      .getByRole("region", { name: "Ses positions" })
      .getByRole("listitem")
      .filter({ has: page.locator(".pos-n", { hasText: new RegExp(`^Q${numero}$`) }) });

  /** La ligne dit « ? » et « Position inconnue — pas de source à ce jour », sans note ni badge. */
  async function attendreUnePositionInconnue(ligne: Locator) {
    await expect(ligne.locator(".pos-letter")).toHaveText("?");
    await expect(ligne.locator(".pos-title")).toHaveText("Position inconnue — pas de source à ce jour");
    await expect(ligne.locator(".pos-src")).toHaveCount(0);
    await expect(ligne.locator(".badge")).toHaveCount(0);
  }

  test("sur la fiche de Marine Tondelier, Q17 affiche « ? » et « Position inconnue — pas de source à ce jour », sans badge", async ({ page }) => {
    await positionsDeTondelier(page);
    await attendreUnePositionInconnue(ligneDeLaFiche(page, 17));
  });

  test("Q22 « Faut-il supprimer Parcoursup ? » s'affiche de la même façon, et les 22 autres questions affichent une option", async ({ page }) => {
    const positions = await positionsDeTondelier(page);
    const q22 = positions.getByRole("region", { name: "Éducation & jeunesse" }).getByRole("listitem").filter({ hasText: "Faut-il supprimer Parcoursup ?" });
    await expect(q22.locator(".pos-n")).toHaveText("Q22");
    await attendreUnePositionInconnue(q22);
    const lettres = await positions.locator(".pos-letter").allInnerTexts();
    expect(lettres).toHaveLength(24);
    expect(lettres.filter((l) => /^[A-E]$/.test(l.trim()))).toHaveLength(22);
  });
});

test.describe("la fiche ne montre que les questions publiées", () => {
  test("la fiche de Marine Tondelier annonce « 24 questions publiées » et en liste 24, de Q1 à Q24", async ({ page }) => {
    const positions = await positionsDeTondelier(page);
    await expect(positions.locator(".sec-h p")).toHaveText("24 questions publiées");
    const numeros = (await positions.locator(".pos-n").allInnerTexts()).map((n) => Number(n.replace("Q", "")));
    expect([...numeros].sort((a, b) => a - b)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  test("chaque bloc de thème dit combien de questions publiées il contient", async ({ page }) => {
    const positions = await positionsDeTondelier(page);
    await expect(positions.getByRole("region", { name: "Économie & impôts" }).getByRole("img")).toHaveAccessibleName("3 questions publiées, 1 sans position connue");
    await expect(positions.getByRole("region", { name: "Travail & retraites" }).getByRole("img")).toHaveAccessibleName("3 questions publiées");
    await expect(positions.getByRole("region", { name: "Société" }).getByRole("img")).toHaveAccessibleName("1 question publiée");
  });

  test("une question programmée pour demain n'apparaît pas aujourd'hui, ni son numéro ni son thème ; elle apparaît demain, sous son thème", async ({ page }) => {
    let positions = await positionsDeTondelier(page);
    await expect(positions.getByText("Q25")).toHaveCount(0);
    await expect(positions.getByText("Question de test programmée pour le 24 octobre ?")).toHaveCount(0);
    let societe = positions.getByRole("region", { name: "Société" });
    await expect(societe.locator(".pos-n")).toHaveText(["Q3"]);
    await expect(societe.getByRole("img")).toHaveAccessibleName("1 question publiée");
    expect(await page.content()).not.toContain("Question de test programmée");

    positions = await positionsDeTondelier(page, "2026-10-24T09:00:00+02:00");
    await expect(positions.locator(".sec-h p")).toHaveText("25 questions publiées");
    societe = positions.getByRole("region", { name: "Société" });
    await expect(societe.locator(".pos-n")).toHaveText(["Q3", "Q25"]);
    await expect(societe.getByRole("listitem").filter({ hasText: "Q25" }).locator(".pos-q")).toHaveText("Q25Question de test programmée pour le 24 octobre ?");
    await expect(societe.getByRole("img")).toHaveAccessibleName("2 questions publiées");
  });
});

test.describe("la fiche affiche sa proximité avec l'électeur", () => {
  /** « Ta proximité : N % » et la note qui la suit, sur la fiche du candidat. */
  async function proximiteSurLaFiche(page: Page, id: string) {
    await page.goto(`/candidat/${id}`);
    const encart = page.getByRole("region", { name: "Ta proximité" });
    await expect(encart.locator(".prox-note")).toBeVisible();
    return [(await encart.locator(".prox-line").textContent())!.trim(), (await encart.locator(".prox-note").textContent())!.trim()];
  }

  test("pour l'électeur de la maquette (23 réponses), la fiche de Marine Tondelier affiche « Ta proximité : 71 % » et « 3e sur 13 »", async ({ page }) => {
    await vingtTroisReponses(page);
    const [ligne, note] = await proximiteSurLaFiche(page, "tondelier");
    expect(ligne).toBe("Ta proximité : 71 %");
    expect(note).toBe("3e sur 13");
    await expect(page.locator(".prox-bar i")).toHaveAttribute("style", /--p: ?71/);
  });

  test("ce pourcentage et ce rang sont ceux de « Mes résultats » ; sur la fiche de François Ruffin, 81 % et « 1er sur 13 »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const lignes = await lignesDuClassement(page);
    for (const [id, nom] of [["tondelier", "Marine Tondelier"], ["ruffin", "François Ruffin"]]) {
      const [rang, , pourcentage] = lignes.find(([, n]) => n === nom)!;
      const [ligne, note] = await proximiteSurLaFiche(page, id);
      expect(ligne).toBe(`Ta proximité : ${pourcentage}`);
      expect(note).toMatch(new RegExp(`^${rang}(er|e) sur 13$`));
    }
    const [ligne, note] = await proximiteSurLaFiche(page, "ruffin");
    expect([ligne, note.split(",")[0]]).toEqual(["Ta proximité : 81 %", "1er sur 13"]);
  });
});

test.describe("la fiche ne refait pas la légende des badges", () => {
  test("ni « Comment lire une position », ni résumé au-dessus des positions : chaque badge dit déjà ce qu'il est", async ({ page }) => {
    const positions = await positionsDeTondelier(page);
    await expect(page.getByRole("group", { name: "Comment lire une position" })).toHaveCount(0);
    await expect(page.locator(".pos-sum")).toHaveCount(0);
    await expect(positions.locator(".badge").first()).toHaveText(/position (officielle|déduite)/);
  });
});

test.describe("la page Méthode explique le score d'une question avec un exemple", () => {
  const regle1 = (page: Page) => page.getByRole("article", { name: "Chaque question donne un score entre 0 et 100 %" });

  test("la page « Méthode de calcul et sources » s'ouvre sur sa première règle, qui écrit la formule « score = 1 − écart ÷ écart maximum »", async ({ page }) => {
    await page.goto("/methode");
    // Le titre passe à la ligne avant « et sources » (un <br>, comme la maquette).
    expect((await page.getByRole("heading", { level: 1 }).innerText()).replace(/\s+/g, " ")).toBe("Méthode de calcul et sources.");
    await expect(page.getByText("Tout est publié, rien n'est caché.")).toBeVisible();
    await expect(page.getByRole("article").first()).toHaveAccessibleName("Chaque question donne un score entre 0 et 100 %");
    await expect(regle1(page).getByText("Règle n° 1")).toBeVisible();
    await expect(regle1(page).getByText("score = 1 − écart ÷ écart maximum", { exact: true })).toBeVisible();
  });

  test("l'exemple de la question n° 24 place TOI sur 62 ans et un candidat sur 64 ans (écart 1, écart maximum 3) et conclut « 1 − 1/3 ≈ 67 % »", async ({ page }) => {
    await page.goto("/methode");
    const exemple = regle1(page).getByRole("figure", { name: "Exemple de score sur la question de la retraite" });
    await expect(exemple.getByText("Exemple · question n° 24")).toBeVisible();
    /** La case d'âge sous laquelle se tient le pion. */
    const caseSousLePion = (pion: string) =>
      exemple.locator(".scale").evaluate((echelle, pion) => {
        const marque = [...echelle.querySelectorAll(".mk")].find((m) => m.textContent === pion)!.getBoundingClientRect();
        const milieu = marque.left + marque.width / 2;
        const tuile = [...echelle.querySelectorAll(".tile")].find((t) => {
          const r = t.getBoundingClientRect();
          return r.left <= milieu && milieu <= r.right;
        });
        return tuile?.querySelector("b")?.textContent;
      }, pion);
    expect(await caseSousLePion("TOI")).toBe("62");
    expect(await caseSousLePion("C")).toBe("64");
    await expect(exemple.locator(".key li")).toHaveText(["TOITa carte : 62 ans", "CCelle d'un candidat : 64 ans"]);
    await expect(exemple.locator(".brk em")).toHaveText(["écart : 1", "écart maximum : 3"]);
    const egalite = exemple.locator(".eq");
    await expect(egalite).toHaveAccessibleName("1 moins 1 sur 3, soit environ 67 pour cent");
    await expect(egalite.locator(".frac b")).toHaveText(["1", "3"]);
    await expect(egalite.locator("mark")).toHaveText("67 %");
  });

  test("pour les options sans ordre, la page montre « A = A », « Même carte : 1 (100 %) », et « A ≠ C », « Cartes différentes : 0 »", async ({ page }) => {
    await page.goto("/methode");
    const paires = regle1(page).getByRole("figure", { name: "Exemple de score pour des options non ordonnées" }).getByRole("listitem");
    await expect(paires).toHaveText(["A=AMême carte : 1 (100 %)", "A≠CCartes différentes : 0"]);
    await expect(paires.nth(0).getByLabel("égale")).toBeVisible();
    await expect(paires.nth(1).getByLabel("différente de")).toBeVisible();
  });
});

test.describe("un candidat retiré sort du classement", () => {
  /** Marine Tondelier retirée le 14/12/2026 (ajout de test « retrait »), « Mes résultats » ouverts le lendemain. */
  async function classementApresLeRetrait(page: Page, retrait: boolean) {
    await fixerLeJour(page, "2026-12-15T09:00:00+01:00");
    if (retrait) await page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "retrait", url: "http://localhost:3127" }]);
    else await page.context().clearCookies({ name: "aucrible-candidats-de-test" });
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(retrait ? 12 : 13);
    return lignesDuClassement(page);
  }

  test("une fois Marine Tondelier retirée (14/12/2026), « Mes résultats » classe 12 candidats, sans elle ni pourcentage pour elle", async ({ page }) => {
    await vingtTroisReponses(page);
    const lignes = await classementApresLeRetrait(page, true);
    expect(lignes.map(([rang]) => rang)).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1)));
    expect(lignes.map(([, nom]) => nom)).not.toContain("Marine Tondelier");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByText("Marine Tondelier")).toHaveCount(0);
  });

  test("les pourcentages des 12 autres candidats ne changent pas", async ({ page }) => {
    await vingtTroisReponses(page);
    const avant = await classementApresLeRetrait(page, false);
    expect(avant.find(([, nom]) => nom === "Marine Tondelier")).toEqual(["3", "Marine Tondelier", "71 %"]);
    const apres = await classementApresLeRetrait(page, true);
    expect(apres.map(([, nom, pourcentage]) => [nom, pourcentage])).toEqual(
      avant.filter(([, nom]) => nom !== "Marine Tondelier").map(([, nom, pourcentage]) => [nom, pourcentage]),
    );
  });
});

test.describe("la fiche d'un candidat retiré dit quand et qui il soutient", () => {
  /** La fiche de Marine Tondelier, avec son retrait de test du 14/12/2026, ouverte le jour donné. */
  async function ficheApresLeRetrait(page: Page, jour = "2026-12-15T09:00:00+01:00") {
    await fixerLeJour(page, jour);
    await page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "retrait", url: "http://localhost:3127" }]);
    await page.goto("/candidat/tondelier");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Marine Tondelier");
  }

  test("la fiche d'une candidate retirée affiche « Marine Tondelier s'est retirée le 14/12/2026 et soutient Raphaël Glucksmann. » et « Sa fiche reste consultable, mais elle sort du classement. »", async ({ page }) => {
    await ficheApresLeRetrait(page);
    await expect(page.locator(".gone p")).toHaveText([
      "Marine Tondelier s'est retirée le 14/12/2026 et soutient Raphaël Glucksmann.",
      "Sa fiche reste consultable, mais elle sort du classement.",
    ]);
  });

  test("toucher « Raphaël Glucksmann » dans cette phrase ouvre la fiche de Raphaël Glucksmann", async ({ page }) => {
    await ficheApresLeRetrait(page);
    await page.locator(".gone").getByRole("link", { name: "Raphaël Glucksmann" }).click();
    await page.waitForURL(/\/candidat\/glucksmann$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Raphaël Glucksmann");
  });

  test("avant le jour du retrait, la fiche n'en dit rien", async ({ page }) => {
    await ficheApresLeRetrait(page, "2026-12-13T09:00:00+01:00");
    await expect(page.getByRole("region", { name: "Ses positions" })).toBeVisible();
    await expect(page.locator(".gone")).toHaveCount(0);
  });
});

test.describe("un candidat retiré n'apparaît plus dans les nouvelles révélations", () => {
  /**
   * La révélation de la n° 24, répondue C le 15/12/2026, le lendemain du retrait de test de Marine Tondelier
   * (ou sans ce retrait). Renvoie, pour chaque bloc de « Qui défend quoi », son titre et ses candidats, triés.
   */
  async function revelationApresLeRetrait(page: Page, retrait: boolean) {
    await fixerLeJour(page, "2026-12-15T09:00:00+01:00");
    if (retrait) await page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "retrait", url: "http://localhost:3127" }]);
    else await page.context().clearCookies({ name: "aucrible-candidats-de-test" });
    await page.goto("/rattrapage");
    await page.evaluate(() =>
      localStorage.setItem("aucrible:reponses", JSON.stringify({ 24: { option: "C", importance: 2, graine: 1, jour: "2026-12-15", duJour: false } })),
    );
    await page.goto("/question/24/revelation");
    const qui = page.getByRole("region", { name: "Qui défend quoi" });
    await expect(qui.getByRole("article").first()).toBeVisible();
    const blocs = await qui.getByRole("article").evaluateAll((articles) =>
      articles.map((a) => [a.querySelector("h3")!.textContent, [...a.querySelectorAll(".def-name")].map((n) => n.textContent).sort()]),
    );
    return { qui, blocs };
  }

  test("la révélation d'une question répondue après le retrait ne range Marine Tondelier sous aucune option, ni sous « Position inconnue »", async ({ page }) => {
    const { qui, blocs } = await revelationApresLeRetrait(page, true);
    expect(blocs.flatMap(([, noms]) => noms)).not.toContain("Marine Tondelier");
    await expect(qui.getByText("Marine Tondelier")).toHaveCount(0);
  });

  test("cette révélation range les 12 autres candidats comme avant : 12 noms au lieu de 13", async ({ page }) => {
    const avant = await revelationApresLeRetrait(page, false);
    expect(avant.blocs.flatMap(([, noms]) => noms)).toContain("Marine Tondelier");
    expect(avant.blocs.flatMap(([, noms]) => noms)).toHaveLength(13);
    const apres = await revelationApresLeRetrait(page, true);
    const sansElle = avant.blocs
      .map(([titre, noms]) => [titre, (noms as string[]).filter((n) => n !== "Marine Tondelier")])
      .filter(([titre, noms]) => noms.length > 0 || !String(titre).includes("Position inconnue"));
    expect(apres.blocs).toEqual(sansElle);
    expect(apres.blocs.flatMap(([, noms]) => noms)).toHaveLength(12);
  });
});

test.describe("un candidat remplacé prend le nom de son remplaçant", () => {
  /** Le remplacement de test : Jordan Bardella à la place de Marine Le Pen. */
  async function remplacement(page: Page, actif = true) {
    if (actif) await page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "remplacement", url: "http://localhost:3127" }]);
    else await page.context().clearCookies({ name: "aucrible-candidats-de-test" });
  }

  test("quand Bardella remplace Le Pen, la fiche « Marine Le Pen » est renommée à son nom, et il n'existe plus de fiche à l'ancien nom", async ({ page }) => {
    await remplacement(page);
    await page.goto("/candidat/bardella");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jordan Bardella");
    await expect(page.locator(".id-card .pawn")).toHaveText("JB");
    // La page part en flux avant de savoir que la fiche n'existe pas : le statut reste 200, la page dit « 404 ».
    await page.goto("/candidat/le-pen");
    await expect(page.getByRole("heading", { name: "Cette carte n'est pas dans le paquet." })).toBeVisible();
    await expect(page.locator(".id-card")).toHaveCount(0);
    await expect(page.getByText("Marine Le Pen")).toHaveCount(0);
  });

  test("le parti affiché sur la fiche reste « RN », et aucune mention de retrait n'y apparaît", async ({ page }) => {
    await remplacement(page);
    await page.goto("/candidat/bardella");
    await expect(page.locator(".id-card .party")).toHaveText("RN");
    await expect(page.getByRole("region", { name: "Ses positions" })).toBeVisible();
    await expect(page.locator(".gone")).toHaveCount(0);
    await expect(page.getByText(/s'est retiré/)).toHaveCount(0);
  });

  test("« Mes résultats » classe toujours 13 candidats, avec Bardella à la place de Marine Le Pen", async ({ page }) => {
    await vingtTroisReponses(page);
    await remplacement(page, false);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const avant = await lignesDuClassement(page);
    await remplacement(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const apres = await lignesDuClassement(page);
    expect(apres.map(([, nom]) => nom)).not.toContain("Marine Le Pen");
    expect(apres).toEqual(avant.map(([rang, nom, pourcentage]) => [rang, nom === "Marine Le Pen" ? "Jordan Bardella" : nom, pourcentage]));
  });
});

test.describe("après un remplacement, les positions héritées passent en « déduite »", () => {
  /** Pour chaque position connue de la fiche, son numéro, son option, son badge et sa source. */
  async function positionsDeLaFiche(page: Page, id: string) {
    await page.goto(`/candidat/${id}`);
    const positions = page.getByRole("region", { name: "Ses positions" });
    await expect(positions).toBeVisible();
    return positions.locator(".pos:not(.pos--unk)").evaluateAll((lignes) =>
      lignes.map((l) => ({
        numero: l.querySelector(".pos-n")!.textContent,
        option: l.querySelector(".pos-letter")!.textContent,
        badge: l.querySelector(".badge")!.textContent!.trim(),
        source: l.querySelector(".src")!.textContent,
      })),
    );
  }

  /** Le remplacement de test (Bardella pour Le Pen), et en plus, si demandé, la déclaration de test de Bardella sur la n° 9. */
  async function remplacement(page: Page, declaration = false) {
    const cookies = [{ name: "aucrible-candidats-de-test", value: "remplacement", url: "http://localhost:3127" }];
    if (declaration) cookies.push({ name: "aucrible-surcharges-de-test", value: "declaration-bardella", url: "http://localhost:3127" });
    await page.context().addCookies(cookies);
  }

  test("juste après le remplacement, chaque position connue de Bardella porte « position déduite », aucune « position officielle », chacune avec sa source d'origine", async ({ page }) => {
    const deLePen = await positionsDeLaFiche(page, "le-pen");
    expect(deLePen.some((p) => p.badge === "position officielle")).toBe(true);
    await remplacement(page);
    const deBardella = await positionsDeLaFiche(page, "bardella");
    expect(deBardella).toEqual(deLePen.map((p) => ({ ...p, badge: "position déduite" })));
  });

  test("une déclaration datée de Bardella ajoutée sur une question fait passer cette seule position en « position officielle », avec la déclaration pour source", async ({ page }) => {
    await remplacement(page);
    const avant = await positionsDeLaFiche(page, "bardella");
    await remplacement(page, true);
    const apres = await positionsDeLaFiche(page, "bardella");
    expect(apres.find((p) => p.numero === "Q9")).toEqual({
      numero: "Q9",
      option: "B",
      badge: "position officielle",
      source: "Source : Déclaration sur France 2, 05/01/2027",
    });
    expect(apres.filter((p) => p.numero !== "Q9")).toEqual(avant.filter((p) => p.numero !== "Q9"));
    expect(apres.filter((p) => p.numero !== "Q9").every((p) => p.badge === "position déduite")).toBe(true);
  });
});

test.describe("la page Méthode explique le poids de l'importance", () => {
  const regle2 = (page: Page) => page.getByRole("article", { name: "Tu choisis ce qui compte : ×1, ×2 ou ×3" });

  test("la règle n° 2 affiche les trois poids : ×1 « Un peu » (1 point max), ×2 « Beaucoup » (2 points max), ×3 « Essentiel » (3 points max)", async ({ page }) => {
    await page.goto("/methode");
    await expect(page.getByRole("article").nth(1)).toHaveAccessibleName("Tu choisis ce qui compte : ×1, ×2 ou ×3");
    await expect(regle2(page).getByText("Règle n° 2")).toBeVisible();
    const poids = regle2(page).getByRole("figure", { name: "Les trois poids et un exemple" }).locator(".imp-face");
    await expect(poids.locator("b")).toHaveText(["×1", "×2", "×3"]);
    await expect(poids.locator("b + span")).toHaveText(["Un peu", "Beaucoup", "Essentiel"]);
    await expect(poids.locator("small")).toHaveText(["1 point max", "2 points max", "3 points max"]);
  });

  test("l'exemple « 67 % × 3 = 2 points sur 3 » reprend celui de la règle n° 1, avec un sujet jugé essentiel", async ({ page }) => {
    await page.goto("/methode");
    const exemple = regle2(page).getByRole("figure", { name: "Les trois poids et un exemple" });
    await expect(exemple.locator(".eq")).toHaveText("67 % × 3 = 2 points sur 3");
    await expect(exemple.getByText("Même exemple que la règle 1, avec un sujet jugé essentiel.")).toBeVisible();
    await expect(exemple.locator(".imp-face.on b")).toHaveText("×3");
  });

  test("la règle dit que le poids est le choix de l'électeur et qu'il ne dépend jamais du candidat", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle2(page).getByText("Le poids, c'est ton choix à toi. Il ne dépend jamais du candidat.")).toBeVisible();
  });
});

test.describe("la page Méthode explique pourquoi une position inconnue ne compte pas", () => {
  const regle3 = (page: Page) => page.getByRole("article", { name: "Position inconnue : la question est sautée" });

  test("la règle n° 3 dit qu'une position sans source est « inconnue », exclue du calcul : aucun point gagné ni retiré, hors du maximum possible", async ({ page }) => {
    await page.goto("/methode");
    await expect(page.getByRole("article").nth(2)).toHaveAccessibleName("Position inconnue : la question est sautée");
    await expect(regle3(page).getByText("Règle n° 3")).toBeVisible();
    await expect(regle3(page).locator(".rule-txt p")).toHaveText([
      "Si on ne trouve aucune source pour la position d'un candidat sur une question, elle est notée « inconnue ».",
      "Pour ce candidat, la question est exclue du calcul : elle ne lui donne aucun point et ne lui en retire aucun. Elle ne compte pas non plus dans le maximum possible.",
      "On ne devine jamais. Une case vide vaut mieux qu'une case inventée.",
    ]);
  });

  test("l'exemple montre quatre cartes (Q. 21 80 %, Q. 22 55 %, Q. 23 inconnue en pointillés, Q. 24 67 %) et « Comptées : 3 questions sur 4 »", async ({ page }) => {
    await page.goto("/methode");
    const exemple = regle3(page).getByRole("figure", { name: "Quatre questions, dont une inconnue" });
    const cartes = exemple.getByRole("listitem");
    await expect(cartes).toHaveText(["Q. 2180 %", "Q. 2255 %", "Q. 23inconnue", "Q. 2467 %"]);
    await expect(cartes.nth(2)).toHaveClass("void");
    expect(await cartes.nth(2).evaluate((c) => getComputedStyle(c).borderStyle)).toBe("dashed");
    await expect(exemple.locator(".demo-cap b")).toHaveText("Comptées : 3 questions sur 4.");
  });

  test("la règle écrit « On ne devine jamais. Une case vide vaut mieux qu'une case inventée. »", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle3(page).getByText("On ne devine jamais. Une case vide vaut mieux qu'une case inventée.")).toBeVisible();
  });
});

test.describe("la page Méthode explique comment le plateau place les pions", () => {
  const regle5 = (page: Page) => page.getByRole("article", { name: "Le plateau : deux axes, des notes de −2 à +2" });

  test("la règle n° 5 dit que chaque option a une note de −2 à +2 sur l'un des deux axes, ou aucune, et nomme les axes Économie et Société", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle5(page).getByText("Règle n° 5")).toBeVisible();
    await expect(regle5(page).getByText("Chaque option reçoit une note de −2 à +2 sur l'un des deux axes, ou aucune note si elle n'a pas de rapport avec l'axe.")).toBeVisible();
    await expect(regle5(page).locator(".axes li")).toHaveText(["Économieplus de redistribution ↔ plus de marché", "Sociétéprogressiste ↔ conservateur"]);
  });

  test("l'exemple montre Retraite : 62 ans (−1, ×3), Droits de succession (+2, ×1), Fin de vie (aucune, ×2), et conclut « −0,25 » : la question sans note est ignorée", async ({ page }) => {
    await page.goto("/methode");
    const lignes = regle5(page).locator(".nrows li");
    await expect(lignes.locator(".nm")).toHaveText(["Retraite : 62 ans", "Droits de succession", "Fin de vie"]);
    await expect(lignes.locator("b")).toHaveText(["−1", "+2", "aucune"]);
    await expect(lignes.locator(".w")).toHaveText(["×3", "×1", "×2"]);
    await expect(lignes.nth(2)).toHaveClass("void");
    const egalite = regle5(page).locator(".eq");
    await expect(egalite).toHaveAccessibleName("moins 1 fois 3 plus 2 fois 1, divisé par 3 plus 1, égale moins 0,25");
    await expect(egalite.locator(".frac b")).toHaveText(["−1×3 + 2×1", "3 + 1"]);
    await expect(egalite.locator("mark")).toHaveText("−0,25");
    await expect(regle5(page).getByText("La question sans note est ignorée sur cet axe. Résultat : un peu côté redistribution.")).toBeVisible();
  });

  test("la règle dit que les candidats sont placés par la même formule, à partir de leurs positions sourcées, et que les notes passent le même contrôle de neutralité", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle5(page).getByText("Les candidats sont placés par la même formule, à partir de leurs positions sourcées.")).toBeVisible();
    await expect(regle5(page).getByText("Les notes sont relues par le même contrôle de neutralité que les questions.")).toBeVisible();
    await expect(regle5(page).getByRole("img", { name: "Carte à deux axes : un pion TOI, légèrement côté redistribution et progressiste" })).toBeVisible();
  });
});

test.describe("la page Méthode explique l'ordre des sources", () => {
  const regle6 = (page: Page) => page.getByRole("article", { name: "Chaque position a une source, classée par priorité" });

  test("la règle n° 6 liste, dans l'ordre, le programme 2027, une déclaration datée de moins de 12 mois, les votes du groupe, le programme 2022 du parti", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle6(page).getByText("Règle n° 6")).toBeVisible();
    const crans = regle6(page).locator(".ladder li");
    await expect(crans.locator(".t b")).toHaveText([
      "Le programme officiel 2027",
      "Une déclaration publique du candidat",
      "Les votes de son groupe",
      "Le programme 2022 de son parti",
      "Aucune source",
    ]);
    await expect(crans.locator(".n")).toHaveText(["1", "2", "3", "4", "?"]);
    await expect(crans.nth(1).locator("small")).toHaveText("Datée, de moins de 12 mois.");
    await expect(crans.nth(2).locator("small")).toHaveText("À l'Assemblée nationale ou au Parlement européen.");
  });

  test("un cinquième cran, « Aucune source », renvoie à la position « inconnue », sautée (règle 3)", async ({ page }) => {
    await page.goto("/methode");
    const dernier = regle6(page).locator(".ladder li").nth(4);
    await expect(dernier).toHaveClass("none");
    await expect(dernier.locator("small")).toHaveText("Position « inconnue », sautée (règle 3).");
  });

  test("la règle écrit « On ne devine jamais » et « on ne sollicite pas les équipes de campagne »", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle6(page).getByText("On ne devine jamais et on ne sollicite pas les équipes de campagne : seules les sources publiques comptent.")).toBeVisible();
  });
});

test.describe("la page Méthode explique les deux badges", () => {
  const regle6 = (page: Page) => page.getByRole("article", { name: "Chaque position a une source, classée par priorité" });

  test("dans l'échelle des sources, le programme 2027 et la déclaration portent « position officielle », les votes du groupe et le programme 2022 « position déduite »", async ({ page }) => {
    await page.goto("/methode");
    const crans = regle6(page).locator(".ladder li");
    await expect(crans.locator(".src-badge")).toHaveText(["position officielle", "position officielle", "position déduite", "position déduite", "pas de position"]);
    await expect(crans.locator(".src-badge")).toHaveClass(["src-badge off", "src-badge off", "src-badge ded", "src-badge ded", "src-badge nil"]);
  });

  test("le paragraphe dit ce qu'est une position officielle, une position déduite, et qu'on la recode dès qu'une déclaration arrive", async ({ page }) => {
    await page.goto("/methode");
    await expect(
      regle6(page).getByText(
        "Deux badges, deux niveaux de certitude. Une position officielle a été écrite ou dite par le candidat pour 2027. Une position déduite n'a pas été dite telle quelle : on la déduit des votes de son groupe ou du programme 2022, et on la recode dès qu'une déclaration arrive.",
      ),
    ).toBeVisible();
  });

  test("deux exemples : « position officielle » avec « Programme 2027 · Retraites · 12/09/2026 », « position déduite » avec « Vote du groupe à l'AN · réforme des retraites · 03/2023 »", async ({ page }) => {
    await page.goto("/methode");
    const exemples = regle6(page).getByRole("figure", { name: "Deux exemples de lignes de source" }).getByRole("listitem");
    await expect(exemples.locator(".src-badge")).toHaveText(["position officielle", "position déduite"]);
    await expect(exemples.locator(".s")).toHaveText(["Programme 2027 · Retraites · 12/09/2026", "Vote du groupe à l'AN · réforme des retraites · 03/2023"]);
  });
});

test.describe("la page Méthode explique la règle d'entrée des candidats", () => {
  const regle7 = (page: Page) => page.getByRole("article", { name: "Qui est dans la liste : 13 candidats" });

  test("la règle n° 7 écrit les trois critères, dont un seul suffit", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle7(page).getByText("Règle n° 7")).toBeVisible();
    await expect(regle7(page).getByText("La règle d'entrée est la même pour tous. Il suffit de remplir au moins un des trois critères :")).toBeVisible();
    await expect(regle7(page).locator(".crit li p")).toHaveText([
      "Son parti dirige un groupe à l'Assemblée nationale ou au Parlement européen.",
      "Il ou elle atteint 2,0 % en moyenne dans les enquêtes d'intentions de vote des 30 derniers jours.Pour chaque enquête, on fait la moyenne des scénarios où le candidat est testé.",
      "Son parti avait obtenu les 500 parrainages en 2022 (le parti lui-même, pas ses scissions).",
    ]);
  });

  test("la liste « au 23/10/2026 · 13 candidats » nomme les 13 avec leur parti, dans un ordre mélangé, avec le même pion pour tous", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle7(page).getByText("La liste au 23/10/2026 · 13 candidats")).toBeVisible();
    const liste = regle7(page).locator(".roster li");
    await expect(liste).toHaveCount(13);
    const lus = await liste.evaluateAll((lignes) => lignes.map((l) => [l.querySelector("b")!.textContent, l.querySelector("small")!.textContent]));
    const contenu = (parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string; parti: string }[]).map((c) => [c.nom, c.parti]);
    expect([...lus].sort()).toEqual([...contenu].sort());
    for (const [nom, parti] of [["Fabien Roussel", "PCF"], ["Édouard Philippe", "Horizons"], ["Raphaël Glucksmann", "Place publique / PS"]]) expect(lus).toContainEqual([nom, parti]);
    // Ni l'ordre du contenu, ni l'ordre alphabétique.
    expect(lus.map(([nom]) => nom)).not.toEqual(contenu.map(([nom]) => nom));
    expect(lus.map(([nom]) => nom)).not.toEqual(contenu.map(([nom]) => nom).sort((a, b) => a.localeCompare(b, "fr")));
    const pions = await liste.locator(".pawn").evaluateAll((p) => p.map((e) => [e.className, getComputedStyle(e).backgroundColor].join(" | ")));
    expect(new Set(pions).size).toBe(1);
  });

  test("la page dit que la liste est recalculée le 1er de chaque mois, qu'un candidat entré reste jusqu'à son retrait, et que Jean Lassalle entrerait s'il se déclarait", async ({ page }) => {
    await page.goto("/methode");
    const jalon = regle7(page).locator(".tl li").first();
    await expect(jalon.locator(".when")).toHaveText("Le 1er de chaque mois");
    await expect(jalon.locator(".what")).toHaveText("La liste est recalculée avec les trois critères. Un candidat entré reste jusqu'à son retrait.");
    await expect(regle7(page).getByText("Jean Lassalle entrerait automatiquement s'il se déclarait.", { exact: false })).toBeVisible();
  });
});

test.describe("la page Méthode explique les retraits et remplacements", () => {
  /** Le jalon de la frise de la règle n° 7 qui commence par `quand`. */
  const jalon = (page: Page, quand: string) =>
    page.getByRole("article", { name: "Qui est dans la liste : 13 candidats" }).locator(".tl li").filter({ has: page.locator(".when", { hasText: quand }) });

  test("une entrée « En cas de retrait » dit que le candidat sort du classement avec la mention « X s'est retiré·e le JJ/MM et soutient Y »", async ({ page }) => {
    await page.goto("/methode");
    await expect(jalon(page, "En cas de retrait").locator(".what")).toHaveText("Le candidat sort du classement, avec la mention « X s'est retiré·e le JJ/MM et soutient Y ».");
  });

  test("une entrée « En cas de remplacement dans le même parti » dit que la fiche est renommée et que les positions restent « déduites », puis sont recodées", async ({ page }) => {
    await page.goto("/methode");
    await expect(jalon(page, "En cas de remplacement dans le même parti").locator(".what")).toHaveText(
      "La fiche est renommée. Les positions du parti restent « déduites », puis sont recodées au fil des déclarations du nouveau candidat.",
    );
  });
});

test.describe("la page Méthode explique la bascule sur la liste officielle", () => {
  test("une entrée « Vers le 16 mars 2027 » dit que le Conseil constitutionnel publie la liste officielle, et que la liste de l'app bascule alors sur les candidats officiels", async ({ page }) => {
    await page.goto("/methode");
    const frise = page.getByRole("article", { name: "Qui est dans la liste : 13 candidats" }).locator(".tl li");
    await expect(frise.locator(".when")).toHaveText(["Le 1er de chaque mois", "Vers le 16 mars 2027", "En cas de retrait", "En cas de remplacement dans le même parti"]);
    await expect(frise.nth(1).locator(".what")).toHaveText(
      "Le Conseil constitutionnel publie la liste officielle. La nôtre bascule alors exactement sur les candidats officiels.",
    );
  });
});

test.describe("la page Méthode explique pourquoi ce n'est pas un sondage", () => {
  const regle8 = (page: Page) => page.getByRole("article", { name: "Ce que cet outil n'est pas, et comment le vérifier" });

  test("la règle n° 8 affiche le tampon « Ce n'est pas un sondage. »", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle8(page).getByText("Règle n° 8")).toBeVisible();
    await expect(regle8(page).locator(".stamp")).toHaveText("Ce n'est pas un sondage.");
  });

  test("elle dit que les utilisateurs ne sont pas représentatifs, qu'on ne collecte pas les réponses, et qu'aucune statistique sur eux n'est calculée ni publiée", async ({ page }) => {
    await page.goto("/methode");
    await expect(
      regle8(page).getByText(
        "Les utilisateurs ne sont pas représentatifs, et on ne collecte pas tes réponses. Aucune statistique sur les utilisateurs n'est calculée ni publiée.",
      ),
    ).toBeVisible();
  });

  test("elle dit que le pourcentage n'est pas une prévision de vote, seulement la rencontre des réponses et des positions, sur les questions répondues", async ({ page }) => {
    await page.goto("/methode");
    await expect(
      regle8(page).getByText(
        "Ton pourcentage n'est pas une prévision de vote. Il dit seulement à quel point tes réponses rejoignent ce que défend chaque candidat, sur les questions auxquelles tu as répondu.",
      ),
    ).toBeVisible();
  });
});

test("sur « Mes résultats », toucher « Méthode de calcul » ouvre la page « Méthode de calcul et sources », sur son titre et sa première règle", async ({ page }) => {
  await page.goto("/resultats");
  await page.getByRole("contentinfo").getByRole("link", { name: "Méthode de calcul" }).click();
  await page.waitForURL(/\/methode$/);
  const titre = page.getByRole("heading", { level: 1 }).filter({ visible: true });
  expect((await titre.innerText()).replace(/\s+/g, " ")).toBe("Méthode de calcul et sources.");
  await expect(page.getByRole("article").first()).toHaveAccessibleName("Chaque question donne un score entre 0 et 100 %");
  await expect(page.getByRole("article").first()).toBeInViewport({ ratio: 0.01 });
});

test.describe("la page À propos dit qui fait l'app", () => {
  const qui = (page: Page) => page.getByRole("article", { name: "Qui fait Au crible 2027 ?" });

  test("la page À propos s'ouvre sur « À propos. », puis « Qui fait Au crible 2027 ? » : « Je m'appelle Antoine », un projet fait par une seule personne", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À propos.");
    await expect(page.getByRole("article").first()).toHaveAccessibleName("Qui fait Au crible 2027 ?");
    await expect(qui(page).getByText("Je m'appelle Antoine. Au crible 2027 est un projet perso, fait par une seule personne.")).toBeVisible();
  });

  test("la section dit « pas de but lucratif » et « pas de pub », et la carte de visite affiche Antoine, « auteur, affiché publiquement » et ses trois sceaux", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(qui(page).getByText("Il n'y a pas de but lucratif et pas de pub : le site ne gagne rien, ni avec tes clics, ni avec tes réponses.")).toBeVisible();
    const carte = qui(page).getByRole("figure", { name: "Carte de visite du projet" });
    await expect(carte.locator(".sign b")).toHaveText("Antoine");
    await expect(carte.locator(".sign small")).toHaveText("auteur, affiché publiquement");
    await expect(carte.locator(".seals li")).toHaveText(["Non lucratif", "Sans pub", "Sans compte"]);
  });

  test("« Aller à » propose cinq entrées numérotées ; « 1 Qui » amène à la section « Qui fait Au crible 2027 ? »", async ({ page }) => {
    await page.goto("/a-propos");
    const allerA = page.getByRole("navigation", { name: "Sur cette page" });
    await expect(allerA.getByText("Aller à")).toBeVisible();
    await expect(allerA.getByRole("link")).toHaveText(["1Qui", "2Neutralité", "3Vie privée", "4IA", "5Suite"]);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await allerA.getByRole("link", { name: /^1 ?Qui$/ }).click();
    await page.waitForURL(/#r1$/);
    await expect(qui(page).getByRole("heading", { level: 2 })).toBeInViewport();
  });
});

test.describe("la page À propos dit comment les fiches sont relues", () => {
  const neutre = (page: Page) => page.getByRole("article", { name: "Neutre ? Voilà ce qu'on fait vraiment" });

  test("le schéma « Avant chaque publication » montre quatre temps dans l'ordre, avec les trois points de vue du contrôle de neutralité", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("article").nth(1)).toHaveAccessibleName("Neutre ? Voilà ce qu'on fait vraiment");
    const schema = neutre(page).getByRole("figure", { name: "Le contrôle avant publication, en quatre temps" });
    await expect(schema.getByText("Avant chaque publication")).toBeVisible();
    const temps = schema.locator(".flow > li");
    await expect(temps.locator(".t > b")).toHaveText(["Un premier jet", "Relu par l'auteur", "Contrôle de neutralité par IA", "Après publication"]);
    await expect(temps.locator(".t > small")).toHaveText([
      "L'IA rédige à partir de sources officielles.",
      "Je vérifie chaque chiffre et chaque position de candidat.",
      "Trois points de vue relisent : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. Je tranche sur chaque remarque.",
      "Toute erreur signalée est corrigée publiquement, dans le journal des corrections.",
    ]);
    await expect(schema.getByRole("list", { name: "Les trois points de vue" }).getByRole("listitem")).toHaveText(["Droite", "Centre", "Gauche"]);
  });

  test("« Ce que je ne prétends pas » dit qu'il n'y a ni comité ni relecteur extérieur, et aucune phrase de la page n'annonce de relecture externe", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(
      neutre(page).getByText(
        "Ce que je ne prétends pas : il n'y a ni comité ni relecteur extérieur. Aujourd'hui, c'est relu par l'auteur, contrôlé par une IA, et toute erreur signalée est corrigée publiquement. Si ça change, ce sera écrit ici.",
      ),
    ).toBeVisible();
    const texte = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    expect(texte.match(/extérieur|externe|indépendant|comité/gi)).toEqual(["comité", "extérieur"]);
  });

  test("le texte énumère ce qui se vérifie : les sources, la méthode publique, l'ordre aléatoire, le meilleur argument de chaque option", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(
      neutre(page).getByText(
        "Je ne te demande pas de me croire. Je te demande de vérifier : chaque position de candidat a sa source, la méthode de calcul est publique, l'ordre des candidats est aléatoire, et chaque option est présentée avec l'argument que ses propres défenseurs signeraient.",
      ),
    ).toBeVisible();
    await expect(neutre(page).getByRole("link", { name: "méthode de calcul" })).toHaveAttribute("href", "/methode");
  });
});

test.describe("la page À propos dit qu'on ne sait pas pour qui tu votes", () => {
  const vote = (page: Page) => page.getByRole("article", { name: "On ne sait pas pour qui tu votes" });

  test("la section dit : ni e-mail, ni mot de passe, ni pseudo ; les réponses restent sur le téléphone et ne sont envoyées nulle part, « moi non plus »", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("article").nth(2)).toHaveAccessibleName("On ne sait pas pour qui tu votes");
    await expect(
      vote(page).getByText(
        "Il n'y a pas de compte : ni e-mail, ni mot de passe, ni pseudo. Tes réponses restent sur ton téléphone, dans ton navigateur. Elles ne sont envoyées nulle part, donc personne ne peut les lire, moi non plus.",
      ),
    ).toBeVisible();
  });

  test("elle cite le RGPD, article 9, et dit « Ce n'est pas un sondage »", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(
      vote(page).getByText(
        "Une opinion politique est une donnée sensible (RGPD, article 9) : le plus sûr est de ne pas la collecter. Ce n'est pas un sondage : voir la règle 8 de la méthode.",
      ),
    ).toBeVisible();
    await expect(vote(page).getByRole("link", { name: "règle 8 de la méthode" })).toHaveAttribute("href", "/methode#r8");
  });

  test("elle prévient que vider les données du navigateur fait disparaître la partie ; le schéma : le téléphone garde les réponses, un serveur n'en reçoit aucune", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(vote(page).getByText("Sans compte, c'est toi qui emportes ta partie. Si tu vides les données de ton navigateur, elle disparaît.")).toBeVisible();
    const schema = vote(page).getByRole("figure", { name: "Tes réponses restent sur ton téléphone et ne vont pas vers un serveur" });
    await expect(schema.locator(".node")).toHaveText(["Ton téléphonetes réponses restent ici", "Un serveurn'en reçoit aucune"]);
  });
});

test.describe("la page À propos dit ce que fait l'IA", () => {
  const ia = (page: Page) => page.getByRole("article", { name: "L'IA : ce qu'elle fait, ce qu'un humain vérifie" });

  test("la section dit que l'IA aide au premier jet et à relire, qu'elle « ne décide de rien » et qu'un humain vérifie chaque chiffre", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("article").nth(3)).toHaveAccessibleName("L'IA : ce qu'elle fait, ce qu'un humain vérifie");
    await expect(
      ia(page).getByText(
        "Oui, j'utilise l'IA, et je préfère le dire. Elle m'aide à écrire un premier jet et à relire. Elle ne décide de rien : un humain vérifie chaque chiffre avant publication.",
      ),
    ).toBeVisible();
  });

  test("les deux colonnes : « L'IA prépare » et « Un humain décide », avec leurs trois lignes", async ({ page }) => {
    await page.goto("/a-propos");
    const colonnes = ia(page).getByRole("figure", { name: "Qui fait quoi entre l'IA et l'auteur" }).locator(".who2 > div");
    await expect(colonnes.getByRole("heading", { level: 3 })).toHaveText(["L'IA prépare", "Un humain décide"]);
    await expect(colonnes.nth(0).getByRole("listitem")).toHaveText([
      "un premier jet, à partir de sources officielles",
      "le contrôle de neutralité, avec trois points de vue",
      "l'animation des vidéos",
    ]);
    await expect(colonnes.nth(1).getByRole("listitem")).toHaveText([
      "vérifier chaque chiffre",
      "vérifier chaque position de candidat",
      "trancher sur chaque remarque du contrôle",
    ]);
  });

  test("la section annonce les lignes rouges et affiche « Animation générée avec IA, contenu vérifié par un humain »", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(ia(page).getByText("Deux lignes rouges : jamais de visage ni de voix de personnes réelles générés par IA.")).toBeVisible();
    await expect(ia(page).getByText("Les chiffres affichés viennent de la fiche vérifiée, jamais d'une IA.", { exact: false })).toBeVisible();
    await expect(ia(page).locator(".ai-tag")).toHaveText("Animation générée avec IA, contenu vérifié par un humain");
  });
});

test.describe("la page À propos mène aux comptes @aucrible2027", () => {
  const comptes = (page: Page) =>
    page.getByRole("article", { name: "Aller plus loin, ou nous suivre" }).getByRole("figure", { name: "Les comptes @aucrible2027" });
  const PROFILS = [
    ["Instagram", "https://www.instagram.com/aucrible2027"],
    ["TikTok", "https://www.tiktok.com/@aucrible2027"],
    ["YouTube", "https://www.youtube.com/@aucrible2027"],
    ["Facebook", "https://www.facebook.com/aucrible2027"],
  ];

  test("l'encadré montre « @aucrible2027 » et quatre liens, Instagram, TikTok, YouTube, Facebook, chacun marqué « @aucrible2027 »", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("article").nth(4)).toHaveAccessibleName("Aller plus loin, ou nous suivre");
    await expect(comptes(page).getByText("Le même compte partout : @aucrible2027")).toBeVisible();
    const liens = comptes(page).getByRole("link");
    await expect(liens).toHaveText(PROFILS.map(([plateforme]) => `${plateforme} @aucrible2027`));
    await expect(liens.locator("span")).toHaveText(Array(4).fill("@aucrible2027"));
  });

  test("chaque lien ouvre le profil @aucrible2027 de sa plateforme dans un nouvel onglet, et l'onglet d'Au crible 2027 reste ouvert", async ({ page, context }) => {
    // Les plateformes ne sont pas appelées pour de vrai : leurs pages sont remplacées par une page vide.
    for (const hote of ["instagram.com", "tiktok.com", "youtube.com", "facebook.com"])
      await context.route(`https://www.${hote}/**`, (route) => route.fulfill({ contentType: "text/html", body: "<title>profil</title>" }));
    await page.goto("/a-propos");
    for (const [plateforme, adresse] of PROFILS) {
      const lien = comptes(page).getByRole("link", { name: new RegExp(`^${plateforme} `) });
      await expect(lien).toHaveAttribute("href", adresse);
      await expect(lien).toHaveAttribute("target", "_blank");
      const [onglet] = await Promise.all([context.waitForEvent("page"), lien.click()]);
      await onglet.waitForLoadState();
      expect(onglet.url()).toBe(adresse);
      await onglet.close();
      expect(page.url()).toMatch(/\/a-propos$/);
    }
  });
});

test.describe("« Signaler une erreur » ouvre le formulaire depuis la fiche", () => {
  /** La page « Signaler une erreur. » et son introduction sont ouvertes. */
  async function pageDeSignalement(page: Page) {
    await page.waitForURL(/\/signaler(\?question=\d+)?$/);
    const titre = page.getByRole("heading", { level: 1 }).filter({ visible: true });
    await expect(titre).toHaveText("Signaler une erreur.");
    await expect(
      page.getByText("Un chiffre faux, une position mal attribuée, une phrase qui penche ? Dis-le-nous : on vérifie et on corrige.").filter({ visible: true }),
    ).toBeVisible();
  }

  test("sur la question n° 24, « Signaler une erreur » en bas de la fiche ouvre la page « Signaler une erreur. » avec son introduction", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Question n° 24", { exact: false }).filter({ visible: true }).first()).toBeVisible();
    await page.locator("main footer").getByRole("link", { name: "Signaler une erreur" }).click();
    await pageDeSignalement(page);
  });

  test("après une réponse validée, la révélation propose encore « Signaler une erreur », qui ouvre la même page", async ({ page }) => {
    await repondre(page, "62 ans");
    await page.waitForURL(/\/revelation$/);
    const lien = page.locator("main footer").filter({ visible: true }).getByRole("link", { name: "Signaler une erreur" });
    await expect(lien).toBeVisible();
    await lien.click();
    await pageDeSignalement(page);
  });
});

test.describe("le formulaire sait de quelle fiche il vient", () => {
  /** Le bloc « Sur quelle fiche ? » du formulaire : thème, question, et mention. */
  async function surQuelleFiche(page: Page) {
    await page.waitForURL(/\/signaler\?question=\d+$/);
    const bloc = page.getByRole("group", { name: "Sur quelle fiche ?" });
    await expect(bloc).toBeVisible();
    return {
      theme: (await bloc.locator(".theme-chip").innerText()).trim(),
      question: (await bloc.locator(".qref-t").innerText()).replace(/\s+/g, " ").trim(),
      mention: (await page.locator(".sig-card .f-help").first().innerText()).trim(),
    };
  }

  test("depuis la question n° 24, « Sur quelle fiche ? » montre « Travail & retraites », la question n° 24 et « Rempli pour toi. »", async ({ page }) => {
    await page.goto("/");
    await page.locator("main footer").getByRole("link", { name: "Signaler une erreur" }).click();
    expect(await surQuelleFiche(page)).toEqual({
      theme: "Travail & retraites",
      question: "Question n° 24 — À quel âge devrait-on pouvoir partir à la retraite ?",
      mention: "Rempli pour toi.",
    });
  });

  test("depuis une autre question ouverte par le rattrapage, le formulaire montre cette question, avec son thème et son numéro", async ({ page }) => {
    await page.goto("/rattrapage");
    await page.getByRole("link", { name: /Faut-il encadrer les loyers/ }).click();
    await page.waitForURL(/\/question\/23$/);
    await page.locator("main footer").filter({ visible: true }).getByRole("link", { name: "Signaler une erreur" }).click();
    expect(await surQuelleFiche(page)).toEqual({
      theme: "Logement",
      question: "Question n° 23 — Faut-il encadrer les loyers dans les grandes villes ?",
      mention: "Rempli pour toi.",
    });
  });

  test("le lien de la révélation remplit aussi la fiche, et une adresse tapée à la main ne montre pas une question pas encore publiée", async ({ page }) => {
    await repondre(page, "62 ans");
    await page.waitForURL(/\/revelation$/);
    await page.locator("main footer").filter({ visible: true }).getByRole("link", { name: "Signaler une erreur" }).click();
    expect((await surQuelleFiche(page)).question).toBe("Question n° 24 — À quel âge devrait-on pouvoir partir à la retraite ?");
    await page.goto("/signaler?question=25");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signaler une erreur.");
    await expect(page.getByRole("group", { name: "Sur quelle fiche ?" })).toHaveCount(0);
    expect(await page.content()).not.toContain("nucléaire");
  });
});

test.describe("l'électeur choisit le type d'erreur", () => {
  const types = (page: Page) => page.getByRole("group", { name: "C'est quel genre d'erreur ?" }).getByRole("radio");

  test("à l'ouverture, les quatre types sont là, et « Un chiffre » est déjà choisi", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await expect(types(page)).toHaveCount(4);
    for (const [nom, choisi] of [["Un chiffre", true], ["La position d'un candidat", false], ["Une formulation qui penche", false], ["Autre", false]] as const)
      await expect(page.getByRole("radio", { name: nom })).toBeChecked({ checked: choisi });
  });

  test("un seul type à la fois : « La position d'un candidat » décoche « Un chiffre », puis « Autre » décoche « La position d'un candidat »", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await page.getByText("La position d'un candidat", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "La position d'un candidat" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Un chiffre" })).not.toBeChecked();
    await page.getByText("Autre", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "Autre" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "La position d'un candidat" })).not.toBeChecked();
    expect(await types(page).evaluateAll((r) => r.filter((e) => (e as HTMLInputElement).checked).length)).toBe(1);
  });
});

/** La base Postgres des tests (playwright.config.ts), où le serveur des tests écrit les signalements. */
const baseDeTest = postgres(process.env.DATABASE_URL!, { max: 2, onnotice: () => {} });

/** Le signalement dont le texte contient `marque`, tel qu'il est arrivé dans la base, ou rien. */
async function signalementArrive(marque: string) {
  const lignes = await baseDeTest`SELECT question, type, texte, source, email FROM signalements WHERE texte LIKE ${"%" + marque + "%"}`;
  return lignes;
}

test.describe("l'électeur envoie un signalement", () => {
  test("sur la n° 24, écrire seulement le texte, lien et e-mail laissés vides, puis « Envoyer » envoie le signalement", async ({ page }) => {
    const marque = `daté ${Date.now()}-${Math.random()}`;
    await page.goto("/signaler?question=24");
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(`Le chiffre de 1,7 cotisant pour 1 retraité me semble ${marque}`);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    await expect.poll(() => signalementArrive(marque)).toEqual([
      { question: 24, type: "chiffre", texte: `Le chiffre de 1,7 cotisant pour 1 retraité me semble ${marque}`, source: null, email: null },
    ]);
  });

  test("envoyer ne demande ni compte, ni mot de passe, ni connexion : aucun écran ne s'intercale", async ({ page }) => {
    const marque = `écran ${Date.now()}-${Math.random()}`;
    const pages: string[] = [];
    page.on("framenavigated", (cadre) => cadre === page.mainFrame() && pages.push(new URL(cadre.url()).pathname + new URL(cadre.url()).search));
    await page.goto("/signaler?question=24");
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(`Une phrase qui penche, ${marque}`);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    expect([...new Set(pages)]).toEqual(["/signaler?question=24"]);
    await expect(page.locator("input[type=password], input[autocomplete=username]")).toHaveCount(0);
    await expect.poll(async () => (await signalementArrive(marque)).length).toBe(1);
  });
});

/**
 * Connecte ce navigateur à l'espace de l'auteur avec ce compte GitHub, comme le ferait le retour de GitHub : une session
 * chiffrée avec le secret des tests (playwright.config.ts). Seul le compte n° 44063631 (Zewed) est celui de l'auteur.
 */
async function connecterAvecGitHub(page: Page, compte = { id: 44063631, login: "Zewed" }) {
  const session = await sealData({ github: compte }, { password: process.env.AUTH_SECRET! });
  await page.context().addCookies([{ name: "aucrible-auteur", value: session, url: "http://localhost:3127", httpOnly: true, secure: true, sameSite: "Lax" }]);
}

/** Envoie un signalement « Un chiffre » sur la n° 24 depuis le formulaire, avec ce texte. */
async function signaler(page: Page, texte: string) {
  await page.goto("/signaler?question=24");
  await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(texte);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
}

test.describe("le signalement arrive dans une boîte privée", () => {
  const boite = (page: Page) => page.getByRole("region", { name: "Signalements" });

  test("après l'envoi depuis la n° 24 avec « Un chiffre », l'auteur le retrouve dans sa boîte, avec la question, le type et le texte", async ({ page }) => {
    const texte = `Le chiffre de 1,7 cotisant pour 1 retraité me semble daté ${Date.now()}-${Math.random()}`;
    await signaler(page, texte);
    await connecterAvecGitHub(page);
    await page.goto("/admin");
    const signalement = boite(page).getByRole("article").filter({ hasText: texte });
    await expect(signalement).toHaveCount(1);
    await expect(signalement.locator(".sg-q")).toHaveText("Question n° 24");
    await expect(signalement.locator(".sg-type")).toHaveText("Un chiffre");
    await expect(signalement.locator(".sg-texte")).toHaveText(texte);
  });

  test("ce signalement n'apparaît ni dans le journal des corrections, ni sur la fiche, ni sur aucune page publique", async ({ page }) => {
    const texte = `Une phrase qui penche, introuvable ailleurs ${Date.now()}-${Math.random()}`;
    await signaler(page, texte);
    for (const adresse of ["/journal", "/question/24", "/question/24/revelation", "/", "/resultats", "/rattrapage", "/methode", "/a-propos", "/signaler?question=24", "/candidat/tondelier"]) {
      await page.goto(adresse);
      await page.waitForLoadState("networkidle");
      expect(await page.content(), adresse).not.toContain(texte);
    }
  });

  test("sans connexion, /admin ne montre aucun signalement, seulement « Se connecter avec GitHub », qui part vers GitHub", async ({ page }) => {
    const texte = `Pas pour les visiteurs ${Date.now()}-${Math.random()}`;
    await signaler(page, texte);
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Se connecter avec GitHub" })).toBeVisible();
    await expect(boite(page)).toHaveCount(0);
    expect(await page.content()).not.toContain(texte);
    const depart = await page.request.get("/admin/connexion", { maxRedirects: 0 });
    expect(depart.status()).toBe(307);
    const versGitHub = new URL(depart.headers()["location"]);
    expect(versGitHub.origin + versGitHub.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(versGitHub.searchParams.get("client_id")).toBe("app-oauth-de-test");
    expect(versGitHub.searchParams.get("redirect_uri")).toBe("http://localhost:3127/admin/retour");
    expect(versGitHub.searchParams.get("state")).toMatch(/^[\w-]{20,}$/);
  });

  test("connecté avec un autre compte GitHub que celui de l'auteur, /admin refuse : « Ce compte GitHub n'a pas accès. »", async ({ page }) => {
    const texte = `Pas pour un autre compte ${Date.now()}-${Math.random()}`;
    await signaler(page, texte);
    await connecterAvecGitHub(page, { id: 1, login: "quelquun" });
    await page.goto("/admin");
    await expect(page.getByText("Ce compte GitHub n'a pas accès.")).toBeVisible();
    await expect(boite(page)).toHaveCount(0);
    expect(await page.content()).not.toContain(texte);
  });

  test("un retour de GitHub dont le « state » n'est pas celui du départ est refusé, sans ouvrir de session", async ({ page }) => {
    const retour = await page.request.get("/admin/retour?code=nimporte&state=pas-le-bon", { maxRedirects: 0 });
    expect(retour.status()).toBe(307);
    expect(new URL(retour.headers()["location"]).pathname).toBe("/admin");
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Se connecter avec GitHub" })).toBeVisible();
    await expect(boite(page)).toHaveCount(0);
  });
});

test.describe("l'électeur joint une source à son signalement", () => {
  const champ = (page: Page) => page.getByRole("textbox", { name: /^Ta source \(lien\)/ });

  test("le champ « Ta source (lien) » porte « facultatif », propose « https:// », et l'envoi marche sans lui", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await expect(page.locator("label[for=lien]")).toHaveText("Ta source (lien) facultatif");
    await expect(page.locator("label[for=lien] .opt-tag")).toHaveText("facultatif");
    await expect(champ(page)).toHaveAttribute("placeholder", "https://");
    await expect(champ(page)).toHaveValue("");
    const marque = `sans source ${Date.now()}-${Math.random()}`;
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(marque);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    await expect.poll(async () => (await signalementArrive(marque)).map((s) => s.source)).toEqual([null]);
  });

  test("« bonjour » dans le champ n'est pas un lien : le navigateur refuse l'envoi, et rien ne part", async ({ page }) => {
    const marque = `source bonjour ${Date.now()}-${Math.random()}`;
    await page.goto("/signaler?question=24");
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(marque);
    await champ(page).fill("bonjour");
    await page.getByRole("button", { name: "Envoyer" }).click();
    expect(await champ(page).evaluate((e) => (e as HTMLInputElement).validity.typeMismatch)).toBe(true);
    await page.waitForTimeout(500);
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(await signalementArrive(marque)).toEqual([]);
  });

  test("avec le lien du rapport du COR 2025, le signalement part avec ce lien, que l'auteur retrouve à côté du texte", async ({ page }) => {
    const lien = "https://www.cor-retraites.fr/rapport-annuel-2025";
    const texte = `Le chiffre de 1,7 me semble daté ${Date.now()}-${Math.random()}`;
    await page.goto("/signaler?question=24");
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(texte);
    await champ(page).fill(lien);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    await connecterAvecGitHub(page);
    await page.goto("/admin");
    const signalement = page.getByRole("region", { name: "Signalements" }).getByRole("article").filter({ hasText: texte });
    await expect(signalement.locator(".sg-source")).toHaveText(`Source : ${lien}`);
    await expect(signalement.getByRole("link", { name: lien })).toHaveAttribute("href", lien);
  });
});

test.describe("l'électeur laisse un e-mail pour avoir une réponse", () => {
  const champ = (page: Page) => page.getByRole("textbox", { name: /^Ton e-mail/ });

  test("« Ton e-mail » porte « facultatif » et, dessous, « Pour qu'on te réponde. Il ne sert qu'à ça. » ; sans e-mail, l'envoi marche", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await expect(page.locator("label[for=mel]")).toHaveText("Ton e-mail facultatif");
    await expect(champ(page)).toHaveAttribute("type", "email");
    await expect(champ(page)).toHaveAttribute("placeholder", "toi@exemple.fr");
    await expect(page.locator("#mel + .f-help")).toHaveText("Pour qu'on te réponde. Il ne sert qu'à ça.");
    const marque = `sans e-mail ${Date.now()}-${Math.random()}`;
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(marque);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    await expect.poll(async () => (await signalementArrive(marque)).map((s) => s.email)).toEqual([null]);
  });

  test("avec « marie@exemple.fr », l'auteur retrouve l'adresse à côté du signalement ; elle n'apparaît nulle part en public", async ({ page }) => {
    const texte = `Une formulation qui penche ${Date.now()}-${Math.random()}`;
    await page.goto("/signaler?question=24");
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(texte);
    await champ(page).fill("marie@exemple.fr");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    for (const adresse of ["/journal", "/question/24", "/question/24/revelation", "/", "/resultats"]) {
      await page.goto(adresse);
      await page.waitForLoadState("networkidle");
      expect(await page.content(), adresse).not.toContain("marie@exemple.fr");
    }
    await connecterAvecGitHub(page);
    await page.goto("/admin");
    const signalement = page.getByRole("region", { name: "Signalements" }).getByRole("article").filter({ hasText: texte });
    await expect(signalement.locator(".sg-email")).toHaveText("Répondre à : marie@exemple.fr");
    await expect(signalement.getByRole("link", { name: "marie@exemple.fr" })).toHaveAttribute("href", "mailto:marie@exemple.fr");
  });

  test("l'adresse ne sert qu'à répondre : plus de trois mois après l'envoi, elle est effacée, le signalement reste ; à deux mois, elle est encore là", async ({ page }) => {
    const texte = `Ancien signalement ${Date.now()}-${Math.random()}`;
    const recent = `Signalement récent ${Date.now()}-${Math.random()}`;
    // La boîte ouverte une première fois : l'app a créé ses tables. Puis deux signalements avec e-mail, d'il y a quatre
    // mois et d'il y a deux mois.
    await connecterAvecGitHub(page);
    await page.goto("/admin");
    await expect(page.getByRole("region", { name: "Signalements" })).toBeVisible();
    await baseDeTest`INSERT INTO signalements (recu_le, question, type, texte, email) VALUES (now() - interval '4 months', 24, 'chiffre', ${texte}, 'ancien@exemple.fr')`;
    await baseDeTest`INSERT INTO signalements (recu_le, question, type, texte, email) VALUES (now() - interval '2 months', 24, 'chiffre', ${recent}, 'recent@exemple.fr')`;
    await page.reload();
    await expect(page.getByRole("region", { name: "Signalements" })).toBeVisible();
    expect(await signalementArrive(texte)).toEqual([{ question: 24, type: "chiffre", texte, source: null, email: null }]);
    expect((await signalementArrive(recent)).map((s) => s.email)).toEqual(["recent@exemple.fr"]);
    expect(await page.content()).not.toContain("ancien@exemple.fr");
  });
});

test.describe("après l'envoi, le formulaire remercie", () => {
  test("après un envoi réussi : « Merci ! Ton signalement est arrivé. » et « Si tu as laissé ton e-mail, on te répond sous 72 h. », à la place du formulaire", async ({ page }) => {
    await signaler(page, `Merci ${Date.now()}-${Math.random()}`);
    const merci = page.getByRole("status");
    await expect(merci.locator(".state-t")).toHaveText("Merci ! Ton signalement est arrivé.");
    await expect(merci.locator(".state-s")).toHaveText("Si tu as laissé ton e-mail, on te répond sous 72 h.");
    await expect(page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Envoyer" })).toHaveCount(0);
  });

  test("« Retour aux questions » ramène à la question du jour : la n° 24 le vendredi 23 octobre", async ({ page }) => {
    await signaler(page, `Retour ${Date.now()}-${Math.random()}`);
    await page.getByRole("status").getByRole("link", { name: "Retour aux questions" }).click();
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
  });
});

test.describe("un signalement vide ne part pas", () => {
  const texte = (page: Page) => page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" });

  test("« Envoyer » sans rien écrire n'envoie rien : le formulaire reste ouvert, sans « Merci ! », et dit pourquoi", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Écris ce qui ne va pas avant d'envoyer." })).toBeVisible();
    await expect(texte(page)).toBeVisible();
    await expect(page.getByText("Merci ! Ton signalement est arrivé.")).toHaveCount(0);
  });

  test("même avec un lien et un e-mail, un texte fait seulement d'espaces ne part pas, et le lien et l'e-mail restent", async ({ page }) => {
    const lien = `https://exemple.org/vide-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await page.goto("/signaler?question=24");
    await texte(page).fill("   \n  ");
    await page.getByRole("textbox", { name: /^Ta source \(lien\)/ }).fill(lien);
    await page.getByRole("textbox", { name: /^Ton e-mail/ }).fill("marie@exemple.fr");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Écris ce qui ne va pas avant d'envoyer." })).toBeVisible();
    await expect(page.getByText("Merci ! Ton signalement est arrivé.")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /^Ta source \(lien\)/ })).toHaveValue(lien);
    await expect(page.getByRole("textbox", { name: /^Ton e-mail/ })).toHaveValue("marie@exemple.fr");
    await page.waitForTimeout(500);
    expect(await baseDeTest`SELECT 1 FROM signalements WHERE source = ${lien}`.catch(() => [])).toHaveLength(0);
  });

  test("le serveur refuse aussi un texte vide, même si le formulaire était contourné", async ({ page }) => {
    const lien = `https://exemple.org/contourne-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await page.goto("/signaler?question=24");
    await texte(page).fill("Un vrai texte, d'abord");
    await page.getByRole("textbox", { name: /^Ta source \(lien\)/ }).fill(lien);
    // Le texte vidé juste avant l'envoi, sans passer par le formulaire : seul le serveur peut encore dire non.
    await texte(page).evaluate((zone) => zone.closest("form")!.addEventListener("formdata", (e) => (e as FormDataEvent).formData.set("quoi", "   "), { capture: true }));
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Merci ! Ton signalement est arrivé.")).toHaveCount(0);
    expect(await baseDeTest`SELECT 1 FROM signalements WHERE source = ${lien}`.catch(() => [])).toHaveLength(0);
  });
});

test.describe("un envoi raté garde le texte et propose de réessayer", () => {
  const echec = (page: Page) => page.getByRole("alert").filter({ hasText: "L'envoi n'a pas marché. Ton texte est gardé, réessaie." });

  /** Remplit tout le formulaire de la n° 24 : « Un chiffre », le texte, un lien, un e-mail. */
  async function toutRemplir(page: Page, texte: string, lien: string) {
    await page.goto("/signaler?question=24");
    await page.getByText("Un chiffre", { exact: true }).click();
    await page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" }).fill(texte);
    await page.getByRole("textbox", { name: /^Ta source \(lien\)/ }).fill(lien);
    await page.getByRole("textbox", { name: /^Ton e-mail/ }).fill("marie@exemple.fr");
  }

  async function toujoursRempli(page: Page, texte: string, lien: string) {
    await expect(page.getByRole("radio", { name: "Un chiffre" })).toBeChecked();
    await expect(page.getByRole("textbox", { name: "Qu'est-ce qui ne va pas ?" })).toHaveValue(texte);
    await expect(page.getByRole("textbox", { name: /^Ta source \(lien\)/ })).toHaveValue(lien);
    await expect(page.getByRole("textbox", { name: /^Ton e-mail/ })).toHaveValue("marie@exemple.fr");
  }

  test("réseau coupé, « Envoyer » affiche l'échec, et le type, le texte, le lien et l'e-mail sont toujours là", async ({ page, context }) => {
    const texte = `Hors réseau ${Date.now()}-${Math.random()}`;
    const lien = "https://www.cor-retraites.fr/rapport-annuel-2025";
    await toutRemplir(page, texte, lien);
    await context.setOffline(true);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(echec(page)).toBeVisible();
    await toujoursRempli(page, texte, lien);
    await expect(page.getByText("Merci ! Ton signalement est arrivé.")).toHaveCount(0);
    await context.setOffline(false);
  });

  test("réseau rétabli, « Réessayer » envoie le signalement, qui n'arrive qu'une fois", async ({ page, context }) => {
    const texte = `Réessayé ${Date.now()}-${Math.random()}`;
    await toutRemplir(page, texte, "https://exemple.org/source");
    await context.setOffline(true);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(echec(page)).toBeVisible();
    await context.setOffline(false);
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    expect(await signalementArrive(texte)).toHaveLength(1);
  });

  test("si le signalement est arrivé mais que la réponse s'est perdue, « Réessayer » ne le fait pas arriver deux fois", async ({ page }) => {
    const texte = `Réponse perdue ${Date.now()}-${Math.random()}`;
    await toutRemplir(page, texte, "https://exemple.org/perdue");
    // Le premier envoi atteint le serveur, qui garde le signalement ; seule sa réponse n'arrive jamais au navigateur.
    let premier = true;
    await page.route("**/signaler?question=24", async (route) => {
      if (route.request().method() !== "POST" || !premier) return route.fallback();
      premier = false;
      await route.fetch();
      await route.abort("connectionreset");
    });
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(echec(page)).toBeVisible();
    await expect.poll(async () => (await signalementArrive(texte)).length).toBe(1);
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(page.getByRole("status")).toContainText("Merci ! Ton signalement est arrivé.");
    expect(await signalementArrive(texte)).toHaveLength(1);
  });
});

test.describe("l'auteur voit le nombre de visites par jour", () => {
  /** Les visites d'un jour (AAAA-MM-JJ) dans la base des tests, 0 s'il n'y en a pas. */
  const visitesDu = async (jour: string) => {
    const [ligne] = await baseDeTest`SELECT nombre FROM visites WHERE jour = ${jour}`.catch(() => []);
    return ligne ? Number(ligne.nombre) : 0;
  };

  /** Ouvre l'app ce jour-là sur un appareil neuf (un contexte de navigateur à lui), puis le referme. */
  async function ouvrirLAppSurUnAppareil(browser: import("@playwright/test").Browser, jour: string, fois = 1) {
    const appareil = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const page = await appareil.newPage();
    await fixerLeJour(page, `${jour}T10:00:00+01:00`);
    for (let i = 0; i < fois; i++) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    }
    await appareil.close();
  }

  test("ouvrir l'app aujourd'hui depuis deux appareils fait 2 visites de plus, et rouvrir le même appareil n'en ajoute pas", async ({ browser, page }) => {
    const jour = "2026-12-08";
    const avant = await visitesDu(jour);
    await ouvrirLAppSurUnAppareil(browser, jour, 3);
    await ouvrirLAppSurUnAppareil(browser, jour);
    await expect.poll(() => visitesDu(jour)).toBe(avant + 2);
    await connecterAvecGitHub(page);
    await fixerLeJour(page, `${jour}T18:00:00+01:00`);
    await page.goto("/admin");
    await expect(page.getByRole("region", { name: "Visites" }).getByRole("row", { name: /8 déc\. 2026/ })).toHaveText(new RegExp(`8 déc\\. 2026\\s*${avant + 2}`));
  });

  test("chaque jour a sa ligne : une visite le lendemain s'ajoute au lendemain, sans changer la veille", async ({ browser }) => {
    const veille = "2026-12-15";
    const lendemain = "2026-12-16";
    await ouvrirLAppSurUnAppareil(browser, veille);
    await expect.poll(() => visitesDu(veille)).toBeGreaterThan(0);
    const [avantVeille, avantLendemain] = [await visitesDu(veille), await visitesDu(lendemain)];
    await ouvrirLAppSurUnAppareil(browser, lendemain);
    await expect.poll(() => visitesDu(lendemain)).toBe(avantLendemain + 1);
    expect(await visitesDu(veille)).toBe(avantVeille);
  });

  test("le même appareil, revenu le lendemain, compte une visite ce jour-là", async ({ browser }) => {
    const appareil = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const page = await appareil.newPage();
    const [premier, second] = ["2026-12-22", "2026-12-23"];
    const avant = await visitesDu(second);
    await fixerLeJour(page, `${premier}T10:00:00+01:00`);
    await page.goto("/");
    await expect.poll(() => visitesDu(premier)).toBeGreaterThan(0);
    await fixerLeJour(page, `${second}T10:00:00+01:00`);
    await page.goto("/");
    await expect.poll(() => visitesDu(second)).toBe(avant + 1);
    await appareil.close();
  });
});

test.describe("le formulaire promet une réponse sous 72 h", () => {
  for (const [nom, taille] of [["sur téléphone", null], ["sur ordinateur", { width: 1280, height: 900 }]] as const) {
    test(`${nom}, juste au-dessus de « Envoyer » : « On répond sous 72 h. » puis « Chaque correction est publiée dans le journal des corrections. »`, async ({ page }) => {
      if (taille) await page.setViewportSize(taille);
      await page.goto("/signaler?question=24");
      const promesse = page.locator(".sig-card .promise");
      await expect(promesse).toHaveText("On répond sous 72 h. Chaque correction est publiée dans le journal des corrections.");
      await expect(promesse.locator("b")).toHaveText("On répond sous 72 h.");
      // Juste au-dessus du bouton : rien ne s'intercale entre la promesse et « Envoyer », et le bouton suit de près.
      // Les deux sont mesurés d'un seul coup, dans la page, pendant que la fiche arrive en flux.
      await expect
        .poll(() =>
          promesse.evaluate((p) => {
            const bouton = p.nextElementSibling;
            if (bouton?.textContent?.trim() !== "Envoyer") return "autre chose sous la promesse";
            const ecart = bouton.getBoundingClientRect().top - p.getBoundingClientRect().bottom;
            return ecart >= 0 && ecart < 40 ? "juste au-dessus" : `écart de ${ecart} px`;
          }),
        )
        .toBe("juste au-dessus");
    });
  }

  test("« journal des corrections » mène au journal des corrections", async ({ page }) => {
    await page.goto("/signaler?question=24");
    await page.locator(".sig-card .promise").getByRole("link", { name: "journal des corrections" }).click();
    await page.waitForURL(/\/journal$/);
  });
});

test.describe("la fiche candidat propose aussi « Signaler une erreur »", () => {
  const lienDeLaFiche = (page: Page) =>
    page.locator(".report").filter({ hasText: "Une erreur, un chiffre ou une source à revoir ?" }).getByRole("link", { name: "Signaler une erreur sur cette fiche" });

  test("sur la fiche de Marine Tondelier, sous « Une erreur, un chiffre ou une source à revoir ? », le lien « Signaler une erreur sur cette fiche » est là", async ({ page }) => {
    await page.goto("/candidat/tondelier");
    await expect(page.locator(".report p")).toHaveText("Une erreur, un chiffre ou une source à revoir ?");
    await expect(lienDeLaFiche(page)).toBeVisible();
    const [question, lien] = await Promise.all([page.locator(".report p").boundingBox(), lienDeLaFiche(page).boundingBox()]);
    expect(lien!.y).toBeGreaterThanOrEqual(question!.y + question!.height - 1);
  });

  test("le même lien est sur la fiche de Nathalie Arthaud, et il ouvre la page « Signaler une erreur. »", async ({ page }) => {
    await page.goto("/candidat/arthaud");
    await lienDeLaFiche(page).click();
    await page.waitForURL(/\/signaler$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Signaler une erreur.");
  });
});

test.describe("le journal liste les corrections, les plus récentes d'abord", () => {
  /** Le journal, avec les sept corrections (inventées) de maquettes/journal.html. */
  async function journalDeLaMaquette(page: Page) {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    return page.getByRole("region", { name: "Les corrections" });
  }

  test("avec les sept corrections de la maquette, le journal les liste de la plus récente à la plus ancienne", async ({ page }) => {
    const corrections = await journalDeLaMaquette(page);
    // Le titre passe à la ligne avant « corrections » (un <br>, comme la maquette).
    expect((await page.getByRole("heading", { level: 1 }).innerText()).replace(/\s+/g, " ")).toBe("Journal des corrections.");
    await expect(corrections.getByText("la plus récente d'abord")).toBeVisible();
    const dates = corrections.locator(".log .entry time.date");
    await expect(dates).toHaveCount(7);
    await expect(dates.locator("b")).toHaveText(["22", "20", "19", "17", "16", "12", "09"]);
    await expect(dates.locator("span")).toHaveText(Array(7).fill("oct. 2026"));
    expect(await dates.evaluateAll((d) => d.map((t) => t.getAttribute("datetime")))).toEqual([
      "2026-10-22",
      "2026-10-20",
      "2026-10-19",
      "2026-10-17",
      "2026-10-16",
      "2026-10-12",
      "2026-10-09",
    ]);
  });

  test("l'introduction dit que les signalements arrivent dans une boîte privée, que seule la correction est publique, et la réponse sous 72 h", async ({ page }) => {
    await journalDeLaMaquette(page);
    await expect(
      page.getByText(
        "Quand une erreur est repérée, elle est corrigée en public : la date, la fiche concernée, ce qui a changé, pourquoi, et qui l'a repérée. Rien n'est modifié en douce.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Les signalements arrivent dans une boîte privée, seule la correction est publique. Réponse sous 72 h.")).toBeVisible();
  });
});

test.describe("chaque correction dit quelle fiche elle touche", () => {
  /** La correction du jour donné, dans le journal aux corrections de test. */
  async function correctionDu(page: Page, jour: string) {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    const entree = page.locator(".log .entry").filter({ has: page.locator(`time[datetime="${jour}"]`) });
    await expect(entree).toHaveCount(1);
    return entree;
  }

  test("la correction du 19 oct. 2026 affiche « Formulation », « Question n° 3 » et « Que faire du parc nucléaire ? »", async ({ page }) => {
    const entree = await correctionDu(page, "2026-10-19");
    await expect(entree.locator(".entry-k .type")).toHaveText("Formulation");
    await expect(entree.locator(".entry-k")).toHaveText("FormulationQuestion n° 3");
    await expect(entree.getByRole("heading", { level: 2 })).toHaveText("Que faire du parc nucléaire ?");
    await expect(entree.getByRole("article")).toHaveAccessibleName("Que faire du parc nucléaire ?");
  });

  test("la correction du 22 oct. 2026 affiche « Position », « Fiche candidat », « Gabriel Attal » et « Question n° 12 · Droits de succession »", async ({ page }) => {
    const entree = await correctionDu(page, "2026-10-22");
    await expect(entree.locator(".entry-k")).toHaveText("PositionFiche candidat");
    await expect(entree.getByRole("heading", { level: 2 })).toHaveText("GAGabriel Attal");
    await expect(entree.locator(".entry-sub")).toHaveText("Question n° 12 · Droits de succession");
    await expect(entree.getByRole("heading", { level: 2 }).getByRole("link")).toHaveAttribute("href", "/candidat/attal");
  });
});

test.describe("chaque correction montre l'avant et l'après", () => {
  /** L'avant et l'après de la correction du jour donné : leur valeur, leur précision et ce qui est surligné. */
  async function avantApres(page: Page, jour: string) {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    const entree = page.locator(".log .entry").filter({ has: page.locator(`time[datetime="${jour}"]`) });
    await expect(entree.locator(".diff")).toBeVisible();
    return entree.locator(".diff > div").evaluateAll((cotes) =>
      cotes.map((c) => ({
        titre: c.querySelector(".diff-k")!.textContent,
        valeur: c.querySelector(".val")!.textContent!.replace(/\s+/g, " "),
        precision: c.querySelector(".srcv")?.textContent?.replace(/\s+/g, " "),
        surligne: [...c.querySelectorAll("mark")].map((m) => m.textContent!.replace(/\s+/g, " ")),
      })),
    );
  }

  test("la correction de chiffre du 16 oct. 2026 montre 0,4 % avant, 0,3 % après, seuls ces deux nombres surlignés", async ({ page }) => {
    expect(await avantApres(page, "2026-10-16")).toEqual([
      { titre: "Avant", valeur: "Déficit du système de retraites en 2030 : 0,4 % du PIB", precision: undefined, surligne: ["0,4 %"] },
      { titre: "Après", valeur: "Déficit du système de retraites en 2030 : 0,3 % du PIB", precision: undefined, surligne: ["0,3 %"] },
    ]);
  });

  test("la correction de position du 22 oct. 2026 (Gabriel Attal) montre l'option et la source avant, puis après", async ({ page }) => {
    const [avant, apres] = await avantApres(page, "2026-10-22");
    expect([avant.valeur, avant.precision]).toEqual(["Option B : Garder le barème actuel", "Position déduite · programme 2022 du parti"]);
    expect([apres.valeur, apres.precision]).toEqual(["Option C : Alléger pour les petits patrimoines", "Position officielle · déclaration du 02/10/2026"]);
  });

  test("la correction du 20 oct. 2026 (Nathalie Arthaud) montre en « Après » « Position inconnue » et « Exclue du calcul, faute de source »", async ({ page }) => {
    const [, apres] = await avantApres(page, "2026-10-20");
    expect(apres).toMatchObject({ titre: "Après", valeur: "Position inconnue", precision: "Exclue du calcul, faute de source" });
  });
});

test.describe("chaque correction dit sa raison", () => {
  /** Le « Pourquoi » de chaque correction du journal, par jour. */
  async function raisons(page: Page) {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    await expect(page.locator(".log .entry")).toHaveCount(7);
    const lignes: [string, string | undefined][] = await page.locator(".log .entry").evaluateAll((entrees) =>
      entrees.map((e) => {
        const ligne = [...e.querySelectorAll(".why > div")].find((d) => d.querySelector("dt")?.textContent === "Pourquoi");
        return [e.querySelector("time")!.getAttribute("datetime")!, ligne?.querySelector("dd")?.textContent?.replace(/\s+/g, " ")];
      }),
    );
    return Object.fromEntries(lignes);
  }

  test("la correction du 12 oct. 2026 a pour « Pourquoi » « Chiffre corrigé : erreur de recopie, source relue »", async ({ page }) => {
    expect((await raisons(page))["2026-10-12"]).toBe("Chiffre corrigé : erreur de recopie, source relue");
  });

  test("chacune des sept corrections a un « Pourquoi » qui n'est pas vide", async ({ page }) => {
    const parJour = await raisons(page);
    expect(Object.keys(parJour)).toHaveLength(7);
    for (const [jour, raison] of Object.entries(parJour)) expect(raison?.trim(), jour).toBeTruthy();
    expect(parJour["2026-10-09"]).toBe("Lien de source rompu : remplacé par la version en ligne");
  });
});

test.describe("chaque correction dit qui l'a repérée", () => {
  /** L'« Origine » de la correction du jour donné. */
  async function origine(page: Page, jour: string) {
    const ligne = page
      .locator(".log .entry")
      .filter({ has: page.locator(`time[datetime="${jour}"]`) })
      .locator(".why > div")
      .filter({ has: page.locator("dt", { hasText: "Origine" }) });
    return (await ligne.locator("dd").innerText()).trim();
  }

  test("le 22 oct. 2026 : « Signalé par un utilisateur » ; le 20 oct. 2026 : « Repéré par le contrôle de neutralité »", async ({ page }) => {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    expect(await origine(page, "2026-10-22")).toBe("Signalé par un utilisateur");
    expect(await origine(page, "2026-10-20")).toBe("Repéré par le contrôle de neutralité");
  });

  test("une correction née d'un signalement laissé avec l'e-mail marie@exemple.fr dit seulement « Signalé par un utilisateur », sans rien de la personne", async ({ page }) => {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    expect(await origine(page, "2026-10-22")).toBe("Signalé par un utilisateur");
    const html = await page.content();
    for (const morceau of ["marie", "exemple.fr", "@exemple"]) expect(html.includes(morceau), morceau).toBe(false);
    const reponse = await page.request.get("/journal");
    expect((await reponse.text()).includes("marie")).toBe(false);
  });
});

test.describe("l'électeur filtre le journal par type", () => {
  const visibles = (page: Page) => page.locator(".log .entry").filter({ visible: true });
  const filtre = (page: Page, nom: string) => page.getByRole("radiogroup", { name: "Filtrer par type de correction" }).getByRole("radio", { name: new RegExp(`^${nom} \\d+$`) });
  async function journal(page: Page) {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "maquette", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    await expect(page.locator(".log .entry")).toHaveCount(7);
  }

  test("avec les sept corrections de la maquette, « Toutes » est choisi au départ et la liste en montre 7", async ({ page }) => {
    await journal(page);
    await expect(filtre(page, "Toutes")).toBeChecked();
    await expect(visibles(page)).toHaveCount(7);
  });

  test("« Position de candidat » en laisse 2 (Attal et Arthaud), « Source » une (le 09 oct. 2026), « Toutes » les remet à 7", async ({ page }) => {
    await journal(page);
    await page.locator("label", { hasText: /^Position de candidat/ }).click();
    await expect(visibles(page)).toHaveCount(2);
    await expect(visibles(page).getByRole("heading", { level: 2 })).toHaveText(["GAGabriel Attal", "NANathalie Arthaud"]);
    await page.locator("label", { hasText: /^Source/ }).click();
    await expect(visibles(page)).toHaveCount(1);
    await expect(visibles(page).locator("time")).toHaveAttribute("datetime", "2026-10-09");
    await page.locator("label", { hasText: /^Toutes/ }).click();
    await expect(visibles(page)).toHaveCount(7);
  });

  test("le nombre écrit à côté de chaque filtre est celui des corrections qu'il affiche", async ({ page }) => {
    await journal(page);
    const etiquettes = page.locator(".jfilter > label");
    await expect(etiquettes).toHaveText(["Toutes 7", "Chiffre 2", "Position de candidat 2", "Formulation 2", "Source 1"]);
    for (const texte of await etiquettes.allInnerTexts()) {
      const [, nom, nombre] = texte.replace(/\s+/g, " ").trim().match(/^(.*) (\d+)$/)!;
      await page.locator(".jfilter > label", { hasText: new RegExp(`^${nom} `) }).click();
      await expect(visibles(page), nom).toHaveCount(Number(nombre));
    }
  });
});

test.describe("sans correction, le journal invite à signaler", () => {
  test("tant qu'aucune correction n'est publiée, le journal affiche « Aucune correction pour l'instant. » et « Tu as repéré une erreur ? » à la place de la liste", async ({ page }) => {
    await page.goto("/journal");
    const corrections = page.getByRole("region", { name: "Les corrections" });
    await expect(corrections.getByRole("heading", { name: "Aucune correction pour l'instant." })).toBeVisible();
    await expect(corrections.getByText("Tu as repéré une erreur ?")).toBeVisible();
    await expect(corrections.locator(".log")).toHaveCount(0);
  });

  test("le lien « Signale-la » ouvre la page « Signaler une erreur. »", async ({ page }) => {
    await page.goto("/journal");
    await page.getByRole("link", { name: "Signale-la" }).click();
    await page.waitForURL(/\/signaler$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Signaler une erreur.");
  });

  test("dès qu'une première correction est publiée, le message disparaît et la correction s'affiche", async ({ page }) => {
    await page.context().addCookies([{ name: "aucrible-corrections-de-test", value: "une", url: "http://localhost:3127" }]);
    await page.goto("/journal");
    await expect(page.locator(".log .entry")).toHaveCount(1);
    await expect(page.locator(".log .entry time")).toHaveAttribute("datetime", "2026-10-09");
    await expect(page.getByText("Aucune correction pour l'instant.")).toHaveCount(0);
  });
});

test.describe("l'en-tête mène aux deux écrans principaux", () => {
  const menu = (page: Page) => page.getByRole("banner").getByRole("navigation", { name: "Navigation" });

  test.describe("sur ordinateur", () => {
    test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

    test("le menu est une colonne de quatre icônes à gauche, sans texte, qui mène à chaque écran et met en avant la page où l'on est", async ({ page }) => {
      await page.goto("/");
      const liens = menu(page).getByRole("link");
      expect(await liens.evaluateAll((l) => l.map((a) => a.getAttribute("aria-label")))).toEqual(["Répondre", "Mes résultats", "Toutes les questions", "Méthode"]);
      await expect(liens).toHaveText(["", "", "", ""]);
      for (const lien of await liens.all()) {
        const boite = (await lien.boundingBox())!;
        expect(boite.x + boite.width).toBeLessThan(90);
      }
      await expect(menu(page).getByRole("link", { name: "Répondre" })).toHaveAttribute("aria-current", "page");
      await menu(page).getByRole("link", { name: "Mes résultats" }).click();
      await page.waitForURL(/\/resultats$/);
      await expect(menu(page).getByRole("link", { name: "Mes résultats" })).toHaveAttribute("aria-current", "page");
      await expect(menu(page).getByRole("link", { name: "Répondre" })).not.toHaveAttribute("aria-current");
      await menu(page).getByRole("link", { name: "Répondre" }).click();
      await page.waitForURL(/\/$/);
      await expect(page.getByRole("heading", { level: 1, name: "À quel âge devrait-on pouvoir partir à la retraite ?" }).filter({ visible: true })).toBeVisible();
    });
  });

  for (const [largeur, appareil] of [
    [1280, "sur ordinateur"],
    [390, "au téléphone"],
  ] as const) {
    test.describe(appareil, () => {
      test.use({ viewport: { width: largeur, height: 860 } });

      test(`${appareil}, sur À propos, le Journal et une page introuvable, le logo « Au crible 2027 » ramène à la question du jour`, async ({ page }) => {
        for (const adresse of ["/a-propos", "/journal", "/une-page-qui-n-existe-pas"]) {
          await page.goto(adresse);
          await page.getByRole("banner").getByRole("link", { name: "Au crible 2027" }).click();
          await page.waitForURL(/\/$/);
          await voirLesPropositions(page);
          await expect(page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true })).toBeVisible();
        }
      });
    });
  }
});

test.describe("une adresse inconnue affiche « Cette carte n'est pas dans le paquet »", () => {
  test("une adresse qui n'existe pas affiche le titre, l'étiquette « Carte introuvable » et « Erreur 404 » dans le bandeau", async ({ page }) => {
    await page.goto("/zzz");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cette carte n'est pas dans le paquet.");
    await expect(page.locator(".qcard .theme-chip")).toHaveText("Carte introuvable");
    await expect(page.locator(".strip .qnum")).toHaveText("Erreur 404");
    await expect(page.getByRole("img", { name: "Erreur 404" })).toBeVisible();
  });

  test("sous « Que s'est-il passé ? », la page dit que l'adresse n'existe pas ou que la page a changé de place", async ({ page }) => {
    await page.goto("/zzz");
    await expect(page.getByRole("heading", { level: 2, name: "Que s'est-il passé ?" })).toBeVisible();
    await expect(
      page.getByText("L'adresse que tu as ouverte n'existe pas, ou la page a changé de place. Le reste du paquet, lui, est au complet."),
    ).toBeVisible();
  });
});

test.describe("l'en-tête reste en haut au défilement", () => {
  /** L'élément au point donné appartient-il à l'en-tête ? Si oui, rien de ce qui défile n'est passé par-dessus. */
  const devantAuPoint = (page: Page, x: number, y: number) => page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("header.topbar"), [x, y]);

  test("sur la n° 24, défiler jusqu'à « Valider ma réponse » laisse le logo en haut, et le texte passe dessous", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await voirLesPropositions(page);
    await page.getByRole("button", { name: "Valider ma réponse" }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    const logo = page.getByRole("banner").getByRole("link", { name: "Au crible 2027" });
    await expect(logo).toBeInViewport();
    const boite = (await logo.boundingBox())!;
    expect(boite.y).toBeLessThan(80);
    expect(await devantAuPoint(page, boite.x + boite.width / 2, boite.y + boite.height / 2)).toBe(true);
    const fond = await page.getByRole("banner").evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(fond).not.toMatch(/rgba\\(.*,\\s*0(\\.\\d+)?\\)$|transparent/);
  });

  test("sur À propos, « 5 Suite » descend à la section 5 sans que son titre passe sous l'en-tête, qui reste visible", async ({ page }) => {
    // Un écran bas : la section 5, la dernière, peut alors monter jusqu'en haut, là où l'en-tête la cacherait.
    await page.setViewportSize({ width: 390, height: 500 });
    await page.goto("/a-propos");
    await page.getByRole("navigation", { name: "Sur cette page" }).getByRole("link", { name: /^5 ?Suite$/ }).click();
    await page.waitForURL(/#r5$/);
    const titre = page.getByRole("heading", { level: 2, name: "Aller plus loin, ou nous suivre" });
    await expect(titre).toBeInViewport();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const [entete, boite] = await Promise.all([page.getByRole("banner").boundingBox(), titre.boundingBox()]);
    expect(entete!.y).toBe(0);
    expect(boite!.y).toBeGreaterThanOrEqual(entete!.y + entete!.height);
  });
});

test.describe("la page introuvable ramène aux questions", () => {
  test("sur la page introuvable, « Revenir aux questions » ouvre la prochaine question, la n° 24, sans phrase de plus", async ({ page }) => {
    await page.goto("/zzz");
    await expect(page.locator(".lost .go-note")).toHaveCount(0);
    await page.getByRole("link", { name: "Revenir aux questions" }).click();
    await page.waitForURL(/\/$/);
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24");
  });
});

test.describe("sans réseau, l'app dit qu'il faut une connexion", () => {
  test("réseau coupé, toucher « Question suivante » affiche un message qui dit qu'il faut une connexion, au lieu d'une page vide ou d'une erreur", async ({ page, context }) => {
    await vingtTroisReponses(page);
    await page.goto("/question/23/revelation");
    const lien = page.getByRole("link", { name: "Question suivante" });
    await expect(lien).toBeVisible();
    await context.setOffline(true);
    await lien.click();
    const message = page.getByRole("alert").filter({ hasText: /connexion/ });
    await expect(message).toBeVisible();
    await expect(message).toHaveText(/Pas de connexion/);
    expect(page.url()).toMatch(/\/question\/23\/revelation$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true }).first()).toBeVisible();
    await context.setOffline(false);
  });

  test("réseau rétabli, la même page s'ouvre normalement, et les 23 réponses sont toujours là dans « Mes résultats »", async ({ page, context }) => {
    await vingtTroisReponses(page);
    await page.goto("/question/23/revelation");
    await context.setOffline(true);
    await page.getByRole("link", { name: "Question suivante" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /connexion/ })).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByRole("alert").filter({ hasText: /connexion/ })).toHaveCount(0);
    await page.getByRole("link", { name: "Question suivante" }).click();
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
  });
});

test.describe("une fiche ajoutée par l'auteur paraît à sa date", () => {
  /**
   * Un jeu de fiches à ce test seul (e2e/fiches/<nom>/, choisi par le cookie du jeu de test), vide au départ : les tests
   * qui tournent en même temps ne voient pas les fiches qu'il ajoute. `ajouter` y écrit une fiche complète, datée,
   * comme l'auteur l'ajouterait au contenu.
   */
  async function jeuVide(page: Page, nom: string) {
    const dossier = `e2e/fiches/${nom}`;
    mkdirSync(dossier, { recursive: true });
    await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: nom, url: "http://localhost:3127" }]);
    const ajouter = (numero: number, date: string, question: string) =>
      writeFileSync(
        `${dossier}/${numero}.yaml`,
        readFileSync("content/questions/023-loyers.yaml", "utf8")
          .replace(/^numero: 23$/m, `numero: ${numero}`)
          .replace(/^date: 2026-10-22$/m, `date: ${date}`)
          .replace(/^question: .*$/m, `question: ${question}`),
      );
    return { ajouter, effacer: () => rmSync(dossier, { recursive: true, force: true }) };
  }
  const questionDuJour = (page: Page) => page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true });

  test("après avoir ajouté une fiche datée d'aujourd'hui, elle est la question du jour dès que j'ouvre l'app", async ({ page }) => {
    const jeu = await jeuVide(page, "ajout-aujourd-hui");
    try {
      jeu.ajouter(901, "2026-10-23", "Une fiche ajoutée pour aujourd'hui ?");
      await page.goto("/");
      await voirLesPropositions(page);
      await expect(page.getByRole("heading", { name: "Une fiche ajoutée pour aujourd'hui ?" }).filter({ visible: true })).toBeVisible();
      await expect(questionDuJour(page)).toBeVisible();
    } finally {
      jeu.effacer();
    }
  });

  test("une fiche datée de demain n'est pas la question du jour aujourd'hui, et elle l'est demain", async ({ page }) => {
    const jeu = await jeuVide(page, "ajout-demain");
    try {
      jeu.ajouter(901, "2026-10-23", "La fiche d'aujourd'hui ?");
      jeu.ajouter(902, "2026-10-24", "La fiche de demain ?");
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "La fiche d'aujourd'hui ?" }).filter({ visible: true })).toBeVisible();
      await expect(page.getByText("La fiche de demain ?")).toHaveCount(0);
      await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "La fiche de demain ?" }).filter({ visible: true })).toBeVisible();
    } finally {
      jeu.effacer();
    }
  });

  test("ajoutées dans le désordre (après-demain d'abord, puis demain), chaque fiche paraît à sa date", async ({ page }) => {
    const jeu = await jeuVide(page, "ajout-desordre");
    try {
      jeu.ajouter(903, "2026-10-25", "La fiche d'après-demain ?");
      jeu.ajouter(902, "2026-10-24", "La fiche de demain ?");
      await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "La fiche de demain ?" }).filter({ visible: true })).toBeVisible();
      await fixerLeJour(page, "2026-10-25T09:00:00+02:00");
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "La fiche d'après-demain ?" }).filter({ visible: true })).toBeVisible();
    } finally {
      jeu.effacer();
    }
  });
});

test.describe("l'auteur génère le carrousel du jour depuis la fiche", () => {
  const images = (page: Page) => page.getByRole("region", { name: "Le carrousel" }).locator("article.slide");

  test("le carrousel de la fiche du jour (n° 24) : 6 images 4:5, numérotées de 1/6 à 6/6, chacune sous la marque « Au crible 2027 »", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(page.getByText("question n° 24", { exact: false }).first()).toBeVisible();
    await expect(images(page)).toHaveCount(6);
    await expect(images(page).locator(".s-page")).toHaveText(["1/6", "2/6", "3/6", "4/6", "5/6", "6/6"]);
    await expect(images(page).locator(".s-brand")).toHaveText(Array(6).fill("Au crible 2027"));
    for (const boite of await images(page).evaluateAll((s) => s.map((e) => e.getBoundingClientRect()).map(({ width, height }) => ({ width, height }))))
      expect(boite.width / boite.height).toBeCloseTo(4 / 5, 3);
    // Dessinées à 320 px de large, elles s'exportent à 1080 px : 1080 × 1350.
    expect(await images(page).first().evaluate((e) => e.getBoundingClientRect().width)).toBe(320);
  });

  test("je corrige dans la fiche « 1,7 » en « 1,6 » et je régénère : l'image 3 affiche 1,6, sans rien retaper", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(images(page).nth(2).locator(".s-fig-num").first()).toHaveText("1,7");
    // La même fiche n° 24, corrigée, dans un jeu de fiches à ce test seul.
    const dossier = "e2e/fiches/carrousel-corrige";
    mkdirSync(dossier, { recursive: true });
    try {
      writeFileSync(`${dossier}/024.yaml`, readFileSync("content/questions/024-retraite.yaml", "utf8").replace('valeur: "1,7"', 'valeur: "1,6"'));
      await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "carrousel-corrige", url: "http://localhost:3127" }]);
      await page.goto("/carrousel");
      await expect(images(page).nth(2).locator(".s-fig-num").first()).toHaveText("1,6");
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
});

test.describe("la 1re image montre la question", () => {
  const image = (page: Page) => page.getByRole("region", { name: "Le carrousel" }).getByRole("article", { name: "Image 1 sur 6 : la question" });

  test("l'image 1/6 de la fiche n° 24 montre la pastille « Travail & retraites » et la question", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(image(page).locator(".theme-chip")).toHaveText("Travail & retraites");
    await expect(image(page).getByRole("heading", { level: 3 })).toHaveText("À quel âge devrait-on pouvoir partir à la retraite ?");
  });

  test("elle montre aussi « Question n° 24 » et « J-177 », les jours avant le 1er tour au jour de la fiche", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(image(page).locator(".s-face-body")).toHaveText("Question n° 24 ·J-177");
    await expect(image(page).locator(".s-pill")).toHaveText("J-177");
  });
});

/** Le carrousel de la fiche n° 24 telle que la dessine maquettes/carrousel.html (jeu de fiches de test « carrousel »). */
async function carrouselDeLaMaquette(page: Page) {
  await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "carrousel", url: "http://localhost:3127" }]);
  await page.goto("/carrousel");
  const images = page.getByRole("region", { name: "Le carrousel" }).locator("article.slide");
  await expect(images).toHaveCount(6);
  return images;
}

/**
 * Les éléments donnés de l'image tiennent-ils en entier dans l'image, au-dessus de sa signature, sans texte rogné ? Une
 * signature poussée hors de l'image compte aussi comme une coupure.
 */
const tiennentEnEntier = (image: Locator, selecteur: string) =>
  image.evaluate((visuel, selecteur) => {
    const cadre = visuel.getBoundingClientRect().bottom;
    const signature = visuel.querySelector(".s-foot")!.getBoundingClientRect();
    const bas = Math.min(signature.top, cadre);
    return [...visuel.querySelectorAll(selecteur)].map((e) => {
      const r = e.getBoundingClientRect();
      return signature.bottom <= cadre + 0.5 && r.bottom <= bas + 0.5 && e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1;
    });
  }, selecteur);

test.describe("la 2e image montre le contexte", () => {
  test("l'image 2/6 de la fiche n° 24 s'intitule « Le contexte » et reprend les trois phrases de la fiche", async ({ page }) => {
    const image = (await carrouselDeLaMaquette(page)).nth(1);
    await expect(image.getByRole("heading", { level: 3 })).toHaveText("Le contexte");
    await expect(image.locator(".s-ctx li")).toHaveText([
      "Les cotisations des actifs paient les pensions d'aujourd'hui.",
      "Depuis 2023, l'âge légal remonte de 62 vers 64 ans.",
      "Cette hausse est suspendue depuis fin 2025, alors que l'on vit plus longtemps.",
    ]);
  });

  test("l'image montre ces trois phrases en entier, ni plus, ni moins : aucune n'est coupée", async ({ page }) => {
    const image = (await carrouselDeLaMaquette(page)).nth(1);
    await expect(image.locator(".s-ctx li")).toHaveCount(3);
    expect(await tiennentEnEntier(image, ".s-ctx li")).toEqual([true, true, true]);
  });
});

test.describe("la 3e image montre les chiffres sourcés", () => {
  const chiffres = (image: Locator) =>
    image.locator(".s-fig").evaluateAll((lignes) =>
      lignes.map((l) => [".s-fig-num", ".s-fig-txt", ".s-fig-src"].map((c) => l.querySelector(c)!.textContent!.replace(/\s+/g, " ").trim())),
    );

  test("l'image 3/6 de la fiche n° 24 montre 1,7 ; ~14 % ; 62 ans, chacun avec sa phrase, sa source et sa date", async ({ page }) => {
    const image = (await carrouselDeLaMaquette(page)).nth(2);
    await expect(image.getByRole("heading", { level: 3 })).toHaveText("3 chiffres clés");
    expect(await chiffres(image)).toEqual([
      ["1,7", "cotisant pour 1 retraité", "Source : COR · 2025"],
      ["~14 %", "du PIB consacré aux retraites", "Source : COR · 2025"],
      ["62 ans", "et 10 mois : l'âge moyen de départ", "Source : DREES · 2025"],
    ]);
  });

  test("pour une fiche à 2 chiffres, l'image s'intitule « 2 chiffres clés » et en montre deux", async ({ page }) => {
    // La même fiche, sans son 3e chiffre, dans un jeu de fiches à ce test seul.
    const dossier = "e2e/fiches/carrousel-deux-chiffres";
    mkdirSync(dossier, { recursive: true });
    try {
      const fiche = readFileSync("e2e/fiches/carrousel/024.yaml", "utf8");
      writeFileSync(`${dossier}/024.yaml`, fiche.replace(/  - valeur: "62"\n(    .*\n){3}/, ""));
      await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "carrousel-deux-chiffres", url: "http://localhost:3127" }]);
      await page.goto("/carrousel");
      const image = page.getByRole("region", { name: "Le carrousel" }).locator("article.slide").nth(2);
      await expect(image.getByRole("heading", { level: 3 })).toHaveText("2 chiffres clés");
      await expect(image).toHaveAccessibleName("Image 3 sur 6 : 2 chiffres clés");
      expect((await chiffres(image)).map(([nombre]) => nombre)).toEqual(["1,7", "~14 %"]);
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
});

test.describe("la 4e image montre les options, sans noms", () => {
  test("l'image 4/6 de la fiche n° 24 montre les cinq cartes A à E avec leurs libellés", async ({ page }) => {
    const image = (await carrouselDeLaMaquette(page)).nth(3);
    await expect(image.getByRole("heading", { level: 3 })).toHaveText("Les 5 options");
    await expect(image.locator(".s-opt i")).toHaveText(["A", "B", "C", "D", "E"]);
    await expect(image.locator(".s-opt b")).toHaveText(["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte"]);
  });

  test("l'image ne contient aucun nom de candidat ni de parti, et dit « Les noms viennent après ta réponse. »", async ({ page }) => {
    const image = (await carrouselDeLaMaquette(page)).nth(3);
    await expect(image.locator(".s-sub")).toHaveText("Les noms viennent après ta réponse.");
    expect(nomsOuPartisDans((await image.textContent())!)).toEqual([]);
  });

  test("pour une fiche à 3 options, l'image s'intitule « Les 3 options » et montre 3 cartes", async ({ page }) => {
    const dossier = "e2e/fiches/carrousel-trois-options";
    mkdirSync(dossier, { recursive: true });
    try {
      // La même fiche, réduite à ses options A, B et C, dans un jeu de fiches à ce test seul.
      const fiche = readFileSync("e2e/fiches/carrousel/024.yaml", "utf8");
      writeFileSync(`${dossier}/024.yaml`, fiche.replace(/  - id: D\n[\s\S]*?(?=positions:)/, ""));
      await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "carrousel-trois-options", url: "http://localhost:3127" }]);
      await page.goto("/carrousel");
      const image = page.getByRole("region", { name: "Le carrousel" }).locator("article.slide").nth(3);
      await expect(image.getByRole("heading", { level: 3 })).toHaveText("Les 3 options");
      await expect(image.locator(".s-opt")).toHaveCount(3);
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
});

test.describe("la 5e image montre le meilleur argument de chaque côté", () => {
  const image = (page: Page) => page.getByRole("region", { name: "Le carrousel" }).getByRole("article", { name: "Image 5 sur 6 : le meilleur argument des deux côtés" });

  test("l'image 5/6 de la fiche n° 24 montre un bloc « Pour relever l'âge » et un bloc « Pour ne pas le relever », avec les deux phrases de la fiche", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(image(page).getByRole("heading", { level: 3 })).toHaveText("Le meilleur argument des deux côtés");
    await expect(image(page).getByRole("heading", { level: 4 })).toHaveText(["Pour relever l'âge", "Pour ne pas le relever"]);
    await expect(image(page).locator(".s-arg p")).toHaveText([
      "On vit plus longtemps : travailler un peu plus protège le niveau des pensions.",
      "Les métiers pénibles et les carrières hachées en paient le prix.",
    ]);
    expect(await tiennentEnEntier(image(page), ".s-arg")).toEqual([true, true]);
  });

  test("les deux blocs ont le même format : même taille, même typographie, aucun n'est mis en avant", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(image(page).locator(".s-arg")).toHaveCount(2);
    const blocs = await image(page)
      .locator(".s-arg")
      .evaluateAll((sections) =>
        sections.map((bloc) => {
          const { width, height } = bloc.getBoundingClientRect();
          const style = (e: Element) => {
            const s = getComputedStyle(e);
            return [s.fontFamily, s.fontSize, s.fontWeight, s.color, s.backgroundColor].join(" ");
          };
          return { width, height, fond: style(bloc), titre: style(bloc.querySelector("h4")!), texte: style(bloc.querySelector("p")!), classe: bloc.className };
        }),
      );
    expect(blocs).toHaveLength(2);
    expect(blocs[1]).toEqual(blocs[0]);
  });

  for (const jour of ["2026-10-22", "2026-10-24", "2026-10-25"]) {
    test(`le ${jour}, les deux côtés de la fiche du jour tiennent en entier dans l'image, au même format`, async ({ page }) => {
      await fixerLeJour(page, `${jour}T09:00:00+02:00`);
      await page.goto("/carrousel");
      await expect(image(page).locator(".s-arg")).toHaveCount(2);
      expect(await tiennentEnEntier(image(page), ".s-arg, .s-arg p")).toEqual([true, true, true, true]);
      const [haut, bas] = await image(page).locator(".s-arg").evaluateAll((blocs) => blocs.map((e) => e.getBoundingClientRect().height));
      expect(haut).toBe(bas);
    });
  }

  test("aucun des deux arguments n'est ironique ni méprisant, et aucun ne commence par « en réalité… »", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(image(page).locator(".s-arg p")).toHaveCount(2);
    const phrases = await image(page).locator(".s-arg p").allInnerTexts();
    for (const phrase of phrases) {
      expect(phrase).not.toMatch(/^en réalité/i);
      expect(phrase).not.toMatch(/soi-disant|prétendu|naïf|absurde|ridicule|\?!|!/i);
    }
  });
});

test.describe("l'auteur génère la story « Et toi ? » à deux choix", () => {
  const story = (page: Page) => page.getByRole("region", { name: "La story" }).getByRole("article", { name: "Story : la question avec un autocollant à deux choix" });

  test("la story de la fiche du jour est une image 9:16, dessinée à 320 px de large pour 1080 × 1920", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(story(page)).toBeVisible();
    const { width, height } = (await story(page).boundingBox())!;
    expect(width).toBe(320);
    expect(width / height).toBeCloseTo(9 / 16, 3);
  });

  test("elle montre la carte question n° 24, l'autocollant « Et toi ? » à deux choix, « 62 ans ou moins » et « 64 ans ou plus », et « Lien en bio »", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(story(page).locator(".s-face h3")).toHaveText("À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(story(page).locator(".s-face-body")).toHaveText("Question n° 24 ·J-177");
    const autocollant = story(page).getByRole("group", { name: "Autocollant à deux choix" });
    await expect(autocollant.locator(".sticker-q")).toHaveText("Et toi ?");
    await expect(autocollant.locator(".sticker-opts > span")).toHaveText(["62 ans ou moins", "64 ans ou plus"]);
    await expect(story(page).locator(".st-link")).toHaveText("Lien en bio");
    expect(await tiennentEnEntierDansLaStory(story(page))).toBe(true);
  });

  for (const jour of ["2026-10-22", "2026-10-24", "2026-10-25"]) {
    test(`le ${jour}, la story de la fiche du jour a ses deux choix et tient en entier dans ses 9:16`, async ({ page }) => {
      await fixerLeJour(page, `${jour}T09:00:00+02:00`);
      await page.goto("/carrousel");
      await expect(story(page).locator(".sticker-opts > span")).toHaveCount(2);
      expect(await tiennentEnEntierDansLaStory(story(page))).toBe(true);
    });
  }

  test("elle ne contient aucun nom de candidat", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(story(page).locator(".sticker-opts > span")).toHaveCount(2);
    const texte = await story(page).innerText();
    const candidats: { nom: string }[] = parse(readFileSync("content/candidats.yaml", "utf8"));
    for (const { nom } of candidats) {
      expect(texte).not.toContain(nom);
      expect(texte).not.toContain(nom.split(" ").at(-1)!);
    }
  });
});

/** Tout ce que la story montre tient-il dans ses 9:16, sans rien de rogné ? */
const tiennentEnEntierDansLaStory = (story: Locator) =>
  story.evaluate((visuel) => {
    const cadre = visuel.getBoundingClientRect();
    return [...visuel.querySelectorAll(".s-top, .s-face, .sticker, .st-link")].every((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= cadre.top - 0.5 && r.bottom <= cadre.bottom + 0.5 && e.scrollHeight <= e.clientHeight + 1;
    });
  });

test.describe("chaque image porte la signature @aucrible2027", () => {
  test("les 6 images du carrousel portent « @aucrible2027 » en pied, écrit à l'identique, avec « Glisse » sur les images 1 à 5", async ({ page }) => {
    await page.goto("/carrousel");
    const images = page.getByRole("region", { name: "Le carrousel" }).locator("article.slide");
    await expect(images).toHaveCount(6);
    await expect(images.locator(".s-foot > span:first-child")).toHaveText(Array(6).fill("@aucrible2027"), { useInnerText: true });
    await expect(images.locator(".s-foot .next")).toHaveText(Array(5).fill("Glisse"));
    await expect(images.nth(5).locator(".s-foot .next")).toHaveCount(0);
  });

  test("la story porte « @aucrible2027 » en haut à droite", async ({ page }) => {
    await page.goto("/carrousel");
    const story = page.getByRole("region", { name: "La story" }).getByRole("article", { name: "Story : la question avec un autocollant à deux choix" });
    const signature = story.locator(".s-top > :last-child");
    await expect(signature).toHaveText("@aucrible2027", { useInnerText: true });
    const [cadre, boite] = await Promise.all([story.boundingBox(), signature.boundingBox()]);
    expect(cadre!.x + cadre!.width - (boite!.x + boite!.width)).toBeLessThan(24);
    expect(boite!.y - cadre!.y).toBeLessThan(80);
  });
});

test.describe("l'auteur génère la vidéo verticale du jour depuis la fiche", () => {
  const storyboard = (page: Page) => page.getByRole("region", { name: "Le storyboard" }).locator(".vf");

  test("depuis le carrousel, « Voir la vidéo du jour » ouvre la page de la vidéo, et « Carrousel et story » ramène au carrousel", async ({ page }) => {
    await page.goto("/carrousel");
    const visuels = page.getByRole("navigation", { name: "Visuels du jour" });
    await expect(visuels.getByRole("link", { name: "Carrousel et story" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Voir la vidéo du jour" }).click();
    await page.waitForURL(/\/video$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vidéodu jour.");
    await expect(visuels.getByRole("link", { name: "Vidéo" })).toHaveAttribute("aria-current", "page");
    await visuels.getByRole("link", { name: "Carrousel et story" }).click();
    await page.waitForURL(/\/carrousel$/);
    await expect(page.getByRole("region", { name: "Le carrousel" })).toBeVisible();
  });

  test("la page de la vidéo montre le storyboard de la n° 24 : 7 images 9:16, de 0 à 75 s", async ({ page }) => {
    await page.goto("/video");
    await expect(page.getByText("question n° 24", { exact: false }).first()).toBeVisible();
    await expect(storyboard(page)).toHaveCount(7);
    await expect(page.getByRole("region", { name: "Le storyboard" }).locator("figcaption .cap b")).toHaveText(["0–3 s", "3–12 s", "12–30 s", "30–45 s", "45–60 s", "60–70 s", "70–75 s"]);
    for (const { width, height } of await storyboard(page).evaluateAll((s) => s.map((e) => e.getBoundingClientRect()).map(({ width, height }) => ({ width, height }))))
      expect(width / height).toBeCloseTo(9 / 16, 2);
    await expect(storyboard(page).nth(2).locator(".v-fig-num")).toHaveText(["1,7", "14 %", "62 ans"]);
  });

  for (const jour of ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]) {
    test(`le ${jour}, rien ne sort des 7 images de la vidéo`, async ({ page }) => {
      await fixerLeJour(page, `${jour}T09:00:00+02:00`);
      await page.goto("/video");
      await expect(storyboard(page)).toHaveCount(7);
      const debords = await storyboard(page).evaluateAll((cadres) =>
        cadres.flatMap((cadre, i) => {
          const c = cadre.getBoundingClientRect();
          return [...cadre.querySelectorAll(".v-brand, .v-card, .v-k, .v-words p, .v-fig, .v-opt, .v-arg, .mark-big, h3, .v-url, .v-handle")]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5;
            })
            .map((e) => `image ${i + 1} : ${e.className || e.tagName}`);
        }),
      );
      expect(debords).toEqual([]);
    });
  }

  test("je corrige dans la fiche « 1,7 » en « 1,6 » : l'image des chiffres de la vidéo montre 1,6, sans rien retaper", async ({ page }) => {
    const dossier = "e2e/fiches/video-corrige";
    mkdirSync(dossier, { recursive: true });
    try {
      writeFileSync(`${dossier}/024.yaml`, readFileSync("content/questions/024-retraite.yaml", "utf8").replace('valeur: "1,7"', 'valeur: "1,6"'));
      await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "video-corrige", url: "http://localhost:3127" }]);
      await page.goto("/video");
      await expect(storyboard(page).nth(2).locator(".v-fig-num").first()).toHaveText("1,6");
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });
});

test.describe("la dernière image invite à répondre sur l'app", () => {
  const derniere = (page: Page) => page.getByRole("region", { name: "Le carrousel" }).getByRole("article", { name: "Image 6 sur 6 : et toi ?" });

  test("l'image 6/6 affiche « Et toi ? », « Réponds et découvre de quels candidats tu es proche » et l'adresse aucrible2027.fr", async ({ page }) => {
    await page.goto("/carrousel");
    await expect(derniere(page).getByRole("heading", { level: 3 })).toHaveText("Et toi ?");
    await expect(derniere(page).getByText("Réponds et découvre de quels candidats tu es proche", { exact: true })).toBeVisible();
    await expect(derniere(page).locator(".s-url")).toHaveText("aucrible2027.fr");
  });

  test("elle montre le camembert des 11 thèmes", async ({ page }) => {
    await page.goto("/carrousel");
    const camembert = derniere(page).locator(".mark-big svg");
    await expect(camembert).toBeVisible();
    const parts = await camembert.locator("path.wedge").evaluateAll((p) => p.map((e) => (e as SVGPathElement).style.fill));
    expect(parts).toEqual(["eco", "trav", "ecol", "immi", "secu", "sante", "educ", "loge", "euro", "inst", "soc"].map((t) => `var(--${t})`));
  });
});

test.describe("l'auteur récupère la légende proposée", () => {
  const legende = (page: Page) => page.getByRole("region", { name: "La légende" }).locator(".box");

  test("je copie la légende et je la colle ailleurs : je retrouve les deux paragraphes en entier", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await carrouselDeLaMaquette(page);
    const paragraphes = await legende(page).locator("p").allInnerTexts();
    expect(paragraphes).toHaveLength(2);
    // Sélectionner l'encadré et copier, comme on le ferait à la main.
    await legende(page).evaluate((boite) => {
      const plage = document.createRange();
      plage.selectNodeContents(boite);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(plage);
      document.execCommand("copy");
    });
    const colle = (await page.evaluate(() => navigator.clipboard.readText())).replace(/ /g, " ");
    for (const paragraphe of paragraphes) expect(colle).toContain(paragraphe.replace(/ /g, " "));
  });

  test("la légende de la n° 24 reprend la question et annonce le contexte, trois chiffres sourcés, les cinq options et le meilleur argument de chaque côté", async ({ page }) => {
    await carrouselDeLaMaquette(page);
    await expect(legende(page).locator("p").first()).toHaveText(
      "À quel âge devrait-on pouvoir partir à la retraite ? Fais défiler : le contexte, trois chiffres sourcés, les cinq options et le meilleur argument de chaque côté.",
    );
  });

  test("elle invite à répondre sur aucrible2027.fr (lien en bio) et dit « Ce n'est pas un sondage : tes réponses restent sur ton téléphone. »", async ({ page }) => {
    await carrouselDeLaMaquette(page);
    await expect(legende(page).locator("p").nth(1)).toHaveText(
      "Réponds sur aucrible2027.fr (lien en bio). Ce n'est pas un sondage : tes réponses restent sur ton téléphone.",
    );
  });
});

/**
 * Le face-à-face Glucksmann / Retailleau sur le jeu de fiches de test « face-a-face » (les cartes de
 * maquettes/face-a-face.html), pour un électeur qui a répondu aux questions données (toutes, par défaut).
 */
async function faceAFace(page: Page, repondues = [3, 9, 12, 15, 18, 21, 24], adresse = "/face-a-face/glucksmann/retailleau") {
  await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "face-a-face", url: "http://localhost:3127" }]);
  await page.goto("/");
  await page.evaluate((numeros) => {
    const reponses: Record<number, object> = {};
    for (const n of numeros) reponses[n] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22", duJour: false };
    localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
  }, repondues);
  await page.goto(adresse);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Face-à-face.");
}

/** La carte d'une question du face-à-face, et ce qu'elle montre de chaque candidat : nom, pion, lettre, titre, phrase. */
async function carteDuFaceAFace(page: Page, question: string) {
  const carte = page.locator(".vs-list .vs:has(.vs-card)").filter({ has: page.getByRole("heading", { level: 3, name: question }) });
  await expect(carte).toHaveCount(1);
  const cotes = await carte.locator(".side").evaluateAll((sides) =>
    sides.map((s) => ({
      nom: s.querySelector(".who b")!.textContent,
      pion: s.querySelector(".who .pawn")!.textContent,
      lettre: s.querySelector(".opt-letter")?.textContent,
      titre: s.querySelector(".pos-t")?.textContent,
      phrase: s.querySelector(".pos-i")?.textContent,
    })),
  );
  return { carte, cotes };
}

test.describe("le face-à-face montre deux candidats côte à côte, question par question", () => {
  test("pour un électeur qui a répondu à la n° 24, Glucksmann / Retailleau montre sous la retraite l'option B « 62 ans » de Glucksmann à gauche et D « 65 ans ou plus » de Retailleau à droite", async ({ page }) => {
    await faceAFace(page);
    await expect(page.locator(".duel .pick-name")).toHaveText(["RaphaëlGlucksmann", "BrunoRetailleau"]);
    const { cotes } = await carteDuFaceAFace(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    expect(cotes.map(({ nom, lettre, titre }) => [nom, lettre, titre])).toEqual([
      ["Raphaël Glucksmann", "B", "62 ans"],
      ["Bruno Retailleau", "D", "65 ans ou plus"],
    ]);
  });

  test("sous « Faut-il construire de nouveaux réacteurs nucléaires ? », Glucksmann a C et Retailleau D, chacun avec son pion et la même présentation", async ({ page }) => {
    await faceAFace(page);
    const { carte, cotes } = await carteDuFaceAFace(page, "Faut-il construire de nouveaux réacteurs nucléaires ?");
    expect(cotes).toEqual([
      { nom: "Raphaël Glucksmann", pion: "RG", lettre: "C", titre: "Construire les 6 EPR2 prévus", phrase: "Le programme déjà engagé, pour remplacer les plus anciens." },
      { nom: "Bruno Retailleau", pion: "BR", lettre: "D", titre: "Construire davantage", phrase: "Au-delà des 6 EPR2 prévus, de nouveaux sites et plus de réacteurs." },
    ]);
    // La même présentation : mêmes classes, mêmes couleurs, de chaque côté.
    const allure = await carte.locator(".side").evaluateAll((sides) =>
      sides.map((s) =>
        [".who .pawn", ".opt-letter", ".pos-t"].map((c) => {
          const e = s.querySelector(c)!;
          const st = getComputedStyle(e);
          return [e.className, st.backgroundColor, st.color, st.fontSize].join(" | ");
        }),
      ),
    );
    expect(allure[0]).toEqual(allure[1]);
  });
});

test.describe("chaque position du face-à-face affiche sa source", () => {
  test("sur la retraite, « 62 ans » de Glucksmann affiche « Entretien Libération · 9 sept. 2026 », « 65 ans ou plus » de Retailleau « Programme LR 2022 · janv. 2022 »", async ({ page }) => {
    await faceAFace(page);
    const { carte } = await carteDuFaceAFace(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(carte.locator(".side .pos-t")).toHaveText(["62 ans", "65 ans ou plus"]);
    await expect(carte.locator(".side .meta .src")).toHaveText(["Entretien Libération · 9 sept. 2026", "Programme LR 2022 · janv. 2022"]);
  });

  test("sur chaque question où les deux ont une position, les deux positions affichent une source avec une date", async ({ page }) => {
    await faceAFace(page);
    const cartes = page.locator(".vs-list .vs:has(.vs-card)");
    await expect(cartes).toHaveCount(7);
    const sources = await cartes.evaluateAll((liste) =>
      liste.map((c) => [...c.querySelectorAll(".side")].map((s) => s.querySelector(".meta .src")?.textContent?.trim() ?? "")),
    );
    for (const paire of sources) {
      expect(paire).toHaveLength(2);
      for (const source of paire) expect(source).toMatch(/\b(19|20)\d{2}\b/);
    }
  });
});

test.describe("chaque position du face-à-face porte son badge", () => {
  /** Pour chaque côté de la carte : la source et le badge. */
  const badges = (carte: Locator) =>
    carte.locator(".side").evaluateAll((s) => s.map((c) => [c.querySelector(".meta .src")!.textContent!.trim(), c.querySelector(".meta .badge")?.textContent?.trim()]));

  test("sur la retraite, Glucksmann (« Entretien Libération ») porte « Position officielle », Retailleau (« Programme LR 2022 ») « Position déduite »", async ({ page }) => {
    await faceAFace(page);
    const { carte } = await carteDuFaceAFace(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    expect(await badges(carte)).toEqual([
      ["Entretien Libération · 9 sept. 2026", "Position officielle"],
      ["Programme LR 2022 · janv. 2022", "Position déduite"],
    ]);
  });

  test("sur le nucléaire, c'est l'inverse : le badge suit la source, pas le candidat", async ({ page }) => {
    await faceAFace(page);
    const { carte } = await carteDuFaceAFace(page, "Faut-il construire de nouveaux réacteurs nucléaires ?");
    expect(await badges(carte)).toEqual([
      ["Vote de son groupe · 11 juin 2025", "Position déduite"],
      ["Entretien JDD · 28 sept. 2026", "Position officielle"],
    ]);
  });
});

test.describe("les questions où ils sont d'accord sont marquées", () => {
  test("sur la défense européenne, Glucksmann et Retailleau ont tous deux B « Mutualiser achats et industries », et la carte porte « Même option »", async ({ page }) => {
    await faceAFace(page);
    const { carte, cotes } = await carteDuFaceAFace(page, "Faut-il mutualiser la défense à l'échelle européenne ?");
    expect(cotes.map(({ lettre, titre }) => [lettre, titre])).toEqual([
      ["B", "Mutualiser achats et industries"],
      ["B", "Mutualiser achats et industries"],
    ]);
    await expect(carte.locator(".link .verdict")).toHaveText("Même option");
    await expect(carte).toHaveClass(/\bagree\b/);
  });

  test("sur la retraite (B contre D), la carte porte « Options différentes »", async ({ page }) => {
    await faceAFace(page);
    const { carte } = await carteDuFaceAFace(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(carte.locator(".link .verdict")).toHaveText("Options différentes");
    await expect(carte).toHaveClass(/\bdiffer\b/);
  });
});

test.describe("une position inconnue s'affiche comme telle", () => {
  test("sur les loyers, Retailleau s'affiche « Position inconnue », avec « Exclue du calcul », « Aucune source » et un « ? » à la place de la lettre", async ({ page }) => {
    await faceAFace(page, [3, 6, 9, 12, 15, 18, 21, 24]);
    const { carte } = await carteDuFaceAFace(page, "Faut-il encadrer les loyers ?");
    const retailleau = carte.getByRole("region", { name: "Position de Bruno Retailleau" });
    await expect(retailleau.locator(".opt-letter")).toHaveText("?");
    await expect(retailleau.locator(".pos-t")).toHaveText("Position inconnue");
    await expect(retailleau.locator(".meta .badge")).toHaveText("Exclue du calcul");
    await expect(retailleau.locator(".meta .src")).toHaveText("Aucune source");
  });

  test("au centre, le verdict est « Non comparée », alors que Glucksmann garde sa position A « Encadrement obligatoire en zone tendue »", async ({ page }) => {
    await faceAFace(page, [3, 6, 9, 12, 15, 18, 21, 24]);
    const { carte, cotes } = await carteDuFaceAFace(page, "Faut-il encadrer les loyers ?");
    await expect(carte.locator(".link .verdict")).toHaveText("Non comparée");
    expect([cotes[0].lettre, cotes[0].titre]).toEqual(["A", "Encadrement obligatoire en zone tendue"]);
  });
});

/** Les 24 questions du jeu « face-a-face » auxquelles répond l'électeur de la maquette (les n° 25 à 27 restent sans réponse). */
const VINGT_QUATRE = Array.from({ length: 24 }, (_, i) => i + 1);

test.describe("le face-à-face compte leurs accords", () => {
  test("pour Glucksmann et Retailleau, le résumé affiche « D'accord sur 4 questions sur 24 », « 17 fois… » et « 3 questions restent sans comparaison »", async ({ page }) => {
    await faceAFace(page, VINGT_QUATRE);
    const resume = page.getByRole("region", { name: "D'accord sur 4 questions sur 24" });
    await expect(resume.locator(".sum-k")).toHaveText("Entre Glucksmann et Retailleau");
    await expect(resume.getByRole("heading", { level: 2 })).toHaveText("D'accord sur 4 questions sur 24");
    await expect(resume.locator(".sum-s")).toHaveText(
      "17 fois, ils ne choisissent pas la même option. 3 questions restent sans comparaison : un des deux n'a pas de position connue.",
    );
  });

  test("la rangée de 24 pastilles compte 4 « même option », 17 « options différentes » et 3 « position inconnue », comme les cartes de la liste", async ({ page }) => {
    await faceAFace(page, VINGT_QUATRE);
    const pastilles = page.locator(".sum .tally i");
    await expect(pastilles).toHaveCount(24);
    const compte = async (selecteur: string) => pastilles.evaluateAll((p, s) => p.filter((e) => (s ? e.matches(s) : e.className === "")).length, selecteur);
    expect([await compte(".on"), await compte(""), await compte(".none")]).toEqual([4, 17, 3]);
    await expect(page.getByRole("img", { name: "Sur 24 questions : 4 fois la même option, 17 fois des options différentes, 3 comparaisons impossibles" })).toBeVisible();
    const verdicts = await page.locator(".vs-list .vs .verdict").allInnerTexts();
    expect(["Même option", "Options différentes", "Non comparée"].map((v) => verdicts.filter((t) => t.trim() === v).length)).toEqual([4, 17, 3]);
  });
});

test.describe("« Changer » remplace un des deux candidats", () => {
  /** Le panneau « Choisir un autre candidat » sous le candidat donné, ouvert. */
  async function panneau(page: Page, nom: string) {
    // Un <summary> n'a pas de rôle pour Playwright : on le trouve par son libellé.
    const bouton = page.locator(`summary[aria-label="Changer de candidat : ${nom}"]`);
    await bouton.click();
    const choix = page.locator(".pick").filter({ has: bouton }).locator(".chg-panel");
    await expect(choix.getByText("Choisir un autre candidat")).toBeVisible();
    return choix;
  }

  test("sous Retailleau, « changer » ouvre « Choisir un autre candidat » avec les 11 autres, dans un ordre mélangé", async ({ page }) => {
    await faceAFace(page);
    const noms = await (await panneau(page, "Bruno Retailleau")).getByRole("link").allInnerTexts();
    const contenu = (parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string }[]).map((c) => c.nom);
    const proposes = noms.map((n) => n.replace(/^\S+\s+/, "").trim());
    expect([...proposes].sort()).toEqual(contenu.filter((n) => n !== "Raphaël Glucksmann" && n !== "Bruno Retailleau").sort());
    expect(proposes).not.toEqual([...proposes].sort((a, b) => a.localeCompare(b, "fr")));
    expect(proposes).not.toEqual(contenu.filter((n) => proposes.includes(n)));
    await page.goto("/resultats");
    const classement = (await lignesDuClassement(page)).map(([, nom]) => nom!);
    expect(proposes).not.toEqual(classement.filter((n) => proposes.includes(n)));
  });

  test("choisir Marine Tondelier la met à droite à la place de Retailleau, Glucksmann reste à gauche, et chaque question montre sa position à droite", async ({ page }) => {
    await faceAFace(page);
    await (await panneau(page, "Bruno Retailleau")).getByRole("link", { name: /Marine Tondelier/ }).click();
    await page.waitForURL(/\/face-a-face\/glucksmann\/tondelier$/);
    // Next garde un instant l'ancienne page montée : seuls les éléments visibles comptent.
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["RaphaëlGlucksmann", "MarineTondelier"]);
    const cartes = page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true });
    await expect(cartes).toHaveCount(7);
    expect(await cartes.evaluateAll((c) => c.map((e) => [...e.querySelectorAll(".side")].map((s) => s.getAttribute("aria-label"))))).toEqual(
      Array(7).fill(["Position de Raphaël Glucksmann", "Position de Marine Tondelier"]),
    );
  });

  test("le même geste sous Glucksmann le remplace à gauche, sans toucher au candidat de droite", async ({ page }) => {
    await faceAFace(page);
    await (await panneau(page, "Raphaël Glucksmann")).getByRole("link", { name: /Marine Tondelier/ }).click();
    await page.waitForURL(/\/face-a-face\/tondelier\/retailleau$/);
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["MarineTondelier", "BrunoRetailleau"]);
  });
});

test.describe("le même candidat ne peut pas être choisi deux fois", () => {
  /** Les noms proposés dans le panneau « Choisir un autre candidat » sous le candidat donné. */
  async function proposes(page: Page, nom: string) {
    const bouton = page.locator(`summary[aria-label="Changer de candidat : ${nom}"]`).filter({ visible: true });
    await bouton.click();
    const liens = page.locator(".pick").filter({ has: bouton }).locator(".chg-panel").getByRole("link");
    await expect(liens.first()).toBeVisible();
    return (await liens.allInnerTexts()).map((n) => n.replace(/^\S+\s+/, "").trim());
  }

  test("sous Glucksmann, Retailleau n'est pas proposé ; sous Retailleau, Glucksmann non plus", async ({ page }) => {
    await faceAFace(page);
    expect(await proposes(page, "Raphaël Glucksmann")).not.toContain("Bruno Retailleau");
    await page.reload();
    expect(await proposes(page, "Bruno Retailleau")).not.toContain("Raphaël Glucksmann");
  });

  test("après avoir choisi Tondelier à droite, le panneau de gauche ne propose plus Tondelier mais de nouveau Retailleau", async ({ page }) => {
    await faceAFace(page, undefined, "/face-a-face/glucksmann/tondelier");
    const aGauche = await proposes(page, "Raphaël Glucksmann");
    expect(aGauche).not.toContain("Marine Tondelier");
    expect(aGauche).toContain("Bruno Retailleau");
    expect(aGauche).toHaveLength(11);
  });
});

test.describe("le disque central inverse les deux candidats", () => {
  const disque = (page: Page) => page.getByRole("link", { name: "Inverser l'ordre des deux candidats" }).filter({ visible: true });
  const noms = (page: Page) => page.locator(".duel .pick-name").filter({ visible: true });

  test("toucher le disque central met Retailleau à gauche et Glucksmann à droite, avec leurs pions et leurs noms", async ({ page }) => {
    await faceAFace(page);
    await disque(page).click();
    await page.waitForURL(/\/face-a-face\/retailleau\/glucksmann$/);
    await expect(noms(page)).toHaveText(["BrunoRetailleau", "RaphaëlGlucksmann"]);
    await expect(page.locator(".duel .pick > .pawn").filter({ visible: true })).toHaveText(["BR", "RG"]);
  });

  test("après l'inversion, sur la retraite, « 65 ans ou plus » est à gauche et « 62 ans » à droite, chacun avec sa source et son badge ; un second toucher remet l'ordre de départ", async ({ page }) => {
    await faceAFace(page);
    await disque(page).click();
    await page.waitForURL(/\/face-a-face\/retailleau\/glucksmann$/);
    const carte = page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true }).filter({ hasText: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    await expect(carte.locator(".side .pos-t")).toHaveText(["65 ans ou plus", "62 ans"]);
    await expect(carte.locator(".side .meta .src")).toHaveText(["Programme LR 2022 · janv. 2022", "Entretien Libération · 9 sept. 2026"]);
    await expect(carte.locator(".side .meta .badge")).toHaveText(["Position déduite", "Position officielle"]);
    await disque(page).click();
    await page.waitForURL(/\/face-a-face\/glucksmann\/retailleau$/);
    await expect(noms(page)).toHaveText(["RaphaëlGlucksmann", "BrunoRetailleau"]);
  });
});

test.describe("l'électeur filtre le face-à-face par thème", () => {
  const visibles = (page: Page) => page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true });
  const choisir = (page: Page, theme: string) => page.locator(".filt label.chip", { hasText: new RegExp(`^${theme}$`) }).click();

  test("« Toutes » est choisi au départ ; choisir « Travail & retraites » ne laisse que les questions de ce thème, dont la retraite", async ({ page }) => {
    await faceAFace(page);
    const filtre = page.getByRole("group", { name: "Filtrer par thème" });
    await expect(filtre.getByRole("radio")).toHaveCount(12);
    await expect(filtre.getByRole("radio", { name: "Toutes" })).toBeChecked();
    await expect(page.locator(".filt .sec-h p")).toHaveText("7 questions");
    await expect(visibles(page)).toHaveCount(7);
    await choisir(page, "Travail & retraites");
    await expect(visibles(page)).toHaveCount(1);
    await expect(visibles(page).getByRole("heading", { level: 3 })).toHaveText("À quel âge devrait-on pouvoir partir à la retraite ?");
  });

  test("« Écologie & énergie » remplace le premier choix (un seul thème à la fois) ; « Toutes » ramène toutes les questions", async ({ page }) => {
    await faceAFace(page);
    await choisir(page, "Travail & retraites");
    await choisir(page, "Écologie & énergie");
    await expect(page.getByRole("radio", { name: "Travail & retraites" })).not.toBeChecked();
    await expect(visibles(page)).toHaveCount(1);
    await expect(visibles(page).getByRole("heading", { level: 3 })).toHaveText("Faut-il construire de nouveaux réacteurs nucléaires ?");
    await choisir(page, "Toutes");
    await expect(visibles(page)).toHaveCount(7);
  });
});

test.describe("le face-à-face ne montre que les questions déjà répondues", () => {
  const aideActive = "Faut-il autoriser une aide active à mourir ?";

  test("sans réponse à « Faut-il autoriser une aide active à mourir ? », le face-à-face ne montre aucune position sur ce sujet", async ({ page }) => {
    await faceAFace(page, VINGT_QUATRE);
    await expect(page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true })).toHaveCount(24);
    await expect(page.getByRole("heading", { level: 3, name: aideActive })).toHaveCount(0);
    await expect(page.getByText(aideActive)).toHaveCount(0);
  });

  test("après avoir répondu à cette question, elle apparaît dans le face-à-face avec les deux positions", async ({ page }) => {
    await faceAFace(page, VINGT_QUATRE);
    await page.goto("/question/25");
    await voirLesPropositions(page);
    await expect(page.getByRole("heading", { name: aideActive }).filter({ visible: true })).toBeVisible();
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).filter({ visible: true }).click();
    await page.waitForURL(/\/question\/25\/revelation$/);
    await page.goto("/face-a-face/glucksmann/retailleau");
    const { cotes } = await carteDuFaceAFace(page, aideActive);
    expect(cotes.map(({ nom, lettre }) => [nom, lettre])).toEqual([
      ["Raphaël Glucksmann", "A"],
      ["Bruno Retailleau", "C"],
    ]);
  });
});

test.describe("une carte retournée compte les questions cachées", () => {
  const carteRetournee = (page: Page) => page.locator(".vs-list .fd-card").filter({ visible: true });

  test("à qui il reste 3 questions sans réponse, la carte après la dernière annonce « 3 questions attendent encore ta réponse »", async ({ page }) => {
    await faceAFace(page, VINGT_QUATRE);
    await expect(carteRetournee(page).getByRole("heading", { level: 3 })).toHaveText("3 questions attendent encore ta réponse");
    await expect(carteRetournee(page).locator(".fd-n")).toHaveCount(0);
    const derniere = await page.locator(".vs-list > li").filter({ visible: true }).last().getAttribute("class");
    expect(derniere).toContain("fd-row");
  });

  test("après une réponse à l'une d'elles, la carte annonce « 2 questions attendent encore ta réponse »", async ({ page }) => {
    await faceAFace(page, [...VINGT_QUATRE, 25]);
    await expect(carteRetournee(page).getByRole("heading", { level: 3 })).toHaveText("2 questions attendent encore ta réponse");
  });

  test("à qui a répondu à toutes les questions publiées, pas de carte retournée", async ({ page }) => {
    await faceAFace(page, [...VINGT_QUATRE, 25, 26, 27]);
    await expect(page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true })).toHaveCount(27);
    await expect(page.locator(".vs-list .fd-card")).toHaveCount(0);
  });
});

test.describe("sans réponse, le face-à-face invite à répondre d'abord", () => {
  test("un électeur qui n'a répondu à aucune question ne voit ni position, ni option, ni source", async ({ page }) => {
    await faceAFace(page, []);
    await expect(page.locator(".fd-card").filter({ visible: true })).toBeVisible();
    for (const selecteur of [".side", ".opt-letter", ".pos-t", ".meta .src", ".badge"]) await expect(page.locator(selecteur)).toHaveCount(0);
    await expect(page.getByText(/^Option de test/)).toHaveCount(0);
  });

  test("à la place, une invitation à répondre d'abord, avec un bouton « Répondre » vers la prochaine question", async ({ page }) => {
    await faceAFace(page, []);
    const invitation = page.locator(".fd-card").filter({ visible: true });
    await expect(invitation.getByRole("heading", { level: 3 })).toHaveText("Les 27 questions attendent ta réponse");
    await expect(invitation.locator(".fd-n")).toHaveCount(0);
    await invitation.getByRole("link", { name: "Répondre" }).click();
    await page.waitForURL(/\/$/);
    await voirLesPropositions(page);
    await expect(page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true })).toBeVisible();
  });
});

test.describe("un lien partagé ouvre le face-à-face sur deux candidats", () => {
  test("après avoir choisi Glucksmann et Tondelier, l'adresse ouverte dans un nouvel onglet affiche Glucksmann à gauche et Tondelier à droite", async ({ page, context }) => {
    await faceAFace(page);
    await expect(page.locator(".ff-share")).toHaveText("Lien partageable : ce face-à-face s'ouvre tout prêt");
    await page.locator('summary[aria-label="Changer de candidat : Bruno Retailleau"]').click();
    await page.locator(".pick").last().getByRole("link", { name: /Marine Tondelier/ }).click();
    await page.waitForURL(/\/face-a-face\/glucksmann\/tondelier$/);
    const onglet = await context.newPage();
    await onglet.goto(page.url());
    await expect(onglet.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["RaphaëlGlucksmann", "MarineTondelier"]);
  });

  test("l'adresse ne nomme que les deux candidats : sur un autre appareil, elle n'affiche aucune réponse de celui qui l'a partagée", async ({ page, browser }) => {
    await faceAFace(page, VINGT_QUATRE, "/face-a-face/glucksmann/tondelier");
    await expect(page.locator(".vs-list .vs:has(.vs-card)").filter({ visible: true })).toHaveCount(24);
    const adresse = new URL(page.url());
    expect([adresse.pathname, adresse.search, adresse.hash]).toEqual(["/face-a-face/glucksmann/tondelier", "", ""]);
    // Un autre appareil : un navigateur neuf, sans aucune réponse.
    const autre = await browser.newContext();
    await autre.addCookies([{ name: "aucrible-jeu-de-test", value: "face-a-face", url: "http://localhost:3127" }]);
    const ailleurs = await autre.newPage();
    await ailleurs.goto(page.url());
    await expect(ailleurs.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["RaphaëlGlucksmann", "MarineTondelier"]);
    await expect(ailleurs.locator(".fd-card").filter({ visible: true })).toBeVisible();
    await expect(ailleurs.locator(".vs-card")).toHaveCount(0);
    await autre.close();
  });
});

/** Les réponses de l'électeur de maquettes/moi-vs.html, sur le jeu de fiches de test « moi-contre » : option, importance, jour. */
const REPONSES_MOI_CONTRE: Record<number, [string, number, string]> = {
  1: ["C", 2, "2026-10-19"],
  2: ["C", 3, "2026-10-19"],
  3: ["B", 2, "2026-10-20"],
  5: ["B", 1, "2026-10-20"],
  6: ["A", 2, "2026-10-21"],
  7: ["B", 1, "2026-10-21"],
  8: ["C", 2, "2026-10-22"],
};

/** « Moi contre » le candidat donné, pour l'électeur de la maquette (ou les réponses données). */
async function moiContre(page: Page, candidat = "philippe", reponses = REPONSES_MOI_CONTRE) {
  await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "moi-contre", url: "http://localhost:3127" }]);
  await page.goto("/");
  await page.evaluate((r) => {
    const stockees: Record<string, object> = {};
    for (const [n, [option, importance, jour]] of Object.entries(r)) stockees[n] = { option, importance, graine: 1, jour, duJour: false };
    localStorage.setItem("aucrible:reponses", JSON.stringify(stockees));
  }, reponses);
  await page.goto(`/moi-contre/${candidat}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Moi contre un candidat.");
}

/** Une carte de « Moi contre » : ce qu'elle montre de l'électeur (à gauche) et du candidat (à droite), et son verdict. */
async function carteMoiContre(page: Page, question: string) {
  const carte = page.locator(".vs-list .vs:has(.vs-card)").filter({ has: page.getByRole("heading", { level: 3, name: question }) });
  await expect(carte).toHaveCount(1);
  const cotes = await carte.locator(".side").evaluateAll((sides) =>
    sides.map((s) => [s.getAttribute("aria-label"), s.querySelector(".opt-letter")?.textContent, s.querySelector(".pos-t")?.textContent]),
  );
  return { carte, cotes, verdict: (await carte.locator(".link .verdict").textContent())?.trim() };
}

test.describe("« Moi contre » montre ses réponses face à celles d'un candidat", () => {
  test("face à Édouard Philippe, la retraite montre « Ta réponse » C « 64 ans » à gauche, C « 64 ans » de Philippe à droite, et « Même option »", async ({ page }) => {
    await moiContre(page);
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["Tes réponsesToi", "ÉdouardPhilippe"]);
    const { cotes, verdict } = await carteMoiContre(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    expect(cotes).toEqual([
      ["Ta réponse", "C", "64 ans"],
      ["Position de Édouard Philippe", "C", "64 ans"],
    ]);
    expect(verdict).toBe("Même option");
  });

  test("sur l'impôt sur la fortune, B « Un impôt plancher… » de l'électeur fait face à C « Garder l'impôt sur la fortune immobilière », « Options différentes »", async ({ page }) => {
    await moiContre(page);
    const { cotes, verdict } = await carteMoiContre(page, "Faut-il rétablir l'impôt sur la fortune ?");
    expect(cotes).toEqual([
      ["Ta réponse", "B", "Un impôt plancher sur les très hauts patrimoines"],
      ["Position de Édouard Philippe", "C", "Garder l'impôt sur la fortune immobilière"],
    ]);
    expect(verdict).toBe("Options différentes");
  });

  test("chaque réponse de l'électeur rappelle sa date et son importance, par exemple « 19 oct. 2026 · importance ×2 »", async ({ page }) => {
    await moiContre(page);
    const { carte } = await carteMoiContre(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(carte.locator(".side.me .meta .src")).toHaveText("19 oct. 2026 · importance ×2");
    await expect(carte.locator(".side.me .meta .badge")).toHaveText("Ta réponse");
    const rappels = await page.locator(".vs-list .side.me .meta .src").filter({ visible: true }).allInnerTexts();
    expect(rappels).toHaveLength(7);
    for (const r of rappels) expect(r.trim()).toMatch(/^\d{1,2} \S+ 2026 · importance ×[123]$/);
    // Comme le face-à-face, de la question la plus récente à la plus ancienne : l'ordre de la maquette.
    await expect(page.locator(".vs-list .vs-q").filter({ visible: true })).toHaveText([
      "À quel âge devrait-on pouvoir partir à la retraite ?",
      "Faut-il construire de nouveaux réacteurs nucléaires ?",
      "Faut-il rétablir l'impôt sur la fortune ?",
      "Comment encadrer l'immigration de travail ?",
      "Faut-il rétablir les peines planchers ?",
      "Faut-il encadrer les loyers ?",
      "Faut-il réguler l'installation des médecins ?",
    ]);
  });
});

/**
 * Les 23 réponses de maquettes/moi-vs.html sur le jeu « moi-contre » : les 7 cartes de la maquette, et 16 autres
 * réponses qui retrouvent ses nombres (11 fois la même option qu'Édouard Philippe, 54 %). Sans réponse : les n° 4, 9,
 * 12 et 20.
 */
const VINGT_TROIS_MOI_CONTRE: Record<number, [string, number, string]> = {
  ...REPONSES_MOI_CONTRE,
  10: ["B", 1, "2026-10-18"],
  11: ["A", 1, "2026-10-18"],
  13: ["C", 1, "2026-10-18"],
  14: ["B", 1, "2026-10-18"],
  15: ["A", 3, "2026-10-17"],
  16: ["C", 1, "2026-10-17"],
  17: ["A", 3, "2026-10-17"],
  18: ["C", 1, "2026-10-17"],
  19: ["A", 2, "2026-10-16"],
  21: ["A", 1, "2026-10-16"],
  22: ["B", 1, "2026-10-16"],
  23: ["A", 2, "2026-10-15"],
  24: ["A", 2, "2026-10-15"],
  25: ["C", 2, "2026-10-15"],
  26: ["A", 1, "2026-10-14"],
  27: ["A", 1, "2026-10-14"],
};

test.describe("« Moi contre » affiche le % d'accord", () => {
  test("avec les 23 réponses de la maquette, dont 11 identiques à celles de Philippe, la page affiche « 54 % » et « Tu es d'accord avec Édouard Philippe sur 11 questions sur 23 (54 %) »", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const score = page.locator(".score").filter({ visible: true });
    await expect(score.locator(".score-k")).toHaveText("Ta proximité avec Édouard Philippe");
    await expect(score.locator(".score-big")).toHaveText("54 %");
    await expect(score.getByRole("heading", { level: 2 })).toHaveText("Tu es d'accord avec Édouard Philippe sur 11 questions sur 23 (54 %)");
  });

  test("ce pourcentage est celui de la ligne Édouard Philippe dans « Mes résultats » (7e, 54 %)", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    await expect(page.locator(".score .score-big").filter({ visible: true })).toHaveText("54 %");
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect(await lignesDuClassement(page)).toContainEqual(["7", "Édouard Philippe", "54 %"]);
  });

  test("la rangée de 23 pastilles compte 11 pastilles « même option » et 12 « autre option »", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const rangee = page.locator(".score .tally").filter({ visible: true });
    await expect(rangee).toHaveAttribute("role", "img");
    await expect(rangee).toHaveAttribute("aria-label", "Sur tes 23 réponses comparées : 11 fois la même option qu'Édouard Philippe, 12 fois une autre");
    await expect(rangee.locator("i")).toHaveCount(23);
    await expect(rangee.locator("i.on")).toHaveCount(11);
    await expect(page.locator(".score .score-key li").filter({ visible: true })).toHaveText(["même option", "autre option"]);
  });
});

/** La ligne d'un thème dans « Thème par thème » de « Moi contre ». */
const ligneDuThemeMoiContre = (page: Page, nom: string) =>
  page
    .getByRole("region", { name: "Thème par thème" })
    .locator(".th")
    .filter({ visible: true })
    .filter({ has: page.locator(".th-name", { hasText: nom }) });

test.describe("« Moi contre » affiche un score par thème", () => {
  test("dans « Économie & impôts » (4 réponses), la ligne affiche « 55 % » et « d'accord sur 2 questions sur 4 »", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const section = page.getByRole("region", { name: "Thème par thème" });
    await expect(section.getByText(/score dès/)).toHaveCount(0);
    await expect(section.locator(".th").filter({ visible: true })).toHaveCount(11);
    const ligne = ligneDuThemeMoiContre(page, "Économie & impôts");
    await expect(ligne).toHaveClass(/\bdone\b/);
    await expect(ligne.locator(".th-pc")).toHaveText("55 %");
    await expect(ligne.locator(".th-who")).toHaveText("d'accord sur 2 questions sur 4");
  });

  test("« Travail & retraites » (2 réponses) affiche 2 pastilles remplies sur 3 et « pas encore assez de réponses », sans pourcentage", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const ligne = ligneDuThemeMoiContre(page, "Travail & retraites");
    await expect(ligne.locator(".th-who")).toHaveText("pas encore assez de réponses");
    await expect(ligne.locator(".pips")).toHaveAttribute("aria-label", "2 réponses");
    await expect(ligne.locator(".pips i")).toHaveCount(3);
    await expect(ligne.locator(".pips i[style]")).toHaveCount(2);
    await expect(ligne.locator(".th-pc")).toHaveCount(0);
    await expect(ligne).not.toHaveClass(/\bdone\b/);
  });

  test("après une 3e réponse dans « Travail & retraites », la ligne affiche un pourcentage à la place de « pas encore assez de réponses »", async ({ page }) => {
    await moiContre(page, "philippe", { ...VINGT_TROIS_MOI_CONTRE, 12: ["B", 1, "2026-10-23"] });
    const ligne = ligneDuThemeMoiContre(page, "Travail & retraites");
    await expect(ligne.locator(".th-pc")).toHaveText("60 %");
    await expect(ligne.locator(".th-who")).toHaveText("d'accord sur 2 questions sur 3");
    await expect(ligne).toHaveClass(/\bdone\b/);
  });
});

test.describe("L'électeur change de candidat dans « Moi contre »", () => {
  /** Les liens du panneau « Choisir un autre candidat » sous Édouard Philippe, ouvert. */
  async function choixSousPhilippe(page: Page) {
    const bouton = page.locator('summary[aria-label="Changer de candidat : Édouard Philippe"]').filter({ visible: true });
    await bouton.click();
    const panneau = page.locator(".pick").filter({ has: bouton }).locator(".chg-panel");
    await expect(panneau.getByText("Choisir un autre candidat")).toBeVisible();
    return panneau.getByRole("link");
  }

  test("« changer » sous Édouard Philippe liste 12 candidats (les 13 moins Philippe), dans un ordre mélangé", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const liens = await choixSousPhilippe(page);
    await expect(liens).toHaveCount(12);
    const proposes = (await liens.allInnerTexts()).map((n) => n.replace(/^\S+\s+/, "").trim());
    const contenu = (parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string }[]).map((c) => c.nom);
    expect([...proposes].sort()).toEqual(contenu.filter((n) => n !== "Édouard Philippe").sort());
    expect(proposes).not.toEqual([...proposes].sort((a, b) => a.localeCompare(b, "fr")));
    expect(proposes).not.toEqual(contenu.filter((n) => proposes.includes(n)));
  });

  test("après avoir choisi Marine Le Pen, « Ta proximité avec Marine Le Pen » remplace celle de Philippe, les positions de droite sont les siennes, et les réponses de gauche ne changent pas", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const gauche = () => page.locator(".vs-list .side.me").filter({ visible: true }).allInnerTexts();
    // La liste s'affiche une fois dans le navigateur : on attend ses 23 cartes avant de les lire.
    await expect(page.locator(".vs-list .side.me").filter({ visible: true })).toHaveCount(23);
    const avant = await gauche();
    await (await choixSousPhilippe(page)).filter({ hasText: "Marine Le Pen" }).click();
    await page.waitForURL(/\/moi-contre\/le-pen$/);
    await expect(page.locator(".score .score-k").filter({ visible: true })).toHaveText("Ta proximité avec Marine Le Pen");
    await expect(page.locator(".score .score-big").filter({ visible: true })).toHaveText("58 %");
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["Tes réponsesToi", "MarineLe Pen"]);
    const droite = page.locator(".vs-list .side:not(.me)").filter({ visible: true });
    await expect(droite).toHaveCount(23);
    expect(new Set(await droite.evaluateAll((s) => s.map((e) => e.getAttribute("aria-label"))))).toEqual(new Set(["Position de Marine Le Pen"]));
    await expect(page.locator(".vs-list .side.me").filter({ visible: true })).toHaveCount(23);
    expect(await gauche()).toEqual(avant);
  });
});

test.describe("Chaque position du candidat affiche sa source dans « Moi contre »", () => {
  test("pour un électeur qui a répondu aux deux questions, la retraite (« 64 ans ») de Philippe affiche « Entretien Le Figaro · 5 sept. 2026 » et le nucléaire (« Construire les 6 EPR2 prévus ») « Vote du groupe Horizons · 11 juin 2025 »", async ({ page }) => {
    await moiContre(page, "philippe", { 1: ["C", 2, "2026-10-19"], 2: ["C", 3, "2026-10-19"] });
    for (const [question, titre, source] of [
      ["À quel âge devrait-on pouvoir partir à la retraite ?", "64 ans", "Entretien Le Figaro · 5 sept. 2026"],
      ["Faut-il construire de nouveaux réacteurs nucléaires ?", "Construire les 6 EPR2 prévus", "Vote du groupe Horizons · 11 juin 2025"],
    ]) {
      const { carte } = await carteMoiContre(page, question);
      const philippe = carte.locator('.side[aria-label="Position de Édouard Philippe"]');
      await expect(philippe.locator(".pos-t")).toHaveText(titre);
      await expect(philippe.locator(".meta .src")).toHaveText(source);
      await expect(philippe.locator(".meta .src svg")).toHaveCount(1);
    }
  });

  test("toute position de Philippe visible a une source datée : aucune position n'est affichée sans source", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const cotes = page.locator('.vs-list .side[aria-label="Position de Édouard Philippe"]').filter({ visible: true });
    await expect(cotes).toHaveCount(23);
    const sources = await cotes.evaluateAll((s) => s.map((e) => [e.querySelector(".pos-t")?.textContent, e.querySelector(".meta .src")?.textContent?.trim()]));
    for (const [titre, source] of sources) {
      expect(titre).toBeTruthy();
      expect(source).toMatch(/^\S.* · \d{1,2} (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.) \d{4}$/);
    }
  });
});

test.describe("Le badge de la position du candidat dans « Moi contre »", () => {
  /** Le badge du côté de Philippe sur une question, et sa source. */
  async function badgeDePhilippe(page: Page, question: string) {
    const { carte } = await carteMoiContre(page, question);
    const philippe = carte.locator('.side[aria-label="Position de Édouard Philippe"] .meta');
    return { badge: philippe.locator(".badge"), source: philippe.locator(".src") };
  }

  test("sur la retraite, Édouard Philippe (« Entretien Le Figaro · 5 sept. 2026 ») porte « Position officielle »", async ({ page }) => {
    await moiContre(page);
    const { badge, source } = await badgeDePhilippe(page, "À quel âge devrait-on pouvoir partir à la retraite ?");
    await expect(source).toHaveText("Entretien Le Figaro · 5 sept. 2026");
    await expect(badge).toHaveText("Position officielle");
  });

  test("sur le nucléaire, Édouard Philippe (« Vote du groupe Horizons · 11 juin 2025 ») porte « Position déduite »", async ({ page }) => {
    await moiContre(page);
    const { badge, source } = await badgeDePhilippe(page, "Faut-il construire de nouveaux réacteurs nucléaires ?");
    await expect(source).toHaveText("Vote du groupe Horizons · 11 juin 2025");
    await expect(badge).toHaveText("Position déduite");
  });

  test("du côté de l'électeur, le badge est « Ta réponse », jamais « Position officielle » ni « Position déduite »", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const badges = page.locator(".vs-list .side.me .badge").filter({ visible: true });
    await expect(badges).toHaveCount(23);
    expect(new Set(await badges.allInnerTexts())).toEqual(new Set(["Ta réponse"]));
  });
});

test.describe("Une question non répondue est grisée dans « Moi contre » et mène au rattrapage", () => {
  /** La carte d'une question sans réponse. */
  const carteSansReponse = (page: Page, question: string) =>
    page.locator(".vs-list .vs.fd-row").filter({ visible: true }).filter({ has: page.getByRole("heading", { level: 3, name: question }) });

  test("pour « Faut-il rétablir un service national obligatoire ? », sans réponse, la carte est grisée, dit « Tu n'as pas encore répondu » et ne montre aucune position d'Édouard Philippe", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const carte = carteSansReponse(page, "Faut-il rétablir un service national obligatoire ?");
    await expect(carte).toHaveCount(1);
    await expect(carte.locator(".fd-card")).toBeVisible();
    await expect(carte.locator(".fd-s")).toHaveText("Tu n'as pas encore répondu");
    await expect(carte.locator(".fd-n")).toHaveCount(0);
    await expect(carte.locator(".side, .opt-letter, .badge")).toHaveCount(0);
    // L'option A d'Édouard Philippe sur cette fiche de test ne s'affiche nulle part.
    await expect(carte).not.toContainText("Option de test A");
    // Grisée : la carte retournée, sans le fond blanc d'une carte répondue.
    const fond = await carte.locator(".fd-card").evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(fond).not.toBe("rgb(255, 255, 255)");
  });

  test("le bouton « Répondre » de cette carte ouvre cette question", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    await carteSansReponse(page, "Faut-il rétablir un service national obligatoire ?").getByRole("link", { name: "Répondre" }).click();
    await expect(page).toHaveURL(/\/question\/4$/);
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il rétablir un service national obligatoire ?" }).filter({ visible: true })).toBeVisible();
  });

  test("l'en-tête « Question par question » affiche « 23 réponses · 4 sans réponse » pour un électeur qui a répondu à 23 questions et en a 4 sans réponse", async ({ page }) => {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const entete = page.locator(".sec-h").filter({ visible: true }).filter({ has: page.getByRole("heading", { level: 2, name: "Question par question" }) });
    await expect(entete.locator("p")).toHaveText("23 réponses · 4 sans réponse");
    await expect(page.locator(".vs-list .vs.fd-row").filter({ visible: true })).toHaveCount(4);
  });
});

test.describe("La fiche mène à « Moi contre » ce candidat", () => {
  test("sur la fiche de Marine Tondelier, toucher « Moi contre Marine Tondelier » ouvre « Moi contre un candidat » avec Marine Tondelier déjà choisie", async ({ page }) => {
    await page.goto("/candidat/tondelier");
    const bouton = page.getByRole("complementary", { name: "Qui est-ce" }).getByRole("link", { name: "Moi contre Marine Tondelier" });
    await expect(bouton).toHaveClass(/\bact\b.*\bprimary\b/);
    await bouton.click();
    await page.waitForURL(/\/moi-contre\/tondelier$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Moi contre un candidat.");
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["Tes réponsesToi", "MarineTondelier"]);
  });
});

test.describe("La fiche mène au face-à-face", () => {
  /** Les liens de « Face-à-face » sur la fiche de Marine Tondelier, ouvert. */
  async function adversaires(page: Page) {
    await page.goto("/candidat/tondelier");
    const colonne = page.getByRole("complementary", { name: "Qui est-ce" });
    // Un <summary> n'a pas de rôle pour Playwright : on le trouve par son texte.
    const bouton = colonne.locator("summary", { hasText: "Face-à-face" });
    await expect(bouton).toHaveClass(/\bact\b.*\bsecond\b/);
    await bouton.click();
    const panneau = colonne.locator(".duo-panel");
    await expect(panneau).toBeVisible();
    return panneau.getByRole("link");
  }

  test("sur la fiche de Marine Tondelier, toucher « Face-à-face » ouvre le face-à-face", async ({ page }) => {
    const liens = await adversaires(page);
    await liens.filter({ hasText: "Raphaël Glucksmann" }).click();
    await page.waitForURL(/\/face-a-face\/tondelier\/glucksmann$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Face-à-face.");
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["MarineTondelier", "RaphaëlGlucksmann"]);
  });

  test("« Face-à-face » propose les 12 autres candidats, sans duo par défaut : chacun mène au face-à-face de Marine Tondelier et de lui", async ({ page }) => {
    const liens = await adversaires(page);
    await expect(liens).toHaveCount(12);
    const contenu = parse(readFileSync("content/candidats.yaml", "utf8")) as { id: string; nom: string }[];
    const adresses = await liens.evaluateAll((l) => l.map((a) => a.getAttribute("href")));
    expect([...adresses].sort()).toEqual(contenu.filter((c) => c.id !== "tondelier").map((c) => `/face-a-face/tondelier/${c.id}`).sort());
    const noms = (await liens.allInnerTexts()).map((n) => n.replace(/^\S+\s+/, "").trim());
    expect(noms).not.toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
  });
});

test.describe("« Moi contre » mène au face-à-face", () => {
  /** Les liens de « Face-à-face entre deux candidats », en bas de « Moi contre Édouard Philippe », ouvert. */
  async function adversairesDePhilippe(page: Page) {
    await moiContre(page, "philippe", VINGT_TROIS_MOI_CONTRE);
    const bloc = page.getByRole("region", { name: "Aller plus loin" }).filter({ visible: true });
    const bouton = bloc.locator("summary", { hasText: "Face-à-face entre deux candidats" });
    await expect(bouton).toHaveClass(/\bact\b.*\bprimary\b/);
    await bouton.click();
    await expect(bloc.locator(".duo-panel")).toBeVisible();
    return bloc.locator(".duo-panel").getByRole("link");
  }

  test("depuis « Moi contre Édouard Philippe », toucher « Face-à-face entre deux candidats » ouvre le face-à-face", async ({ page }) => {
    await (await adversairesDePhilippe(page)).filter({ hasText: "Marine Le Pen" }).click();
    await page.waitForURL(/\/face-a-face\/philippe\/le-pen$/);
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toHaveText("Face-à-face.");
    await expect(page.locator(".duel .pick-name").filter({ visible: true })).toHaveText(["ÉdouardPhilippe", "MarineLe Pen"]);
  });

  test("le bouton propose les 12 autres candidats, sans duo par défaut : chacun mène au face-à-face d'Édouard Philippe et de lui", async ({ page }) => {
    const liens = await adversairesDePhilippe(page);
    await expect(liens).toHaveCount(12);
    const contenu = parse(readFileSync("content/candidats.yaml", "utf8")) as { id: string }[];
    const adresses = await liens.evaluateAll((l) => l.map((a) => a.getAttribute("href")));
    expect([...adresses].sort()).toEqual(contenu.filter((c) => c.id !== "philippe").map((c) => `/face-a-face/philippe/${c.id}`).sort());
  });
});

test.describe("Un nouveau candidat entre dans le classement", () => {
  /** Jean Lassalle se déclare : il s'ajoute aux 13 candidats du contenu. */
  const lassalleSeDeclare = (page: Page) =>
    page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "lassalle", url: "http://localhost:3127" }]);

  test("quand Jean Lassalle se déclare, « Mes résultats » classe 14 candidats et Jean Lassalle y figure", async ({ page }) => {
    await lassalleSeDeclare(page);
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(14);
    const lignes = await lignesDuClassement(page);
    expect(lignes.map(([, nom]) => nom)).toContain("Jean Lassalle");
    expect(lignes.map(([n]) => n)).toEqual(Array.from({ length: 14 }, (_, i) => String(i + 1)));
  });

  test("Jean Lassalle a une fiche, avec le même pion que les autres candidats (initiales, sans couleur de parti)", async ({ page }) => {
    await lassalleSeDeclare(page);
    const pion = async (id: string) => {
      await page.goto(`/candidat/${id}`);
      const p = page.locator(".id-card .pawn");
      return { texte: await p.textContent(), classe: await p.getAttribute("class"), fond: await p.evaluate((e) => getComputedStyle(e).backgroundColor) };
    };
    const lassalle = await pion("lassalle");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jean Lassalle");
    await expect(page.locator(".id-card .party")).toHaveText("Résistons !");
    expect(lassalle.texte).toBe("JLa");
    for (const autre of ["tondelier", "le-pen", "melenchon"]) {
      const p = await pion(autre);
      expect([p.classe, p.fond]).toEqual([lassalle.classe, lassalle.fond]);
    }
  });

  test("il est proposé dans « Choisir un autre candidat » du face-à-face (12 noms) et de « Moi contre » (13 noms)", async ({ page }) => {
    await lassalleSeDeclare(page);
    const proposes = async (nom: string) => {
      const bouton = page.locator(`summary[aria-label="Changer de candidat : ${nom}"]`).filter({ visible: true });
      await bouton.click();
      const liens = page.locator(".pick").filter({ has: bouton }).locator(".chg-panel").getByRole("link");
      await expect(liens.first()).toBeVisible();
      return (await liens.allInnerTexts()).map((n) => n.replace(/^\S+\s+/, "").trim());
    };
    await faceAFace(page);
    const duFaceAFace = await proposes("Bruno Retailleau");
    expect(duFaceAFace).toHaveLength(12);
    expect(duFaceAFace).toContain("Jean Lassalle");
    await moiContre(page);
    const deMoiContre = await proposes("Édouard Philippe");
    expect(deMoiContre).toHaveLength(13);
    expect(deMoiContre).toContain("Jean Lassalle");
  });
});

test.describe("Un nouveau candidat sans source est « position inconnue » partout", () => {
  const lassalleSeDeclare = (page: Page) =>
    page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "lassalle", url: "http://localhost:3127" }]);

  test("la fiche de Jean Lassalle, juste après son entrée, affiche « Position inconnue — pas de source à ce jour » sur chacune des 24 questions publiées", async ({ page }) => {
    await lassalleSeDeclare(page);
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "candidat", url: "http://localhost:3127" }]);
    await page.goto("/candidat/lassalle");
    // Les lignes des questions, sans celles de la légende « Comment lire une position ».
    const lignes = page.getByRole("region", { name: "Ses positions" }).getByRole("listitem").filter({ has: page.locator(".pos-n") });
    await expect(lignes).toHaveCount(24);
    const titres = await lignes.evaluateAll((l) => l.map((e) => e.querySelector(".pos-title")?.textContent));
    expect(titres).toEqual(Array(24).fill("Position inconnue — pas de source à ce jour"));
    await expect(lignes.locator(".badge")).toHaveCount(0);
  });

  test("dans la révélation d'une question, Jean Lassalle est rangé sous « Position inconnue »", async ({ page }) => {
    await lassalleSeDeclare(page);
    await repondre(page, "62 ans");
    expect(await nomsSous(page, "Position inconnue")).toContain("Jean Lassalle");
    const options = await blocsDOption(page).getByRole("listitem").allInnerTexts();
    expect(options.join("\n")).not.toContain("Jean Lassalle");
  });

  test("dans un face-à-face avec lui, chaque question est « Non comparée »", async ({ page }) => {
    await lassalleSeDeclare(page);
    await faceAFace(page, [3, 9, 12, 15, 18, 21, 24], "/face-a-face/glucksmann/lassalle");
    const verdicts = page.locator(".vs-list .vs .verdict").filter({ visible: true });
    await expect(verdicts).toHaveCount(7);
    expect(new Set((await verdicts.allInnerTexts()).map((v) => v.trim()))).toEqual(new Set(["Non comparée"]));
  });
});

test.describe("À la liste officielle, seuls les candidats officiels restent", () => {
  /** La liste officielle de test (e2e/fiches/listes/officielle.yaml, publiée le 16 mars 2027), au jour donné. */
  async function listeOfficielle(page: Page, jour: string) {
    await fixerLeJour(page, jour);
    await page.context().addCookies([{ name: "aucrible-liste-officielle-de-test", value: "officielle", url: "http://localhost:3127" }]);
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" })).toBeVisible();
    return (await lignesDuClassement(page)).map(([, nom]) => nom!);
  }
  const contenu = () => (parse(readFileSync("content/candidats.yaml", "utf8")) as { nom: string }[]).map((c) => c.nom);

  test("à la publication de la liste officielle (~16 mars 2027), « Mes résultats » classe exactement les candidats de cette liste : un candidat absent de la liste n'y figure plus", async ({ page }) => {
    const classes = await listeOfficielle(page, "2027-03-17T09:00:00+01:00");
    expect([...classes].sort()).toEqual([...contenu().slice(0, -1), "Jean Lassalle"].sort());
    expect(classes).not.toContain(contenu().at(-1));
    // Le plateau aussi bascule : la liste est exacte partout dans « Mes résultats ».
    const legende = page.getByRole("list", { name: "Légende du plateau" });
    await expect(legende.getByRole("listitem")).toHaveCount(classes.length + 1);
    await expect(legende).not.toContainText(contenu().at(-1)!);
    await expect(legende).toContainText("Jean Lassalle");
  });

  test("un candidat de la liste officielle qui n'était pas encore dans le classement y entre, avec une fiche", async ({ page }) => {
    expect(await listeOfficielle(page, "2027-03-17T09:00:00+01:00")).toContain("Jean Lassalle");
    await page.goto("/candidat/lassalle");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jean Lassalle");
    await expect(page.locator(".id-card .pawn")).toHaveText("JLa");
  });

  test("la fiche du candidat écarté par la liste s'ouvre encore, sans proximité ni mention de retrait", async ({ page }) => {
    await listeOfficielle(page, "2027-03-17T09:00:00+01:00");
    const ecarte = (parse(readFileSync("content/candidats.yaml", "utf8")) as { id: string; nom: string }[]).at(-1)!;
    await page.goto(`/candidat/${ecarte.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ecarte.nom);
    await expect(page.getByRole("region", { name: "Ses positions" })).toBeVisible();
    await expect(page.locator(".prox, .gone")).toHaveCount(0);
  });

  test("la veille de sa publication, le classement reste celui des candidats du contenu, et Jean Lassalle n'a pas de fiche", async ({ page }) => {
    const classes = await listeOfficielle(page, "2027-03-15T09:00:00+01:00");
    expect([...classes].sort()).toEqual([...contenu()].sort());
    await page.goto("/candidat/lassalle");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cette carte n'est pas dans le paquet.");
  });
});

test.describe("les questions viennent dans un ordre tiré pour chaque appareil", () => {
  /** La question que l'accueil propose d'abord sur un appareil neuf, sans l'ordre fixé des autres tests. */
  async function premiereQuestion(page: Page) {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/");
    return (await page.getByText(/^Question n° \d+/).filter({ visible: true }).innerText()).trim();
  }

  test("sur huit appareils neufs, l'accueil ne propose pas toujours la même première question ; un appareil garde la sienne d'une visite à l'autre", async ({ browser }) => {
    const premieres = new Set<string>();
    for (let appareil = 0; appareil < 8; appareil++) {
      const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
      const page = await contexte.newPage();
      const premiere = await premiereQuestion(page);
      premieres.add(premiere);
      if (appareil === 0) {
        await page.reload();
        await expect(page.getByText(/^Question n° \d+/).filter({ visible: true })).toHaveText(premiere);
      }
      await contexte.close();
    }
    expect(premieres.size).toBeGreaterThan(1);
  });
});

test.describe("au téléphone, les icônes du menu sont en haut, à droite du logo", () => {
  for (const largeur of [375, 390]) {
    test(`à ${largeur} px, les quatre icônes tiennent dans la barre du haut, sans défilement de côté, et mènent à leur écran`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 812 });
      await page.goto("/");
      const barre = page.getByRole("banner");
      const liens = barre.getByRole("navigation", { name: "Navigation" }).getByRole("link");
      await expect(liens).toHaveCount(4);
      const haut = (await barre.boundingBox())!;
      for (const lien of await liens.all()) {
        await expect(lien).toBeVisible();
        const boite = (await lien.boundingBox())!;
        expect(boite.y + boite.height).toBeLessThanOrEqual(haut.y + haut.height + 1);
        expect(boite.x + boite.width).toBeLessThanOrEqual(largeur);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largeur);
      await barre.getByRole("link", { name: "Toutes les questions" }).click();
      await page.waitForURL(/\/rattrapage$/);
      await expect(page.getByRole("heading", { level: 1, name: "Les questions." })).toBeVisible();
    });
  }
});

test.describe("toutes les 5 réponses, un palier", () => {
  /** `n` réponses déjà données (les n° 1 à n), puis la réponse à la n° 24, la prochaine question de l'accueil. */
  async function repondreApres(page: Page, n: number) {
    await page.goto("/");
    await page.evaluate((n) => {
      const reponses: Record<number, object> = {};
      for (let numero = 1; numero <= n; numero++) reponses[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    }, n);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/question\/24\/revelation$/);
  }
  const palier = (page: Page) => page.getByRole("region", { name: "Palier" }).filter({ visible: true });

  for (const [rang, message] of [
    [5, "Encore 5 pour ton classement."],
    [10, "Ton classement est prêt."],
    [15, "Ton classement s'affine."],
  ] as const) {
    test(`la ${rang}e réponse : la révélation fête le palier, « ${rang} réponses » et « ${message} »`, async ({ page }) => {
      await repondreApres(page, rang - 1);
      await expect(palier(page)).toBeVisible();
      await expect(palier(page).locator(".palier-n")).toHaveText(String(rang));
      await expect(palier(page)).toContainText(`${rang} réponses`);
      await expect(palier(page)).toContainText(message);
    });
  }

  test("la 7e réponse n'a pas de palier", async ({ page }) => {
    await repondreApres(page, 6);
    await expect(page.getByRole("region", { name: "Qui défend quoi" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Palier" })).toHaveCount(0);
  });

  test("le palier reste attaché à sa réponse : rouvrir la révélation de la 5e le montre, celle d'une autre question non", async ({ page }) => {
    await repondreApres(page, 4);
    await page.goto("/question/24/revelation");
    await expect(palier(page)).toBeVisible();
    await page.goto("/question/3/revelation");
    await expect(page.getByRole("region", { name: "Qui défend quoi" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Palier" })).toHaveCount(0);
  });

  test("avec « réduire les animations », le palier s'affiche sans confettis", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await repondreApres(page, 4);
    await expect(palier(page)).toBeVisible();
    await expect(palier(page).locator(".confetti")).toBeHidden();
  });
});

test.describe("sur ordinateur, le menu montre la progression vers le prochain palier", () => {
  test.use({ viewport: { width: 1000, height: 550 }, isMobile: false, hasTouch: false });

  test("avec 7 réponses, le menu affiche « 7 » et deux crans pleins sur cinq : le prochain palier est à 10", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let numero = 1; numero <= 7; numero++) reponses[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
    await page.goto("/");
    const progression = page.getByRole("banner").getByRole("img", { name: "7 réponses, prochain palier à 10" });
    await expect(progression).toBeVisible();
    await expect(progression.locator(".rail-n")).toHaveText("7");
    await expect(progression.locator("i")).toHaveCount(5);
    await expect(progression.locator("i.on")).toHaveCount(2);
  });

  test("pile sur le palier de 10 réponses, les cinq crans sont pleins ; le prochain palier est à 15", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let numero = 1; numero <= 10; numero++) reponses[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
    await page.goto("/");
    const progression = page.getByRole("banner").getByRole("img", { name: "10 réponses, prochain palier à 15" });
    await expect(progression.locator("i.on")).toHaveCount(5);
  });

  test("sans réponse, le menu n'affiche pas de progression", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("img", { name: /prochain palier/ })).toHaveCount(0);
  });
});

test.describe("la question suivante s'ouvre vierge", () => {
  test("après B en ×3 sur la n° 24, « Question suivante » ouvre la n° 23 sans aucune option ni importance cochée", async ({ page }) => {
    await page.goto("/");
    await voirLesPropositions(page);
    await choisir(page, "62 ans");
    await peser(page, "×3");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/question\/24\/revelation$/);
    await page.getByRole("link", { name: "Question suivante" }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il encadrer les loyers dans les grandes villes ?" }).filter({ visible: true })).toBeVisible();
    const fiche = page.locator("form.answer").filter({ visible: true });
    await voirLesPropositions(page);
    await expect(fiche.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(fiche.getByRole("button", { name: "Valider ma réponse" })).toBeDisabled();
  });
});

test.describe("la révélation n'affiche pas de bloc vide", () => {
  test("sur une question où aucun candidat n'a de source (n° 26), pas de bloc d'alignement vide sous « Ta réponse »", async ({ page }) => {
    await fixerLeJour(page, "2026-10-25T09:00:00+02:00");
    await page.goto("/");
    await voirLesPropositions(page);
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il réguler l'installation des médecins ?" }).filter({ visible: true })).toBeVisible();
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/question\/26\/revelation$/);
    await expect(quiDefendQuoi(page)).toBeVisible();
    await expect(page.getByRole("region", { name: "Alignement sur ce sujet" })).toHaveCount(0);
  });
});

test.describe("le classement affiche sa fiabilité", () => {
  /** `n` réponses comptées (A aux n° 1 à n). */
  async function reponses(page: Page, n: number) {
    await page.goto("/");
    await page.evaluate((n) => {
      const r: Record<number, object> = {};
      for (let numero = 1; numero <= n; numero++) r[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(r));
    }, n);
  }
  const fiabilite = (page: Page) => page.locator(".res-hero .reliab").filter({ visible: true });

  test("avec 23 réponses, « Mes résultats » affiche « Fiabilité : moyenne (23 réponses) » avec deux crans allumés sur trois", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(fiabilite(page)).toHaveText("Fiabilité : moyenne (23 réponses)");
    await expect(fiabilite(page).locator(".meter i")).toHaveCount(3);
    await expect(fiabilite(page).locator(".meter i.on")).toHaveCount(2);
  });

  test("le nombre suit les réponses : après la réponse à la question n° 24, il indique 24 réponses", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/resultats");
    await expect(fiabilite(page)).toHaveText("Fiabilité : moyenne (24 réponses)");
  });

  test("les seuils : faible de 10 à 19 (un cran), forte à partir de 30 (trois crans), rien avant 10", async ({ page }) => {
    await reponses(page, 12);
    await page.goto("/resultats");
    await expect(fiabilite(page)).toHaveText("Fiabilité : faible (12 réponses)");
    await expect(fiabilite(page).locator(".meter i.on")).toHaveCount(1);
    await fixerLeJour(page, "2027-04-20T09:00:00+02:00");
    await reponses(page, 400);
    await page.goto("/resultats");
    await expect(fiabilite(page)).toHaveText(/^Fiabilité : forte \(\d+ réponses\)$/);
    await expect(fiabilite(page).locator(".meter i.on")).toHaveCount(3);
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await reponses(page, 5);
    await page.goto("/resultats");
    await expect(page.locator(".reliab")).toHaveCount(0);
  });
});

test.describe("avant 10 réponses, un bouton mène à la prochaine question", () => {
  test("avec 3 réponses, toucher « Répondre » dans « Ton classement » ouvre la prochaine question ; le bouton n'a pas de jauge", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    const bouton = page.getByRole("region", { name: "Ton classement" }).getByRole("link", { name: "Répondre" });
    await expect(bouton).toBeVisible();
    await expect(bouton.locator("i")).toHaveCount(0);
    await bouton.click();
    await page.waitForURL(/\/$/);
    await voirLesPropositions(page);
    await expect(page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true })).toBeVisible();
  });

  test("à 10 réponses, le classement s'affiche et le bouton disparaît", async ({ page }) => {
    await premieresReponses(page, 10);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("link", { name: "Répondre" })).toHaveCount(0);
  });
});

test.describe("des pions qui se chevauchent restent lisibles au téléphone", () => {
  // Jeu « plateau-proche » : Lisnard y a partout la position de Retailleau ; l'électeur répond comme Zemmour.
  const COMME_ZEMMOUR: Record<number, string> = { 1: "C", 2: "B", 3: "C", 4: "C", 5: "A", 6: "B", 7: "C", 8: "C", 9: "C", 10: "C", 11: "C", 12: "C" };

  /** Le centre et le diamètre de chaque pion du plateau (« TOI » compris), par ses initiales. */
  async function pionsDuPlateau(page: Page) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "plateau-proche", url: "http://localhost:3127" }]);
    await page.goto("/");
    await page.evaluate((r) => {
      const reponses: Record<number, object> = {};
      for (const [n, option] of Object.entries(r)) reponses[Number(n)] = { option, importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    }, COMME_ZEMMOUR);
    await page.goto("/resultats");
    const plateau = page.getByRole("region", { name: "Ton plateau" });
    await expect(plateau.locator(".field .pawn").first()).toBeVisible();
    // Les centres se mesurent à l'écran : le champ doit y être en entier.
    await plateau.locator(".field").scrollIntoViewIfNeeded();
    return plateau.locator(".field .pawn, .field .you").evaluateAll((els) =>
      Object.fromEntries(
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return [e.classList.contains("you") ? "TOI" : e.textContent!.trim(), { x: r.x + r.width / 2, y: r.y + r.height / 2, d: Math.min(r.width, r.height) }];
        }),
      ),
    );
  }
  const ecart = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  test("à 375 px, Lisnard et Retailleau, à la même place, ont deux pions distincts dont on lit les initiales", async ({ page }) => {
    const pions = await pionsDuPlateau(page);
    expect(ecart(pions.DL, pions.BR)).toBeGreaterThanOrEqual(Math.min(pions.DL.d, pions.BR.d) * 0.9);
    for (const initiales of ["DL", "BR"]) {
      const { x, y } = pions[initiales];
      expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent?.trim(), [x, y])).toBe(initiales);
    }
  });

  test("quand « TOI » tombe sur le pion de Zemmour, on repère encore les deux", async ({ page }) => {
    const pions = await pionsDuPlateau(page);
    expect(ecart(pions.TOI, pions["ÉZ"])).toBeGreaterThanOrEqual((pions.TOI.d + pions["ÉZ"].d) / 2 * 0.9);
  });

  test("aucun pion ne sort du plateau en s'écartant", async ({ page }) => {
    const pions = await pionsDuPlateau(page);
    const champ = (await page.getByRole("region", { name: "Ton plateau" }).locator(".field").boundingBox())!;
    for (const { x, y } of Object.values(pions)) {
      expect(x).toBeGreaterThanOrEqual(champ.x);
      expect(x).toBeLessThanOrEqual(champ.x + champ.width);
      expect(y).toBeGreaterThanOrEqual(champ.y);
      expect(y).toBeLessThanOrEqual(champ.y + champ.height);
    }
  });
});

test.describe("un candidat sans aucune note n'a pas de pion sur le plateau", () => {
  test("Jean Lassalle, entré sans position, n'est pas posé sur le plateau ; la légende le dit « pas encore placé »", async ({ page }) => {
    await page.context().addCookies([{ name: "aucrible-candidats-de-test", value: "lassalle", url: "http://localhost:3127" }]);
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    const plateau = page.getByRole("region", { name: "Ton plateau" });
    await expect(plateau.locator(".field .pawn").first()).toBeVisible();
    await expect(plateau.locator(".field .pawn", { hasText: /^JLa$/ })).toHaveCount(0);
    await expect(plateau.getByRole("list", { name: "Légende du plateau" }).getByRole("listitem").filter({ hasText: "Jean Lassalle" })).toContainText("pas encore placé");
  });
});

test.describe("les 11 parts remplies font du camembert un trophée", () => {
  /** Le jeu « camembert-complet » (3 fiches par thème) et les réponses aux n° 1 à `n`. */
  async function repondreJusqua(page: Page, n: number) {
    await page.context().addCookies([{ name: "aucrible-jeu-de-test", value: "camembert-complet", url: "http://localhost:3127" }]);
    await page.goto("/");
    await page.evaluate((n) => {
      const r: Record<number, object> = {};
      for (let numero = 1; numero <= n; numero++) r[numero] = { option: "A", importance: 1, graine: 1, jour: "2026-10-22" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(r));
    }, n);
  }

  test("avec 3 réponses dans chacun des 11 thèmes, « Mes résultats » affiche « 11/11 », ses 11 parts remplies, et « Camembert complet »", async ({ page }) => {
    await repondreJusqua(page, 33);
    await page.goto("/resultats");
    const trophee = page.locator(".res-hero .trophy").filter({ visible: true });
    await expect(trophee.locator(".count b")).toHaveText("11/11");
    await expect(trophee.getByRole("img", { name: /11 thèmes complétés sur 11/ })).toBeVisible();
    await expect(trophee).toContainText("Camembert complet");
    await expect(trophee.locator(".confetti i").first()).toBeAttached();
  });

  test("à 10/11, ni « Camembert complet » ni confettis : c'est le passage à 11/11 qui marque le trophée", async ({ page }) => {
    await repondreJusqua(page, 32);
    await page.goto("/resultats");
    const trophee = page.locator(".res-hero .trophy").filter({ visible: true });
    await expect(trophee.locator(".count b")).toHaveText("10/11");
    await expect(trophee).not.toContainText("Camembert complet");
    await expect(trophee.locator(".confetti")).toHaveCount(0);
  });

  test("la réponse qui complète le camembert : la révélation fête « Camembert complet », un palier spécial", async ({ page }) => {
    await repondreJusqua(page, 32);
    await page.goto("/");
    await voirLesPropositions(page);
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/question\/33\/revelation$/);
    const trophee = page.getByRole("region", { name: "Camembert complet" }).filter({ visible: true });
    await expect(trophee).toBeVisible();
    await expect(trophee).toContainText("11 parts sur 11");
  });
});

test.describe("la page Méthode mène au code source public", () => {
  const regle8 = (page: Page) => page.getByRole("article", { name: "Ce que cet outil n'est pas, et comment le vérifier" });

  test("la règle n° 8 dit que la formule, les notes, les sources et les corrections sont publiques, et affiche « Le code est public sur GitHub »", async ({ page }) => {
    await page.goto("/methode");
    await expect(regle8(page)).toContainText("Tu peux tout vérifier. La formule, les notes, les sources et les corrections sont publiques, et le calcul tient en quelques lignes de code.");
    await expect(regle8(page).getByRole("link", { name: "Le code est public sur GitHub" })).toBeVisible();
  });

  test("toucher le bouton ouvre github.com/Zewed/aucrible2027 dans un nouvel onglet ; la page Méthode reste ouverte", async ({ page, context }) => {
    // Le dépôt n'est pas chargé pour de vrai : seul compte l'onglet qui s'ouvre, et son adresse.
    await context.route("https://github.com/**", (route) => route.fulfill({ status: 200, body: "dépôt" }));
    await page.goto("/methode");
    const [onglet] = await Promise.all([context.waitForEvent("page"), regle8(page).getByRole("link", { name: "Le code est public sur GitHub" }).click()]);
    await onglet.waitForLoadState();
    expect(onglet.url()).toBe("https://github.com/Zewed/aucrible2027");
    await expect(page).toHaveURL(/\/methode$/);
  });
});

/** Ce que dit un QR code de la page, lu comme le ferait l'appareil photo d'un autre téléphone. */
async function lireLeQrCode(qr: Locator) {
  const image = PNG.sync.read(await qr.screenshot());
  return jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data ?? null;
}

test.describe("l'électeur affiche ses réponses en QR code", () => {
  const envoyer = (page: Page) => page.getByRole("region", { name: "Envoyer mes réponses" });

  test("avec 23 réponses, « Changer d'appareil » affiche sous « Envoyer mes réponses » un QR code et « Scanne-le avec ton autre appareil »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Changer d'appareil.");
    await expect(envoyer(page).getByRole("img", { name: "QR code de tes réponses" })).toBeVisible();
    await expect(envoyer(page).getByText("Scanne-le avec ton autre appareil", { exact: true })).toBeVisible();
  });

  test("lu par l'appareil photo d'un autre téléphone, le QR code propose d'ouvrir une adresse du site, avec les 23 réponses après le #", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    const adresse = await lireLeQrCode(envoyer(page).getByRole("img", { name: "QR code de tes réponses" }));
    expect(adresse).toMatch(/^http:\/\/localhost:3127\/i#/);
    const [, ...reponses] = adresse!.split("#")[1].split(",");
    expect(reponses).toHaveLength(23);
    expect(reponses.find((r) => r.startsWith("1."))).toBe("1.A.3.20261022");
  });

  test("le QR code ne contient que des réponses, rien qui ne soit à l'électeur : ni adresse, ni compte", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    const adresse = await lireLeQrCode(envoyer(page).getByRole("img", { name: "QR code de tes réponses" }));
    expect(adresse!.split("#")[1]).toMatch(/^1(,\d+\.(?:[A-E]|nsp)\.[0-3]\.\d{8})+$/);
  });
});

test.describe("l'électeur copie ses réponses en lien", () => {
  const envoyer = (page: Page) => page.getByRole("region", { name: "Envoyer mes réponses" });

  test("un clic sur « Copier le lien » met dans le presse-papiers une adresse du site en /i#, la même que le QR code", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    await envoyer(page).getByRole("button", { name: "Copier le lien" }).click();
    const copie = await page.evaluate(() => navigator.clipboard.readText());
    expect(copie).toMatch(/^http:\/\/localhost:3127\/i#1,/);
    expect(copie).toBe(await lireLeQrCode(envoyer(page).getByRole("img", { name: "QR code de tes réponses" })));
    await expect(envoyer(page).getByRole("button", { name: "Lien copié" })).toBeVisible();
  });

  test("l'avertissement dit le vrai nombre de réponses : 23, puis 24 après une réponse de plus", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    await expect(envoyer(page).locator(".caution")).toHaveText("Le lien contient tes 23 réponses : ne le partage qu'avec toi-même.");
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/appareil");
    await expect(envoyer(page).locator(".caution")).toHaveText("Le lien contient tes 24 réponses : ne le partage qu'avec toi-même.");
  });

  test("la ligne du lien montre son début, sans le déborder", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/appareil");
    const ligne = envoyer(page).locator(".linkrow");
    await expect(ligne).toContainText("localhost:3127/i#1,");
    const [boite, carte] = await Promise.all([ligne.boundingBox(), envoyer(page).boundingBox()]);
    expect(boite!.x + boite!.width).toBeLessThanOrEqual(carte!.x + carte!.width + 1);
  });
});

/** L'adresse que l'appareil `page` emporte : celle de son QR code, lue depuis l'image. */
async function adresseDeLAppareil(page: Page) {
  await page.goto("/appareil");
  return (await lireLeQrCode(page.getByRole("region", { name: "Envoyer mes réponses" }).getByRole("img", { name: "QR code de tes réponses" })))!;
}

/**
 * Un appareil photo de test : il filme, en boucle, le QR code de `contenu` (ou n'importe quelle image). Seul le test
 * le pose ; l'app, elle, demande l'appareil photo au navigateur comme d'habitude.
 */
async function appareilPhotoQuiFilme(contexte: BrowserContext, contenu: string) {
  const qr = qrcode(0, "M");
  qr.addData(contenu);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 8, margin: 4 });
  await contexte.addInitScript((svg) => {
    navigator.mediaDevices.getUserMedia = async () => {
      const toile = document.createElement("canvas");
      toile.width = toile.height = 480;
      const dessin = toile.getContext("2d")!;
      const image = new Image();
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await image.decode();
      const filmer = () => {
        dessin.fillStyle = "#fff";
        dessin.fillRect(0, 0, 480, 480);
        dessin.drawImage(image, 40, 40, 400, 400);
        requestAnimationFrame(filmer);
      };
      filmer();
      return toile.captureStream(15);
    };
  }, svg);
}

test.describe("scanner le QR code importe les réponses", () => {
  test("sur un appareil sans réponse, « Scanner un QR code » ouvre l'appareil photo ; en visant le QR code de l'ancien, « Mes résultats » montre les mêmes 23 réponses et le même classement", async ({ page, browser }) => {
    await vingtTroisReponses(page);
    const adresse = await adresseDeLAppareil(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    const classementAncien = await lignesDuClassement(page);

    const nouveau = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await fixerLOrdre(nouveau);
    await appareilPhotoQuiFilme(nouveau, adresse);
    const autre = await nouveau.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto("/appareil");
    await autre.getByRole("region", { name: "Récupérer mes réponses" }).getByRole("button", { name: "Scanner un QR code" }).click();
    await autre.waitForURL(/\/resultats$/);
    await expect(autre.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    expect(await lignesDuClassement(autre)).toEqual(classementAncien);
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    await nouveau.close();
  });

  test("visé hors de l'app, avec l'appareil photo du téléphone, le lien du QR code ouvre l'app et importe aussi les 23 réponses", async ({ page, browser }) => {
    await vingtTroisReponses(page);
    const adresse = await adresseDeLAppareil(page);
    const nouveau = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const autre = await nouveau.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto(adresse);
    await autre.waitForURL(/\/resultats$/);
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    await nouveau.close();
  });

  test("la n° 24, répondue E en ×2 sur l'ancien appareil, s'ouvre sur sa révélation avec « Ta carte » sur E et ×2 sur le nouveau", async ({ page, browser }) => {
    await page.goto("/");
    await choisir(page, "À la carte, avec un système à points");
    await peser(page, "×2");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    const adresse = await adresseDeLAppareil(page);
    const nouveau = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const autre = await nouveau.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto(adresse);
    await autre.waitForURL(/\/resultats$/);
    await autre.goto("/question/24");
    await autre.waitForURL(/\/question\/24\/revelation$/);
    await expect(autre.getByRole("region", { name: /^Ta réponse : E/ })).toBeVisible();
    await expect(autre.getByText("Importance ×2", { exact: true })).toBeVisible();
    await expect(autre.getByRole("article", { name: "Option E : À la carte, avec un système à points" }).getByText("Ta carte")).toBeVisible();
    await nouveau.close();
  });
});

test.describe("coller le lien importe les réponses", () => {
  /** Coller tel quel le lien de l'ancien appareil dans « Coller un lien » du nouveau, puis « Importer ». */
  async function collerSurUnNouvelAppareil(browser: import("@playwright/test").Browser, lien: string) {
    const nouveau = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const autre = await nouveau.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto("/appareil");
    const carte = autre.getByRole("region", { name: "Récupérer mes réponses" });
    await carte.getByRole("textbox", { name: "Coller un lien" }).fill(lien);
    await carte.getByRole("button", { name: "Importer" }).click();
    await autre.waitForURL(/\/resultats$/);
    return { nouveau, autre };
  }

  test("sur un appareil sans réponse, coller le lien copié puis « Importer » fait apparaître les mêmes 23 réponses dans « Mes résultats »", async ({ page, browser }) => {
    await vingtTroisReponses(page);
    const { nouveau, autre } = await collerSurUnNouvelAppareil(browser, await adresseDeLAppareil(page));
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    await expect(autre.getByRole("region", { name: "Ton classement" }).getByRole("listitem")).toHaveCount(13);
    await nouveau.close();
  });

  test("la n° 24, répondue E en ×2 sur l'ancien appareil, s'ouvre sur sa révélation avec « Ta carte » sur E et ×2 sur le nouveau", async ({ page, browser }) => {
    await page.goto("/");
    await choisir(page, "À la carte, avec un système à points");
    await peser(page, "×2");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    const { nouveau, autre } = await collerSurUnNouvelAppareil(browser, await adresseDeLAppareil(page));
    await autre.goto("/question/24");
    await autre.waitForURL(/\/question\/24\/revelation$/);
    await expect(autre.getByRole("region", { name: /^Ta réponse : E/ })).toBeVisible();
    await expect(autre.getByText("Importance ×2", { exact: true })).toBeVisible();
    await nouveau.close();
  });

  test("le champ accepte aussi le lien sans http:// devant, tel que la ligne de la carte 1 l'affiche", async ({ page, browser }) => {
    await vingtTroisReponses(page);
    const lien = (await adresseDeLAppareil(page)).replace(/^https?:\/\//, "");
    const { nouveau, autre } = await collerSurUnNouvelAppareil(browser, lien);
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    await nouveau.close();
  });
});

test.describe("un appareil qui a déjà des réponses demande avant de les remplacer", () => {
  /** Un appareil à 5 réponses (A aux n° 1 à 5) qui ouvre le lien d'un appareil à 23 réponses. */
  async function cinqPuisLien(page: Page, browser: import("@playwright/test").Browser) {
    await vingtTroisReponses(page);
    const lien = await adresseDeLAppareil(page);
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    const autre = await contexte.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto("/");
    await autre.evaluate(() => {
      const r: Record<number, object> = {};
      for (let n = 1; n <= 5; n++) r[n] = { option: "B", importance: 1, graine: 1, jour: "2026-10-20" };
      localStorage.setItem("aucrible:reponses", JSON.stringify(r));
    });
    await autre.goto(lien);
    return { contexte, autre };
  }
  const nombreDeReponses = (page: Page) => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("aucrible:reponses") ?? "{}")).length);
  const question = (page: Page) => page.getByRole("alertdialog", { name: "Cet appareil a déjà 5 réponses. Les remplacer par les 23 importées ?" });

  test("ouvrir le lien d'un appareil à 23 réponses sur un appareil à 5 demande « Les remplacer ? » avant tout changement", async ({ page, browser }) => {
    const { contexte, autre } = await cinqPuisLien(page, browser);
    await expect(question(autre)).toBeVisible();
    await expect(question(autre).locator(".swap")).toContainText("5sur cet appareil");
    await expect(question(autre).locator(".swap")).toContainText("23dans le lien");
    expect(await nombreDeReponses(autre)).toBe(5);
    await contexte.close();
  });

  test("« Annuler » garde les 5 réponses de l'appareil", async ({ page, browser }) => {
    const { contexte, autre } = await cinqPuisLien(page, browser);
    await question(autre).getByRole("button", { name: "Annuler" }).click();
    await autre.waitForURL(/\/appareil$/);
    expect(await nombreDeReponses(autre)).toBe(5);
    await contexte.close();
  });

  test("« Remplacer » fait passer « Mes résultats » à 23 réponses, et non 28 : les 5 anciennes sont remplacées, pas ajoutées", async ({ page, browser }) => {
    const { contexte, autre } = await cinqPuisLien(page, browser);
    await question(autre).getByRole("button", { name: "Remplacer" }).click();
    await autre.waitForURL(/\/resultats$/);
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    expect(await nombreDeReponses(autre)).toBe(23);
    await contexte.close();
  });
});

test.describe("un code illisible est refusé avec un message", () => {
  /** Un nouvel appareil, avec `reponses` réponses déjà là, dont l'appareil photo filme le QR code de `contenu`. */
  async function scannerSurUnAppareil(browser: import("@playwright/test").Browser, contenu: string, reponses = 0) {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await fixerLOrdre(contexte);
    await appareilPhotoQuiFilme(contexte, contenu);
    const autre = await contexte.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    await autre.goto("/appareil");
    await autre.evaluate((reponses) => {
      const r: Record<number, object> = {};
      for (let n = 1; n <= reponses; n++) r[n] = { option: "B", importance: 1, graine: 1, jour: "2026-10-20" };
      if (reponses) localStorage.setItem("aucrible:reponses", JSON.stringify(r));
    }, reponses);
    const carte = autre.getByRole("region", { name: "Récupérer mes réponses" });
    await carte.getByRole("button", { name: "Scanner un QR code" }).click();
    return { contexte, autre, carte };
  }
  const nombreDeReponses = (page: Page) => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("aucrible:reponses") ?? "{}")).length);

  test("scanner le QR code d'un site quelconque affiche « Ce code n'est pas lisible. Réessaie ou colle le lien. » et n'importe rien", async ({ browser }) => {
    const { contexte, autre, carte } = await scannerSurUnAppareil(browser, "https://exemple.org/menu-du-jour");
    await expect(carte.getByRole("alert")).toHaveText("Ce code n'est pas lisible. Réessaie ou colle le lien.");
    await expect(autre).toHaveURL(/\/appareil$/);
    expect(await nombreDeReponses(autre)).toBe(0);
    await contexte.close();
  });

  test("le QR code d'une adresse de transfert abîmée est refusé de la même façon", async ({ browser, baseURL }) => {
    const { contexte, autre, carte } = await scannerSurUnAppareil(browser, `${baseURL}/i#1,24.Z.9.2026`);
    await expect(carte.getByRole("alert")).toHaveText("Ce code n'est pas lisible. Réessaie ou colle le lien.");
    await expect(autre).toHaveURL(/\/appareil$/);
    expect(await nombreDeReponses(autre)).toBe(0);
    await contexte.close();
  });

  test("sur un appareil qui a déjà 5 réponses, ce refus garde les 5 réponses et ne demande pas « Les remplacer ? »", async ({ browser }) => {
    const { contexte, autre, carte } = await scannerSurUnAppareil(browser, "https://exemple.org/menu-du-jour", 5);
    await expect(carte.getByRole("alert")).toHaveText("Ce code n'est pas lisible. Réessaie ou colle le lien.");
    await expect(autre.getByRole("alertdialog")).toHaveCount(0);
    expect(await nombreDeReponses(autre)).toBe(5);
    await contexte.close();
  });

  test("un texte collé qui n'est pas un lien de transfert affiche le même message", async ({ page }) => {
    await page.goto("/appareil");
    const carte = page.getByRole("region", { name: "Récupérer mes réponses" });
    await carte.getByRole("textbox", { name: "Coller un lien" }).fill("bonjour");
    await carte.getByRole("button", { name: "Importer" }).click();
    await expect(carte.getByRole("alert")).toHaveText("Ce code n'est pas lisible. Réessaie ou colle le lien.");
    await expect(page).toHaveURL(/\/appareil$/);
  });
});

test.describe("la page dit que les réponses ne passent par aucun serveur", () => {
  test("en haut de « Changer d'appareil », le bandeau dit « Tes réponses ne quittent ton téléphone que si tu le décides. » et « Pas de compte, pas de serveur. »", async ({ page }) => {
    await page.goto("/appareil");
    const bandeau = page.getByRole("note");
    await expect(bandeau.locator("p")).toHaveText(["Tes réponses ne quittent ton téléphone que si tu le décides.", "Pas de compte, pas de serveur."]);
    const [haut, carte] = await Promise.all([bandeau.boundingBox(), page.getByRole("region", { name: "Envoyer mes réponses" }).boundingBox()]);
    expect(haut!.y).toBeLessThan(carte!.y);
  });

  test("un transfert complet (afficher le QR code, le scanner, importer) ne demande ni compte, ni e-mail, ni mot de passe", async ({ page, browser }) => {
    await vingtTroisReponses(page);
    const adresse = await adresseDeLAppareil(page);
    const champsDeCompte = "input[type=email], input[type=password], input[autocomplete=username]";
    await expect(page.locator(champsDeCompte)).toHaveCount(0);

    const nouveau = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
    await fixerLOrdre(nouveau);
    await appareilPhotoQuiFilme(nouveau, adresse);
    const autre = await nouveau.newPage();
    await fixerLeJour(autre, "2026-10-23T09:00:00+02:00");
    const pages: string[] = [];
    autre.on("framenavigated", (cadre) => cadre === autre.mainFrame() && pages.push(new URL(cadre.url()).pathname));
    await autre.goto("/appareil");
    await expect(autre.locator(champsDeCompte)).toHaveCount(0);
    await autre.getByRole("region", { name: "Récupérer mes réponses" }).getByRole("button", { name: "Scanner un QR code" }).click();
    await autre.waitForURL(/\/resultats$/);
    await expect(autre.locator(".reliab").filter({ visible: true })).toHaveText("Fiabilité : moyenne (23 réponses)");
    expect(pages.filter((p) => !["/appareil", "/i", "/resultats"].includes(p))).toEqual([]);
    await nouveau.close();
  });
});

test.describe("le pied de page mène aux pages secondaires", () => {
  const LIENS = [
    ["Toutes les questions", "/rattrapage"],
    ["Méthode de calcul", "/methode"],
    ["À propos", "/a-propos"],
    ["Journal des corrections", "/journal"],
    ["Changer d'appareil", "/appareil"],
  ];
  const pied = (page: Page) => page.getByRole("contentinfo").getByRole("navigation", { name: "Pied de page" });

  for (const adresse of ["/", "/resultats", "/a-propos", "/cette-page-n-existe-pas"]) {
    test(`en bas de ${adresse}, les cinq liens sont là, dans l'ordre`, async ({ page }) => {
      await page.goto(adresse);
      await expect(pied(page).getByRole("link")).toHaveText(LIENS.map(([nom]) => nom));
    });
  }

  test("chaque lien ouvre sa page, où il est marqué comme la page en cours", async ({ page }) => {
    await page.goto("/");
    for (const [nom, adresse] of LIENS) {
      await pied(page).getByRole("link", { name: nom }).click();
      await page.waitForURL(new RegExp(`${adresse}$`));
      await expect(pied(page).getByRole("link", { name: nom })).toHaveAttribute("aria-current", "page");
      await expect(pied(page).locator("a[aria-current]")).toHaveCount(1);
    }
  });
});

test.describe("la fiche se lit en deux étapes : le contexte, puis les propositions", () => {
  test("à l'ouverture, la fiche montre le contexte et les chiffres clés, pas encore les propositions", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    await expect(carte.getByRole("region", { name: "Le contexte" })).toBeVisible();
    await expect(carte.getByText("1,7", { exact: true })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Valider ma réponse" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Voir les propositions" })).toBeVisible();
  });

  test("« Voir les propositions » montre la question, ses options et la validation, sans le contexte", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Voir les propositions" }).click();
    await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" }).getByRole("radio")).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Valider ma réponse" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Le contexte" })).toHaveCount(0);
  });

  test("« Le contexte » ramène à la première étape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Voir les propositions" }).click();
    await page.getByRole("button", { name: "Le contexte" }).click();
    await expect(page.getByRole("region", { name: "Le contexte" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
  });
});

test("passer aux propositions repart du haut de la page", async ({ page }) => {
  await page.goto("/");
  const bouton = page.getByRole("button", { name: "Voir les propositions" });
  await bouton.scrollIntoViewIfNeeded();
  await bouton.click();
  await expect(page.getByRole("heading", { level: 1, name: "À quel âge devrait-on pouvoir partir à la retraite ?" })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("au téléphone, « Voir les propositions » est visible dès l'ouverture, sans défiler", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Voir les propositions" })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
