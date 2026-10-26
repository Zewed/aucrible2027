# Au crible 2027 — cadrage produit

Web app ludique et neutre pour savoir où l'on se situe politiquement et de quel·le candidat·e on est le plus proche à la présidentielle 2027 (1er tour 18 avril, 2nd tour 2 mai 2027), à travers une question approfondie par jour, avec de vrais chiffres.

Nom : **Au crible 2027** — domaine `aucrible2027.fr`, comptes `@aucrible2027` partout (Insta, TikTok, Facebook, YouTube).

## Principes non négociables

- **Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement.
- **Meilleur argument de chaque camp.** Chaque option est présentée avec l'argument que ses propres défenseurs signeraient. Jamais d'ironie, de mépris ni de « en réalité… ». Un électeur RN doit se sentir aussi respecté qu'un électeur LFI.
- **On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9). *Amendé le 25/10/2026 : l'électeur peut partager ses réponses, anonymement, s'il coche une case décochée par défaut ; sans adresse IP ni identifiant, seulement les réponses et leur jour, pour des totaux dans /admin.*
- **Pas un sondage.** Aucune statistique agrégée sur les utilisateurs, rien n'est jamais présenté comme un sondage ; la mention « Ce n'est pas un sondage » accompagne les résultats.
- **Aucun candidat codé par la couleur de son parti** (contrainte de DA).

## Projet

- Side project perso, non lucratif, sans pub. Auteur affiché publiquement.
- Page « À propos » honnête : relu par l'auteur + contrôle automatique de neutralité par IA + journal public des corrections. Ne jamais prétendre à une relecture externe.
- Cible : tout public, tous âges. Pour les jeunes, l'angle est « pas convaincus par la politique classique », pas « peu politisés ». Mobile d'abord.

## Boucle principale

**Décision du 25/10/2026 (remplace « une question par jour ») :**

- **Toutes les questions sont jouables d'un coup**, dès l'ouverture : plus de question du jour ni de parution au jour le jour dans l'app.
- L'électeur enchaîne : **réponse, révélation, « Question suivante »**.
- Les questions viennent dans un **ordre tiré au hasard pour chaque électeur**, gardé sur son appareil.
- **Paliers** : toutes les 5 réponses, une étape « gagnée » (à 10, le classement se débloque) ; et chaque part du camembert gagnée (3 réponses dans un thème) est une petite victoire. Sur la révélation de la 5e, 10e, 15e… réponse : le nombre, une phrase courte (« Encore 5 pour ton classement. », « Ton classement est prêt. », « Ton classement s'affine. ») et des confettis aux couleurs des thèmes ; sur ordinateur, le bas du menu compte les réponses et ses crans vers le prochain palier.
- **Plus de série de jours d'affilée**, nulle part.
- La liste de toutes les questions reste là pour en choisir une.

Avant cette décision :

- ~~**Une nouvelle question par jour, 7j/7.** Pas de mode express séparé.~~
- ~~On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses.~~
- Lancement quand la v1 est prête **et** que 14 fiches d'avance sont écrites. Pas de date fixe.
- Pas de phase de fin planifiée : on arrête quand on arrête.
- **Silence électoral (légal) :** rien de nouveau publié (app et réseaux) à partir du vendredi 0h avant chaque tour (16 avril et 30 avril 2027), par prudence car l'outre-mer vote le samedi. Depuis le 25/10/2026, l'app ne publie plus au jour le jour : la règle vaut pour une fiche ajoutée pendant le silence, et pour les réseaux.

## Une fiche

Lecture en 3 minutes maximum.

1. **La question** — ex. « À quel âge devrait-on pouvoir partir à la retraite ? »
2. **Le contexte** en 3 phrases.
3. **2 à 4 chiffres clés**, chacun avec source et date (INSEE, Cour des comptes, COR, DREES, Eurostat…).
4. **3 à 5 options concrètes et chiffrées**, présentées **sans nom de candidat**. Pour chacune : ce que ça implique, ce qu'en disent ses défenseurs, ce que lui reprochent ses critiques.
5. **Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3).
6. **Révélation** : qui défend quelle option (avec sources et badge « position déduite » ou « position officielle »), alignement sur cette question, classement mis à jour.
7. **Pour aller plus loin** : 2–3 liens.

Bouton « Signaler une erreur » sur chaque fiche.

## Thèmes (11, en rotation)

Économie & impôts · Travail & retraites · Écologie & énergie · Immigration · Sécurité & justice · Santé · Éducation & jeunesse · Logement · Europe & international · Institutions & démocratie · Société (laïcité, fin de vie…).

- Environ 150 sujets listés en amont (~13 par thème).
- Critères d'un sujet : les candidats ne sont pas d'accord, c'est chiffrable, c'est concret.
- ~~Publication en rotation des thèmes (jamais trois jours de suite sur le même), les sujets les plus départageants d'abord.~~ Depuis le 25/10/2026, l'ordre est tiré au hasard pour chaque électeur ; la rotation ne vaut plus que pour les réseaux.

## Résultats

- **Après chaque réponse** : « sur ce sujet tu es aligné·e avec X, Y ; opposé·e à Z ».
- **À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :
  - Économie : plus de redistribution ↔ plus de marché
  - Société : progressiste ↔ conservateur
- **À partir de 3 réponses dans un thème** : détail par thème (« sur l'écologie tu es proche de A, sur l'économie de B »).
- **Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes.

## Ludique

- ~~Série (jours d'affilée).~~ Supprimée le 25/10/2026.
- **Paliers** : une étape gagnée toutes les 5 réponses, et une petite victoire à chaque part du camembert.
- Progression par thème (« 4 thèmes explorés sur 11 »).
- **Carte de résultat partageable** au format story (« Je suis à 74 % proche de X, et toi ? »). C'est le principal moteur de croissance, puisque la pub est impossible.
- Pas de classement entre utilisateurs, pas de badges gadgets.

## Méthode de calcul (publiée)

- **Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3).
- **Positions inconnues** : exclues du calcul pour ce candidat.
- **Score global** : % du maximum possible.
- **Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats.

## Sources des positions des candidats

Ordre de priorité :

1. Programme officiel 2027
2. Déclaration publique du candidat (datée, moins de 12 mois)
3. Votes de son groupe à l'Assemblée nationale ou au Parlement européen
4. Programme 2022 du parti

Sans source : position « inconnue », exclue du calcul. On ne devine jamais. On ne sollicite pas les équipes de campagne.

## Candidats

**Règle d'entrée** (au moins un critère) :

- le parti du candidat **dirige** un groupe à l'Assemblée nationale ou au Parlement européen ;
- moyenne ≥ 2,0 % sur tous les sondages des 30 derniers jours (pour chaque sondage, moyenne des scénarios où le candidat est testé) ;
- le parti du candidat a obtenu les 500 parrainages en 2022 (le parti lui-même, pas ses scissions).

**Mise à jour** :

- Recalcul le 1er de chaque mois. Un candidat entré reste jusqu'à son retrait.
- À la publication de la liste officielle du Conseil constitutionnel (~16 mars 2027), bascule exacte sur les candidats officiels.
- **Retrait** : sortie du classement avec la mention « X s'est retiré·e le JJ/MM et soutient Y ».
- **Remplacement dans le même parti** (ex. Bardella pour Le Pen) : fiche renommée, positions du parti gardées en « déduite » puis recodées au fil des déclarations.

**Liste au lancement (au 23/10/2026)** — 13 candidats :

- Le Pen (RN)
- Mélenchon (LFI)
- Philippe (Horizons)
- Glucksmann (Place publique / PS)
- Retailleau (LR)
- Lisnard (Nouvelle Énergie)
- Attal (Renaissance)
- Zemmour (Reconquête)
- Tondelier (Les Écologistes, vote des adhérents 10–13 déc.)
- Roussel (PCF)
- Dupont-Aignan (DLF)
- Ruffin (Debout!)
- Arthaud (LO)

Lassalle entre automatiquement s'il se déclare.

Photos des candidats : portraits officiels sous licence libre uniquement.

## Production du contenu

- **Chaque question part d'une étude des enjeux** (`docs/etudes/NNN-*.md`, sur le modèle de `docs/etudes/MODELE.md`). Elle couvre tous les angles du sujet, avec des chiffres officiels sourcés, le meilleur argument de chaque camp, et ce qui fait consensus ou débat. La fiche et son reportage vidéo ne disent rien qui ne soit dans l'étude.

- L'IA rédige un premier jet à partir de sources officielles.
- L'auteur vérifie chaque chiffre et chaque position de candidat.
- **Contrôle automatique de neutralité par IA** avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte.
- Toujours 14 fiches d'avance.
- Contenu stocké en fichiers structurés (MDX/YAML) dans le repo Git : l'historique Git sert de base au journal des corrections.

## Corrections

- « Signaler une erreur » arrive dans une boîte privée (pas publique, pour éviter les raids).
- Réponse sous 72 h.
- Page publique **« Journal des corrections »** : date, fiche, avant/après, raison.

## Données

- Aucun compte. Réponses stockées localement dans le navigateur.
- Changement d'appareil par export/import (QR code ou lien).
- Statistiques de visite anonymes, sans les réponses.
- Pas de notifications en v1.

## Réseaux sociaux

- Chaque jour, depuis la même fiche :
  - un **carrousel** (enjeu, 2–3 chiffres, argument pour, argument contre, « réponds sur l'app ») ;
  - une **story** avec sondage « Et toi ? » ;
  - une **vidéo verticale** de 45–90 s.
- Vidéos générées avec **Remotion** : texte animé, compteurs, graphiques, musique libre de droits, **sans voix**, lisibles sans le son. Les chiffres affichés viennent de la fiche vérifiée, jamais d'une IA générative vidéo.
- **Lignes rouges IA** : jamais de visage ni de voix de personnes réelles générés par IA. Mention « Animation générée avec IA, contenu vérifié par un humain ».
- Plateformes : Instagram, Facebook, TikTok, YouTube Shorts. Croissance organique uniquement : la publicité politique est interdite (L52-1) et Meta ne diffuse plus de pub « sujets de société » dans l'UE.
- Publication : gérée par l'auteur, hors périmètre technique.

## Technique

- Next.js (App Router) sur Vercel.
- Contenu en MDX/YAML dans le repo.
- Visuels des carrousels générés avec `@vercel/og`.
- Vidéos générées avec Remotion.
- Stockage local côté navigateur.
- Code open source sur GitHub.

## Règles validées sur les maquettes (23/10/2026)

- ~~**Silence électoral** : la série de jours d'affilée est mise en pause, pas perdue.~~ (la série n'existe plus)
- **Badges** : « position officielle » = programme 2027 ou déclaration du candidat ; « position déduite » = votes de son groupe ou programme 2022.
- **Face-à-face** : il ne montre que les questions auxquelles l'électeur a déjà répondu, pour ne rien révéler avant sa réponse.
- **Carte partageable** : l'électeur choisit de montrer son candidat le plus proche ou seulement son pion.

## Décisions de l'auteur du 25/10/2026

- **Signalements** : ils arrivent dans **/admin**, une partie privée du site, gardés dans une base **Postgres** (site sur **Vercel**).
- **/admin** : on y entre avec **son compte GitHub** ; seuls les comptes autorisés (celui de l'auteur, Zewed) passent. On y trouve les signalements, les outils de l'auteur (refus d'une fiche dont un chiffre ou une position n'a pas de source, fiches d'avance, correction d'une fiche publiée, contrôle de neutralité), et les totaux des réponses partagées.
- **Corriger une fiche** depuis /admin fait **un commit sur GitHub**, avec la raison : le contenu reste en YAML dans le dépôt, et l'historique Git nourrit le journal.
- **Contrôle de neutralité** : avec Claude (API Anthropic) ; **conseillé, pas obligatoire** pour publier.
- **Vidéo** : Remotion (licence gratuite, structure de 3 personnes au plus), rendue par une commande locale, avec une musique libre de droits fournie par l'auteur.
- **Code public** : github.com/Zewed/aucrible2027.
- **Changer d'appareil** : les réponses voyagent après le `#` du lien et dans le QR code, jamais vers un serveur ; le lien prend l'adresse où le site tourne (le domaine n'est pas encore choisi).
- **Partage des réponses** : seulement avec accord explicite (voir « Principes »).
- **Carrousel et story** : l'auteur écrit dans la fiche les deux côtés de l'image 5 (titre et meilleur argument de chacun) et les deux choix de l'autocollant « Et toi ? ».
- **Pouvoir de départage** : abandonné (l'ordre est tiré au hasard).
- **Fiabilité du classement** : faible de 10 à 19 réponses, moyenne de 20 à 29, forte à partir de 30.
- **Plateau** : au téléphone, des pions qui se recouvrent s'écartent juste assez pour rester lisibles ; un candidat sans aucune note n'a pas de pion.
- **Camembert complet** (11/11) : un palier spécial sur la révélation, avec confettis.
- **Navigation privée** : pas d'avertissement.
- **Dates des fiches** : une fiche se joue à partir de sa date ; l'auteur la date du jour où il l'ajoute.
- **Face-à-face** depuis une fiche ou « Moi contre » : ce candidat à gauche, l'autre au choix.
- **E-mail d'un signalement** : gardé trois mois, le temps de répondre, puis effacé ; le signalement reste. Il n'apparaît que dans /admin.

## Écrans de la v1

**Navigation (25/10/2026)** : sur ordinateur, une colonne d'icônes à gauche (Répondre, Mes résultats, Toutes les questions, Méthode) avec le compte à rebours en bas, sans bandeau au-dessus des pages ; au téléphone, les mêmes icônes dans la barre du haut. Peu de mots : un écran qui a besoin d'être expliqué est à revoir. Ce n'est pas un jeu : ni « jouer », ni « partie », ni « le jeu » dans les textes.

Maquettes statiques de tous les écrans, dans la direction « Jeu de société » : `maquettes/` (ouvrir `maquettes/index.html`).

1. **Accueil** : la prochaine question de l'électeur, compte à rebours avant le 1er tour, progression vers le prochain palier (avant le 25/10/2026 : question du jour et série).
2. **Fiche** : question, contexte, chiffres, options (sans noms), réponse + importance.
3. **Révélation** : qui défend quoi, alignement, classement mis à jour.
4. **Toutes les questions** : la liste, pour en choisir une (avant le 25/10/2026 : rattrapage, trié par pouvoir de départage).
5. **Mes résultats** : classement en %, fiabilité, carte 2 axes, détail par thème.
6. **Face-à-face** et **Moi vs X**.
7. **Fiche candidat** : positions sourcées par thème, badges déduite / officielle.
8. **Méthodo & sources**, **Journal des corrections**, **À propos**.
9. **Carte de résultat partageable** (format story 9:16).
10. **Visuels réseaux** : carrousel Insta (1:1 ou 4:5), story, gabarit vidéo 9:16.

## Hors périmètre pour l'instant

- Direction artistique : à définir avec AEOM. Seule contrainte imposée : aucun candidat codé par la couleur de son parti.
- Outillage de publication sur les réseaux.
- Notifications.
- Statistiques agrégées.
