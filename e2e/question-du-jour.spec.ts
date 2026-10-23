import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { parse } from "yaml";

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

/** Choisir une option comme le fait l'électeur : en touchant sa carte. */
async function choisir(page: Page, libelle: string) {
  await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).click();
  await expect(page.getByRole("radio", { name: libelle })).toBeChecked();
}

test.beforeEach(async ({ page }) => {
  await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
});

test("le 23 octobre 2026, l'accueil affiche la question du jour, ses cinq options et aucun nom de candidat", async ({ page }) => {
  await page.goto("/");

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
  const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
  expect(await fond(carte.locator(".qcard-top"))).toBe(ORANGE);
  expect(await fond(page.getByRole("button", { name: "Valider ma réponse" }))).toBe(ORANGE);
});

test("une question d'Écologie & énergie s'affiche en vert, et les 11 thèmes ont 11 couleurs", async ({ page }) => {
  await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
  await page.goto("/");
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

test.describe("numéro et date de la question, sur grand écran", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("le vendredi 23 octobre 2026, le bandeau affiche « Question n° 24 · vendredi 23 octobre »", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24 · vendredi 23 octobre", { useInnerText: true });
  });

  test("la révélation affiche « Question n° 24 · 23 octobre »", async ({ page }) => {
    await page.goto("/");
    await choisir(page, "62 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveText("Question n° 24 · 23 octobre", { useInnerText: true });
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
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D", "E"]);
  const options = optionsDeLaFiche(page);
  await expect(options.nth(0)).toHaveAccessibleName("A 60 ans");
  await expect(options.nth(4)).toHaveAccessibleName("E À la carte, avec un système à points");
});

test("une fiche à trois options affiche A, B, C seulement ; une fiche à quatre, A à D", async ({ page }) => {
  await fixerLeJour(page, "2026-10-25T09:00:00+01:00");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faut-il réguler l'installation des médecins ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C"]);

  await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faut-il sortir du nucléaire ?" })).toBeVisible();
  expect(await lettresDesOptions(page)).toEqual(["A", "B", "C", "D"]);
});

test("chaque option de la question n° 24 dit, sous son titre et sans la toucher, ce qu'elle implique", async ({ page }) => {
  await page.goto("/");
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

test("sous « Choisis ta carte », la fiche prévient que les noms s'affichent après la réponse, avant et après le choix", async ({ page }) => {
  await page.goto("/");
  const titre = page.getByRole("heading", { name: "Choisis ta carte" });
  const avis = page.getByText("Les noms des candidats s'affichent après ta réponse.", { exact: true });
  const options = page.getByRole("radiogroup", { name: "Les options" });
  await expect(avis).toBeVisible();
  const [boiteTitre, boiteAvis, boiteOptions] = await Promise.all([titre.boundingBox(), avis.boundingBox(), options.boundingBox()]);
  expect(boiteAvis!.y).toBeGreaterThan(boiteTitre!.y);
  expect(boiteAvis!.y).toBeLessThan(boiteOptions!.y);

  await choisir(page, "64 ans");
  await expect(avis).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test.describe("sur ordinateur, la carte question se pose à côté des cartes réponse", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("à 1280 px, la carte question est à gauche et les cartes réponse à droite, côte à côte", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    const options = page.getByRole("radiogroup", { name: "Les options" });
    const [c, o] = await Promise.all([carte.boundingBox(), options.boundingBox()]);
    expect(c!.x + c!.width).toBeLessThanOrEqual(o!.x);
    expect(c!.y).toBeLessThan(o!.y + o!.height);
    expect(o!.y).toBeLessThan(c!.y + c!.height);
  });

  test("en défilant les cinq options, la carte question reste visible à gauche", async ({ page }) => {
    await page.goto("/");
    const carte = page.getByRole("article", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" });
    for (const libelle of ["60 ans", "62 ans", "64 ans", "65 ans ou plus", "À la carte, avec un système à points"]) {
      await page.getByRole("radiogroup", { name: "Les options" }).getByText(libelle, { exact: true }).scrollIntoViewIfNeeded();
      await expect(carte).toBeInViewport({ ratio: 0.9 });
    }
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  });
});

test.describe("sur un petit téléphone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("à 375 px, la carte question vient d'abord, puis les cartes réponse en dessous", async ({ page }) => {
    await page.goto("/");
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

const reponsesEnregistrees = (page: Page) =>
  page.evaluate(() => [...Object.keys(sessionStorage), ...Object.keys(localStorage)].filter((cle) => cle.startsWith("aucrible")));

test("sans rien choisir, « Valider ma réponse » est inactif : le toucher n'ouvre pas la révélation et n'enregistre rien", async ({ page }) => {
  await page.goto("/");
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
  await expect(bloc.getByText("2 candidats · exclus du calcul sur ce sujet", { exact: true })).toBeVisible();
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
  const ordres = new Set<string>();
  for (let appareil = 0; appareil < 16; appareil++) {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
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

test("sous les listes, la note définit « Aligné·e : même carte que toi », avec la lettre de la réponse", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByText("Aligné·e : même carte que toi (E).")).toBeVisible();
  await repondre(page, "62 ans");
  await expect(page.getByText("Aligné·e : même carte que toi (B).")).toBeVisible();
});

const proches = (page: Page) => page.getByRole("list", { name: "et proche de" });

test("après E, la révélation dit « et proche de » Bruno Retailleau (D, voisine de E)", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByRole("heading", { name: "et proche de" })).toBeVisible();
  expect(await nomsDe(proches(page))).toEqual(["Bruno Retailleau"]);
  await expect(page.getByText("Proche : carte voisine (D).")).toBeVisible();
});

test("après A, la révélation dit « et proche de » Le Pen, Tondelier et Glucksmann (B, voisine de A)", async ({ page }) => {
  await repondre(page, "60 ans");
  expect(await nomsDe(proches(page))).toEqual(["Marine Le Pen", "Marine Tondelier", "Raphaël Glucksmann"]);
  await expect(page.getByText("Proche : carte voisine (B).")).toBeVisible();
});

const opposes = (page: Page) => page.getByRole("list", { name: "opposé·e à" });

test("après E, la révélation dit « opposé·e à » Mélenchon, Roussel et Arthaud (A), avec des pions clairs", async ({ page }) => {
  await repondre(page, "À la carte, avec un système à points");
  await expect(page.getByRole("heading", { name: "opposé·e à" })).toBeVisible();
  expect(await nomsDe(opposes(page))).toEqual(["Fabien Roussel", "Jean-Luc Mélenchon", "Nathalie Arthaud"]);
  await expect(page.getByText("Opposé·e : carte la plus éloignée (A).")).toBeVisible();
  const [clair, sombre] = await Promise.all([
    opposes(page).locator(".pawn").first().evaluate((el) => getComputedStyle(el).backgroundColor),
    alignes(page).locator(".pawn").first().evaluate((el) => getComputedStyle(el).backgroundColor),
  ]);
  expect(clair).not.toBe(sombre);
});

test("après A, la révélation dit « opposé·e à » Nicolas Dupont-Aignan et Édouard Philippe (E)", async ({ page }) => {
  await repondre(page, "60 ans");
  expect(await nomsDe(opposes(page))).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
  await expect(page.getByText("Opposé·e : carte la plus éloignée (E).")).toBeVisible();
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
  /** Fermer l'app, puis la rouvrir le même jour sur le même appareil. */
  async function rouvrir(page: Page) {
    const contexte = page.context();
    await page.close();
    const rouverte = await contexte.newPage();
    await fixerLeJour(rouverte, "2026-10-23T18:00:00+02:00");
    await rouverte.goto("/");
    return rouverte;
  }

  test("après E, fermer puis rouvrir l'app le même jour ouvre la révélation, Dupont-Aignan et Philippe sous E", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    const rouverte = await rouvrir(page);
    await expect(rouverte).toHaveURL(/\/revelation$/);
    expect(await nomsSous(rouverte, "Option E : À la carte, avec un système à points")).toEqual(["Nicolas Dupont-Aignan", "Édouard Philippe"]);
    await expect(rouverte.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
  });

  test("une réponse « Je ne sais pas » est gardée de la même façon", async ({ page }) => {
    await repondre(page, "Je ne sais pas");
    const rouverte = await rouvrir(page);
    await expect(rouverte).toHaveURL(/\/revelation$/);
    await expect(blocsDOption(rouverte)).toHaveCount(5);
    await expect(rouverte.getByRole("region", { name: "Alignement sur ce sujet" })).toHaveCount(0);
  });

  test("sur un autre téléphone, la même question s'ouvre sur une fiche vierge", async ({ page, browser }) => {
    await repondre(page, "À la carte, avec un système à points");
    const autreTelephone = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" });
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

  /** Fermer l'app, puis la rouvrir tel jour sur le même appareil. */
  async function rouvrirLe(page: Page, jour: string) {
    const contexte = page.context();
    await page.close();
    const rouverte = await contexte.newPage();
    await fixerLeJour(rouverte, jour);
    await rouverte.goto("/");
    await expect(rouverte).toHaveURL(/\/revelation$/);
    return rouverte;
  }

  const pleines = (page: Page) => page.getByRole("region", { name: /^Ta réponse/ }).locator(".chips i:not(.off)");

  test("après E en ×3, fermer puis rouvrir l'app : la révélation n° 24 affiche « Importance ×3 », trois pastilles pleines", async ({ page }) => {
    await repondreLe(page, "2026-10-23T09:00:00+02:00", "À la carte, avec un système à points", "×3");
    const rouverte = await rouvrirLe(page, "2026-10-23T18:00:00+02:00");
    await expect(rouverte.getByText("Importance ×3", { exact: true })).toBeVisible();
    await expect(pleines(rouverte)).toHaveCount(3);
  });

  test("la n° 23 en ×1 et la n° 24 en ×3 gardent chacune leur importance", async ({ page }) => {
    await repondreLe(page, "2026-10-22T09:00:00+02:00", "Seulement là où la ville le demande", "×1");
    await repondreLe(page, "2026-10-23T09:00:00+02:00", "64 ans", "×3");
    let rouverte = await rouvrirLe(page, "2026-10-23T18:00:00+02:00");
    await expect(rouverte.getByText(/^Question n° 24/).filter({ visible: true })).toBeVisible();
    await expect(rouverte.getByText("Importance ×3", { exact: true })).toBeVisible();
    rouverte = await rouvrirLe(rouverte, "2026-10-22T18:00:00+02:00");
    await expect(rouverte.getByText(/^Question n° 23/).filter({ visible: true })).toBeVisible();
    await expect(rouverte.getByText("Importance ×1", { exact: true })).toBeVisible();
    await expect(pleines(rouverte)).toHaveCount(1);
  });
});

test("sous « Valider ma réponse », la fiche n° 24 dit « Tes réponses restent sur ton téléphone, sans compte. »", async ({ page }) => {
  await page.goto("/");
  const valider = page.getByRole("button", { name: "Valider ma réponse" });
  const rappel = page.getByText("Tes réponses restent sur ton téléphone, sans compte.", { exact: true });
  await expect(rappel).toBeVisible();
  const [bouton, ligne] = await Promise.all([valider.boundingBox(), rappel.boundingBox()]);
  expect(ligne!.y).toBeGreaterThan(bouton!.y + bouton!.height - 1);
});

test("rien dans l'app ne demande de créer un compte ou de se connecter, ni avant ni après la réponse", async ({ page }) => {
  const demandeDeCompte = /créer (un|ton|votre) compte|se connecter|connecte-toi|connectez-vous|s'inscrire|inscris-toi|identifiant|mot de passe|login|sign ?in/i;
  const verifier = async () => {
    const texte = await page.locator("body").innerText();
    expect(texte).not.toMatch(demandeDeCompte);
    await expect(page.locator('input[type="password"], input[type="email"], input[autocomplete="username"]')).toHaveCount(0);
  };
  await page.goto("/");
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

test.describe("quand les questions s'arrêtent, l'accueil le dit", () => {
  // Le second test publie une fiche : le premier ne doit pas tourner en même temps.
  test.describe.configure({ mode: "serial" });

  // La dernière fiche (de test) est datée du samedi 1er mai 2027.
  test("le 10 mai 2027, sans fiche ce jour-là ni après, l'accueil dit qu'il n'y a plus de nouvelle question", async ({ page }) => {
    await fixerLeJour(page, "2027-05-10T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /plus de nouvelle question/i })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
  });

  test("si l'auteur publie ensuite une nouvelle fiche, elle apparaît à l'accueil à sa date, à la place du message", async ({ page }) => {
    await fixerLeJour(page, "2027-05-11T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /plus de nouvelle question/i })).toBeVisible();

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
      await expect(page.getByRole("heading", { name: /plus de nouvelle question/i })).toHaveCount(0);
    } finally {
      rmSync(fiche);
    }
  });
});

test.describe("aucune nouvelle question ne paraît pendant le silence électoral", () => {
  // Fiches de test (e2e/fiches) datées du 14 au 18 avril, du 30 avril et du 1er mai 2027.
  const fiche = (jour: string) => `Fiche de test du ${jour} ?`;

  /** Ni à l'écran, ni dans le code des pages : la fiche n'apparaît nulle part. */
  async function nullePart(page: Page, question: string) {
    for (const adresse of ["/", "/revelation"]) {
      const html = await (await page.request.get(adresse)).text();
      expect(html.includes(question), `${adresse} contient « ${question} »`).toBe(false);
    }
    await page.goto("/");
    await expect(page.getByText(question)).toHaveCount(0);
  }

  test("le jeudi 15 avril, la fiche du 15 ; les vendredi 16 et samedi 17, aucune nouvelle question, et leurs fiches nulle part", async ({ page }) => {
    await fixerLeJour(page, "2027-04-15T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: fiche("jeudi 15 avril") })).toBeVisible();

    for (const jour of ["2027-04-16T09:00:00+02:00", "2027-04-17T09:00:00+02:00"]) {
      await fixerLeJour(page, jour);
      await page.goto("/");
      await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
      for (const question of [fiche("vendredi 16 avril"), fiche("samedi 17 avril")]) await nullePart(page, question);
    }
  });

  test("avant le 2nd tour aussi : le vendredi 30 avril et le samedi 1er mai, aucune nouvelle question", async ({ page }) => {
    for (const jour of ["2027-04-30T09:00:00+02:00", "2027-05-01T09:00:00+02:00"]) {
      await fixerLeJour(page, jour);
      await page.goto("/");
      await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
      for (const question of [fiche("vendredi 30 avril"), fiche("samedi 1er mai")]) await nullePart(page, question);
    }
  });
});

test.describe("pendant le silence électoral, l'accueil explique pourquoi", () => {
  test.beforeEach(async ({ page }) => {
    await fixerLeJour(page, "2027-04-17T09:00:00+02:00");
    await page.goto("/");
  });

  test("le samedi 17 avril 2027, la carte face cachée « J-1 avant le 1er tour · dimanche 18 avril 2027 » remplace la question", async ({ page }) => {
    const carte = page.locator(".qcard.back");
    await expect(carte).toBeVisible();
    await expect(carte.getByText(/^J\s*-\s*1$/)).toBeVisible();
    await expect(carte.getByText("avant le 1er tour", { exact: true })).toBeVisible();
    await expect(carte.getByText("dimanche 18 avril 2027", { exact: true })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toHaveCount(0);
  });

  test("l'accueil titre « Silence électoral. » et explique que la loi interdit toute publication la veille et le jour du vote", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Silence électoral." })).toBeVisible();
    await expect(page.getByText(/La loi interdit toute nouvelle publication la veille et le jour du vote\./)).toBeVisible();
  });
});

// Fiches du 22 au 28 octobre 2026 : celles de démonstration, puis celles de test (e2e/fiches).
const SIX_JOURS = ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"];

/** Répondre à la question du jour, ce jour-là, sans effacer les réponses déjà données. */
async function repondreCeJour(page: Page, jour: string, libelle?: string) {
  await fixerLeJour(page, jour.length > 10 ? jour : `${jour}T09:00:00+02:00`);
  await page.goto("/");
  const options = page.getByRole("radiogroup", { name: "Les options" });
  await (libelle ? options.getByText(libelle, { exact: true }) : options.locator("label").first()).click();
  await page.getByRole("button", { name: "Valider ma réponse" }).click();
  await expect(page).toHaveURL(/\/revelation$/);
}

/** La série affichée dans l'en-tête. */
const serie = (page: Page) => page.getByRole("banner").getByText(/^\d+ jours? d'affilée$/);

test.describe("le dé affiche les jours d'affilée", () => {
  const JOURS = SIX_JOURS;

  test("après six jours de suite, l'en-tête de l'accueil du septième jour, avant de répondre, affiche « 6 jours d'affilée »", async ({ page }) => {
    for (const jour of JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(serie(page)).toHaveText("6 jours d'affilée");
  });

  test("le dé et ce nombre sont aussi dans l'en-tête de la fiche et de la révélation", async ({ page }) => {
    for (const jour of JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await expect(page.getByRole("banner").locator(".die")).toBeVisible();
    await expect(serie(page)).toBeVisible();
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(page.getByRole("banner").locator(".die")).toBeVisible();
    await expect(serie(page)).toBeVisible();
  });
});

test.describe("répondre à la question du jour ajoute un jour à la série", () => {
  test("avec 6 jours, valider la réponse du jour passe l'en-tête à 7 et la révélation dit « Ta série continue »", async ({ page }) => {
    for (const jour of SIX_JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await expect(serie(page)).toHaveText("6 jours d'affilée");
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    const carte = page.getByRole("region", { name: "Ta série" });
    await expect(carte.getByText("Ta série continue", { exact: true })).toBeVisible();
    await expect(carte.getByText("Série : 7 jours d'affilée")).toBeVisible();
    await expect(carte.getByText("Reviens demain pour la garder.", { exact: true })).toBeVisible();
    await expect(carte.getByRole("img", { name: "7 jours sur 7" })).toBeVisible();
  });

  test("rouvrir la révélation le même jour, ou changer de page et revenir, laisse 7 jours : un jour de plus par jour", async ({ page }) => {
    for (const jour of [...SIX_JOURS, "2026-10-28T09:00:00+01:00"]) await repondreCeJour(page, jour);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    await page.reload();
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    await page.goto("/");
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    await expect(page.getByRole("region", { name: "Ta série" }).getByText("Série : 7 jours d'affilée")).toBeVisible();
  });
});

test.describe("un jour sans réponse remet la série à zéro", () => {
  const JUSQUAU_22 = ["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"];

  test("avec 6 jours au soir du jeudi 22 octobre, sans réponse le vendredi 23, le samedi 24 l'en-tête n'affiche plus « 6 jours »", async ({ page }) => {
    for (const jour of JUSQUAU_22) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-22T21:00:00+02:00");
    await page.goto("/revelation");
    await expect(serie(page)).toHaveText("6 jours d'affilée");
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(page.getByRole("banner").getByText("6 jours d'affilée")).toHaveCount(0);
  });

  test("répondre alors à la question du samedi 24 donne « 1 jour d'affilée » : la série repart de 1", async ({ page }) => {
    for (const jour of JUSQUAU_22) await repondreCeJour(page, jour);
    await repondreCeJour(page, "2026-10-24");
    await expect(serie(page)).toHaveText("1 jour d'affilée");
  });
});

test.describe("« Je ne sais pas » ne casse pas la série", () => {
  test("avec 6 jours, répondre « Je ne sais pas » laisse au moins 6 jours d'affilée", async ({ page }) => {
    for (const jour of SIX_JOURS) await repondreCeJour(page, jour);
    await repondreCeJour(page, "2026-10-28T09:00:00+01:00", "Je ne sais pas");
    const jours = Number((await serie(page).innerText()).match(/^\d+/)![0]);
    expect(jours).toBeGreaterThanOrEqual(6);
  });

  test("le lendemain, répondre à la question suivante prolonge la série au lieu de la relancer à 1", async ({ page }) => {
    for (const jour of ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]) await repondreCeJour(page, jour);
    await repondreCeJour(page, "2026-10-27", "Je ne sais pas");
    await repondreCeJour(page, "2026-10-28T09:00:00+01:00");
    const jours = Number((await serie(page).innerText()).match(/^\d+/)![0]);
    expect(jours).toBeGreaterThan(1);
    expect(jours).toBeGreaterThanOrEqual(6);
  });
});

test.describe("le silence électoral met la série en pause", () => {
  /**
   * 37 jours d'affilée, du mardi 9 mars au mercredi 14 avril 2027, posés directement sur l'appareil :
   * il n'y a pas de fiche de test pour chacun de ces jours.
   */
  async function trenteSeptJoursJusquau14Avril(page: Page) {
    await page.goto("/");
    await page.evaluate(() => {
      const reponses: Record<number, object> = {};
      for (let i = 0; i < 37; i++) {
        const jour = new Date(Date.UTC(2027, 2, 9 + i, 12)).toISOString().slice(0, 10);
        reponses[900 + i] = { option: "A", importance: null, graine: 1, jour, duJour: true };
      }
      localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
    });
  }

  test("avec 38 jours au jeudi 15 avril 2027, le samedi 17 l'en-tête affiche toujours « 38 jours d'affilée » et l'accueil dit que la série est en pause", async ({ page }) => {
    await trenteSeptJoursJusquau14Avril(page);
    await repondreCeJour(page, "2027-04-15");
    await expect(serie(page)).toHaveText("38 jours d'affilée");
    await fixerLeJour(page, "2027-04-17T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Silence électoral." })).toBeVisible();
    await expect(serie(page)).toHaveText("38 jours d'affilée");
    await expect(page.getByText("Ta série de 38 jours est en pause, elle n'est pas perdue.", { exact: true })).toBeVisible();
  });

  test("à la première question publiée après le silence, le lundi 19 avril, répondre fait passer la série à « 39 jours d'affilée »", async ({ page }) => {
    await trenteSeptJoursJusquau14Avril(page);
    await repondreCeJour(page, "2027-04-15");
    await repondreCeJour(page, "2027-04-19");
    await expect(serie(page)).toHaveText("39 jours d'affilée");
  });
});

test.describe("sans aucune réponse, le dé n'affiche pas de série", () => {
  /** Ni « 0 jour », ni un nombre de jours d'affilée. */
  const uneSerie = (page: Page) => page.getByRole("banner").getByText(/\bjours?\b|affilée/);

  test("sur un appareil neuf, avant la moindre réponse, l'en-tête n'affiche pas de série", async ({ page }) => {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(page.getByRole("banner")).toBeAttached();
    await expect(uneSerie(page)).toHaveCount(0);
  });

  test("le lendemain, toujours sans aucune réponse, l'en-tête n'affiche toujours pas de série", async ({ page }) => {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await fixerLeJour(page, "2026-10-24T09:00:00+02:00");
    await page.goto("/");
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
    await expect(page.getByRole("banner")).toBeAttached();
    await expect(uneSerie(page)).toHaveCount(0);
  });
});

test.describe("le dé roule quand la série augmente", () => {
  /** Les animations en cours sur le dé de l'en-tête, par nom. */
  const animationsDuDe = (page: Page) =>
    page
      .getByRole("banner")
      .locator(".die")
      .evaluate((de) => de.getAnimations().map((animation) => (animation as CSSAnimation).animationName));

  async function validerLaReponseDuJour(page: Page) {
    await page.getByRole("radiogroup", { name: "Les options" }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
  }

  test("en validant la réponse du jour avec « 6 jours d'affilée », le dé de l'en-tête roule à l'arrivée sur la révélation puis affiche « 7 jours d'affilée »", async ({ page }) => {
    for (const jour of SIX_JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await expect(serie(page)).toHaveText("6 jours d'affilée");
    expect(await animationsDuDe(page)).toEqual([]);
    await validerLaReponseDuJour(page);
    expect(await animationsDuDe(page)).toEqual(["roll"]);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
  });

  test("en rouvrant la même révélation plus tard, ou en ouvrant une autre page, le dé ne roule pas", async ({ page }) => {
    for (const jour of [...SIX_JOURS, "2026-10-28T09:00:00+01:00"]) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T18:00:00+01:00");
    await page.goto("/revelation");
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    expect(await animationsDuDe(page)).toEqual([]);
    // L'accueil, qui rouvre la révélation de la question déjà répondue.
    await page.goto("/");
    await expect(page).toHaveURL(/\/revelation$/);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
    expect(await animationsDuDe(page)).toEqual([]);
  });

  test("avec « réduire les animations », le dé ne roule pas mais affiche quand même « 7 jours d'affilée »", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const jour of SIX_JOURS) await repondreCeJour(page, jour);
    await fixerLeJour(page, "2026-10-28T09:00:00+01:00");
    await page.goto("/");
    await validerLaReponseDuJour(page);
    expect(await animationsDuDe(page)).toEqual([]);
    await expect(serie(page)).toHaveText("7 jours d'affilée");
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
    await expect(page.getByRole("heading", { level: 1, name: "Rattraper les questions." })).toBeVisible();
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
  // Sur ordinateur, le bandeau donne la date de la fiche à côté de son numéro.
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  async function ouvrirDepuisLaListe(page: Page, question: string) {
    await fixerLeJour(page, "2026-10-23T09:00:00+02:00");
    await page.goto("/rattrapage");
    await page
      .getByRole("region", { name: "Toutes les questions" })
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: question, exact: true }) })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: question })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Les options" })).toBeVisible();
  }

  test("toucher la carte n° 9 « Faut-il rétablir l'ISF ? » ouvre la fiche de la question n° 9, datée du 8 octobre, et non celle de la question du jour n° 24", async ({ page }) => {
    await ouvrirDepuisLaListe(page, "Faut-il rétablir l'ISF ?");
    await expect(page.getByText(/^Question n° 9/).filter({ visible: true })).toHaveText("Question n° 9 · jeudi 8 octobre", { useInnerText: true });
    await expect(page.getByText(/^Question n° 24/).filter({ visible: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "À quel âge devrait-on pouvoir partir à la retraite ?" }).filter({ visible: true })).toHaveCount(0);
  });

  test("toucher la carte n° 6 « Faut-il fixer chaque année des quotas d'immigration ? » ouvre la fiche de la question n° 6, datée du 5 octobre", async ({ page }) => {
    await ouvrirDepuisLaListe(page, "Faut-il fixer chaque année des quotas d'immigration ?");
    await expect(page.getByText(/^Question n° 6/).filter({ visible: true })).toHaveText("Question n° 6 · lundi 5 octobre", { useInnerText: true });
  });
});

test.describe("la révélation mène au rattrapage", () => {
  const rattraper = (page: Page) => page.getByRole("link", { name: "Rattraper d'autres questions" }).filter({ visible: true });

  test("sur la révélation de la question n° 24 (réponse E validée), toucher « Rattraper d'autres questions » ouvre la page « Rattraper les questions »", async ({ page }) => {
    await repondre(page, "À la carte, avec un système à points");
    await rattraper(page).click();
    await expect(page).toHaveURL(/\/rattrapage$/);
    await expect(page.getByRole("heading", { level: 1, name: "Rattraper les questions." })).toBeVisible();
  });

  test("le même bouton est sur la révélation de la n° 9 « Faut-il rétablir l'ISF ? », répondue depuis la liste, et ramène à la liste", async ({ page }) => {
    await page.goto("/rattrapage");
    await page.getByRole("link", { name: /Faut-il rétablir l'ISF/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Faut-il rétablir l'ISF ?" })).toBeVisible();
    await page.getByRole("radiogroup", { name: "Les options" }).filter({ visible: true }).locator("label").first().click();
    await page.getByRole("button", { name: "Valider ma réponse" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/question\/9\/revelation$/);
    await expect(page.getByRole("heading", { level: 1, name: "La révélation" }).filter({ visible: true })).toBeVisible();
    await rattraper(page).click();
    await expect(page).toHaveURL(/\/rattrapage$/);
    await expect(page.getByRole("heading", { level: 1, name: "Rattraper les questions." }).filter({ visible: true })).toBeVisible();
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

test.describe("la liste affiche le nombre de questions à rattraper", () => {
  const tuile = (page: Page) => page.getByRole("group", { name: "À rattraper" });
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

  test("avec 24 questions publiées dont 14 répondues, la tuile affiche « 10 questions à rattraper » et « 14 répondues sur 24 publiées »", async ({ page }) => {
    await quatorzeReponses(page);
    await page.goto("/rattrapage");
    await expect(tuile(page)).toContainText("10 questions à rattraper");
    await expect(tuile(page)).toContainText("14 répondues sur 24 publiées");
    await expect(tuile(page).getByRole("img", { name: "14 questions répondues sur 24 publiées" })).toBeVisible();
    expect(await remplissage(page)).toBeCloseTo(14 / 24, 2);
  });

  test("après avoir répondu à la question n° 24, la tuile affiche « 9 questions à rattraper » et « 15 répondues sur 24 publiées », et la barre avance d'un cran", async ({ page }) => {
    await quatorzeReponses(page);
    await repondreCeJour(page, "2026-10-23");
    await page.goto("/rattrapage");
    await expect(tuile(page)).toContainText("9 questions à rattraper");
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
    await page.getByRole("link", { name: "Mes résultats" }).click();
    await expect(page).toHaveURL(/\/resultats$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mes résultats." })).toBeVisible();
  });

  test("sur cette page, le lien « Question du jour » en haut ramène à la fiche de la question n° 24", async ({ page }) => {
    await page.goto("/resultats");
    await page.getByRole("link", { name: "Question du jour", exact: true }).click();
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

  test("sur la révélation de la question n° 24, la phrase sous le bouton dit « Ton classement est recalculé avec cette 24e réponse. » et « Voir mes résultats » ouvre « Mes résultats »", async ({ page }) => {
    await vingtTroisReponses(page);
    await repondreEALaQuestionDuJour(page);
    await expect(page.getByText("Ton classement est recalculé avec cette 24e réponse.").filter({ visible: true })).toBeVisible();
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

  test("sous le classement, la note dit que les réponses sont « pondérées par l'importance que tu leur donnes »", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/resultats");
    await expect(page.getByRole("region", { name: "Ton classement" }).getByText("Calculé sur tes 23 réponses, pondérées par l'importance que tu leur donnes.")).toBeVisible();
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
    await pied.getByRole("link", { name: "Retour à la question du jour" }).click();
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

test.describe("avant 10 réponses, le plateau dit que la position s'affinera", () => {
  const plateauDeLaPage = (page: Page) => page.getByRole("region", { name: "Ton plateau" });

  test("avec 3 réponses, le plateau montre un pion « TOI » estompé et le texte « Ta position s'affinera avec tes réponses »", async ({ page }) => {
    await premieresReponses(page, 3);
    await page.goto("/resultats");
    await expect(plateauDeLaPage(page).getByText("Ta position s'affinera avec tes réponses")).toBeVisible();
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
  const enJeu = (page: Page) => page.getByRole("link", { name: /En jeu aujourd'hui/ });

  test("sur la fiche n° 24, avec 2 réponses en Travail & retraites et 5 parts gagnées, le bloc annonce la part en jeu et les 6 parts sur 11", async ({ page }) => {
    await vingtTroisReponses(page);
    await page.goto("/");
    await expect(enJeu(page)).toBeVisible();
    await expect(enJeu(page).getByText("En jeu aujourd'hui", { exact: true })).toBeVisible();
    await expect(enJeu(page).getByText("La part Travail & retraites", { exact: true })).toBeVisible();
    await expect(enJeu(page).getByText("Tu as 2 réponses sur 3 dans ce thème. Réponds et ton camembert passe à 6 parts sur 11.")).toBeVisible();
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

/**
 * Les 23 réponses de `vingtTroisReponses`, mais les n° 18 à 23 données chacune le jour de leur parution
 * (du 17 au 22 octobre), comme questions du jour : 6 jours d'affilée au 23 octobre.
 */
async function vingtTroisReponsesEtSixJours(page: Page) {
  await vingtTroisReponses(page);
  await page.evaluate(() => {
    const reponses = JSON.parse(localStorage.getItem("aucrible:reponses")!);
    for (let numero = 18; numero <= 23; numero++) {
      const jour = new Date(Date.UTC(2026, 9, numero - 1, 12)).toISOString().slice(0, 10);
      reponses[numero] = { ...reponses[numero], jour, duJour: true };
    }
    localStorage.setItem("aucrible:reponses", JSON.stringify(reponses));
  });
}

test.describe("la carte affiche réponses, thèmes et série", () => {
  const piedDeLaCarte = (page: Page) => page.getByRole("article", { name: /Carte à partager/ }).filter({ visible: true }).locator(".sc-f");

  test("avec 23 réponses, 5 parts gagnées et 6 jours de série, la carte affiche « 23 réponses · 5/11 thèmes · 6 jours d'affilée »", async ({ page }) => {
    await vingtTroisReponsesEtSixJours(page);
    await page.goto("/carte");
    await expect(piedDeLaCarte(page)).toHaveText("23 réponses · 5/11 thèmes · 6 jours d'affilée");
  });

  test("après la réponse à la n° 24, la carte affiche « 24 réponses · 6/11 thèmes · 7 jours d'affilée »", async ({ page }) => {
    await vingtTroisReponsesEtSixJours(page);
    await page.goto("/");
    await choisir(page, "64 ans");
    await page.getByRole("button", { name: "Valider ma réponse" }).click();
    await expect(page).toHaveURL(/\/revelation$/);
    await page.goto("/carte");
    await expect(piedDeLaCarte(page)).toHaveText("24 réponses · 6/11 thèmes · 7 jours d'affilée");
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
  /** 3 réponses : les n° 1 et 2 en rattrapage, la n° 23 comme question du jour du 22 octobre (1 jour d'affilée). */
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
    await expect(apercu.locator(".story-f")).toHaveText("3 réponses · 0/11 parts · 1 jour d'affilée");
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

  /** La ligne dit « ? », « Position inconnue — pas de source à ce jour » et pourquoi elle ne compte pas, sans badge. */
  async function attendreUnePositionInconnue(ligne: Locator) {
    await expect(ligne.locator(".pos-letter")).toHaveText("?");
    await expect(ligne.locator(".pos-title")).toHaveText("Position inconnue — pas de source à ce jour");
    await expect(ligne.locator(".pos-src")).toHaveText("Elle ne compte pas dans ta proximité tant qu'on n'a rien de sûr.");
    await expect(ligne.locator(".badge")).toHaveCount(0);
  }

  test("sur la fiche de Marine Tondelier, Q17 affiche « ? », « Position inconnue — pas de source à ce jour » et sa note, sans badge", async ({ page }) => {
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

  test("pour l'électeur de la maquette (23 réponses), la fiche de Marine Tondelier affiche « Ta proximité : 71 % » et « 3e sur 13, d'après tes 23 réponses »", async ({ page }) => {
    await vingtTroisReponses(page);
    const [ligne, note] = await proximiteSurLaFiche(page, "tondelier");
    expect(ligne).toBe("Ta proximité : 71 %");
    expect(note).toBe("3e sur 13, d'après tes 23 réponses. Les positions inconnues ne comptent pas.");
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
      expect(note).toMatch(new RegExp(`^${rang}(er|e) sur 13, d'après tes 23 réponses\\.`));
    }
    const [ligne, note] = await proximiteSurLaFiche(page, "ruffin");
    expect([ligne, note.split(",")[0]]).toEqual(["Ta proximité : 81 %", "1er sur 13"]);
  });
});

test.describe("la fiche explique les deux badges", () => {
  test("la fiche contient « Comment lire une position » avec ses trois lignes (officielle, déduite, inconnue) et leurs phrases d'explication", async ({ page }) => {
    await positionsDeTondelier(page);
    const legende = page.getByRole("group", { name: "Comment lire une position" });
    const lignes = legende.getByRole("listitem");
    await expect(lignes).toHaveCount(3);
    // Le « ? » du badge inconnu est décoratif (caché aux lecteurs d'écran), mais il fait partie du texte.
    await expect(lignes.locator(".badge")).toHaveText(["position officielle", "position déduite", "?position inconnue"]);
    await expect(lignes.locator(".badge--unk [aria-hidden=true]")).toHaveText("?");
    await expect(lignes.locator(".badge + span")).toHaveText([
      "Marine Tondelier l'a dit ou écrit en personne : programme 2027, déclaration datée.",
      "Tirée d'un vote de son groupe ou du programme de son parti.",
      "Pas de source : on ne devine jamais.",
    ]);
  });

  test("le lien « Voir la méthode et les sources » est affiché sous ces trois lignes", async ({ page }) => {
    await positionsDeTondelier(page);
    const legende = page.getByRole("group", { name: "Comment lire une position" });
    const lien = legende.getByRole("link", { name: "Voir la méthode et les sources" });
    await expect(lien).toBeVisible();
    await expect(lien).toHaveAttribute("href", "/methode");
    const [liste, sousLaListe] = await Promise.all([legende.getByRole("list").boundingBox(), lien.boundingBox()]);
    expect(sousLaListe!.y).toBeGreaterThanOrEqual(liste!.y + liste!.height - 1);
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

  test("cette révélation range les 12 autres candidats comme avant et annonce 12 candidats au lieu de 13", async ({ page }) => {
    const avant = await revelationApresLeRetrait(page, false);
    expect(avant.blocs.flatMap(([, noms]) => noms)).toContain("Marine Tondelier");
    await expect(avant.qui.locator(".rev-note")).toHaveText(/^13 candidats : \d+ positions? sourcées?, \d+ sans source à ce jour\. Touche un nom pour sa fiche\.$/);
    const apres = await revelationApresLeRetrait(page, true);
    const sansElle = avant.blocs
      .map(([titre, noms]) => [titre, (noms as string[]).filter((n) => n !== "Marine Tondelier")])
      .filter(([titre, noms]) => noms.length > 0 || !String(titre).includes("Position inconnue"));
    expect(apres.blocs).toEqual(sansElle);
    await expect(apres.qui.locator(".rev-note")).toHaveText(/^12 candidats : /);
    const nombres = (await apres.qui.locator(".rev-note").textContent())!.match(/(\d+) positions? sourcées?, (\d+) sans source/)!;
    expect(Number(nombres[1]) + Number(nombres[2])).toBe(12);
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
    await expect(page.getByText("This page could not be found.")).toBeVisible();
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
  const regle7 = (page: Page) => page.getByRole("article", { name: "Qui est dans le jeu : 13 candidats" });

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
    page.getByRole("article", { name: "Qui est dans le jeu : 13 candidats" }).locator(".tl li").filter({ has: page.locator(".when", { hasText: quand }) });

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
    const frise = page.getByRole("article", { name: "Qui est dans le jeu : 13 candidats" }).locator(".tl li");
    await expect(frise.locator(".when")).toHaveText(["Le 1er de chaque mois", "Vers le 16 mars 2027", "En cas de retrait", "En cas de remplacement dans le même parti"]);
    await expect(frise.nth(1).locator(".what")).toHaveText(
      "Le Conseil constitutionnel publie la liste officielle. La nôtre bascule alors exactement sur les candidats officiels.",
    );
  });
});

test.describe("la page Méthode explique pourquoi ce n'est pas un sondage", () => {
  const regle8 = (page: Page) => page.getByRole("article", { name: "Ce que ce jeu n'est pas, et comment le vérifier" });

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
