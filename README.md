# Toon Tracker

Une petite application web pour suivre tous les films que tu as vus : Disney, Pixar, DreamWorks, Illumination, Ghibli, Marvel, Star Wars et plus encore.
Elle fonctionne sur ordinateur et sur téléphone, et peut s'installer comme une application (PWA) avec un accès hors-ligne.

## Fonctionnalités

- 716 films, de *Blanche-Neige* aux sorties annoncées jusqu'en 2029, avec leur affiche
- Classés par catégorie : côté Disney (Animation Disney, Pixar, Live-action, Marvel, Lucasfilm, Documentaire) et 12 autres studios d'animation
  (DreamWorks, Illumination, Sony, Blue Sky, Paramount, Warner, Netflix, Laika, Aardman, Cartoon Saloon, Ghibli, CoMix Wave),
  avec les raccourcis « Tout Disney » et « Tous les autres studios » dans le filtre
- Filmographies de 13 studios d'animation, numérotées dans l'ordre de sortie
- Une fiche par film (clic sur l'affiche) : résumé, durée, réalisation, genres, sagas et bande-annonce
- Marquer un film comme vu ; les films pas encore sortis affichent un compte à rebours (« Dans 10 jours », « Le 26 mai 2027 »)
- Les **Grands Classiques Disney** numérotés (n°1 *Blanche-Neige* → n°66 *La Reine des neiges 3*)
- 62 **sagas** (Marvel, Star Wars, Toy Story, Shrek, Moi moche et méchant, L'Âge de glace, Spider-Verse…) avec leur ordre de sortie et, quand il diffère, l'ordre chronologique de l'histoire
- Recherche par titre (sans tenir compte des accents)
- Filtres par statut (à voir, vus, bientôt, tous), par saga, par catégorie et par décennie, tri par année ou titre
- Affichage en grille d'affiches ou en liste compacte
- Statistiques (clic sur le compteur) : progression globale, Grands Classiques, catégories, sagas, décennies
- 22 badges à débloquer, et une image de ta progression à télécharger ou partager
- Bouton « Au hasard » : tire au sort un film pas encore vu, en tenant compte des filtres
- **Synchro entre appareils** avec un simple code (bouton « Synchro »), sans compte ni mot de passe
- Export / import de la progression dans un fichier JSON

La progression est enregistrée dans le navigateur (`localStorage`). Elle n'est envoyée sur un serveur
que si la synchro est activée.

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org/) 20 ou plus.

```bash
npm install
npm run dev
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run build` | Compile le site dans `dist/` |
| `npm run preview` | Sert la version compilée en local |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run optimize-images` | Convertit les nouvelles affiches en WebP et met à jour `movies.json` |
| `node scripts/update-catalog.mjs --dry` | Montre ce que la mise à jour automatique changerait |
| `npm run fetch-details` | Récupère depuis TMDB les fiches des films qui n'en ont pas encore (`-- --all` pour tout refaire) |

## Ajouter un film

1. Dépose l'affiche dans `public/posters/` en la nommant avec le prochain identifiant libre (par ex. `505.jpg`).
2. Ajoute le film à la fin de `src/data/movies.json` :
   ```json
   {
     "id": 505,
     "title": "Titre du film",
     "year": 2027,
     "category": "animation",
     "poster": "/posters/505.jpg"
   }
   ```
   Catégories possibles : `animation`, `pixar`, `live-action`, `marvel`, `lucasfilm`, `documentary`.
   Si l'affiche n'est pas encore dévoilée, mets `"poster": null` : une carte « Affiche à venir » s'affiche.
   Pour un film pas encore sorti, tu peux ajouter `"releaseDate": "AAAA-MM-JJ"` : il sera marqué « Bientôt » jusqu'à cette date.
3. Lance `npm run optimize-images` : l'affiche est redimensionnée, convertie en WebP, et le chemin dans `movies.json` est mis à jour.
4. Lance `npm run fetch-details` pour récupérer sa fiche (résumé, durée…).

### Ajouter tout un studio d'un coup

`scripts/import-studio.mjs` récupère tous les longs-métrages d'un studio sur TMDB (les courts-métrages, spéciaux TV
et making-of sont écartés). Il faut l'identifiant TMDB du studio (DreamWorks Animation = 521, Illumination = 6704, Sony Pictures Animation = 2251,
Blue Sky = 9383, Ghibli = 10342, Aardman = 297, Laika = 11537, Warner Animation Group = 25120, Paramount Animation = 24955,
Netflix Animation = 171251, Cartoon Saloon = 23948, CoMix Wave Films = 3756) :

```bash
node scripts/import-studio.mjs 521 dreamworks                              # aperçu, ne modifie rien
node scripts/import-studio.mjs 521 dreamworks --apply dossier-temporaire   # ajoute les films et télécharge les affiches
```

Options : `--exclude 123,456` pour écarter des films (identifiants TMDB), `--extra 789` pour en ajouter un qui n'est
pas rattaché au studio sur TMDB.

Copie ensuite les affiches dans `public/posters/`, puis lance `npm run optimize-images` et `npm run fetch-details`.
Pense à ajouter la nouvelle catégorie dans `src/categories.js` (et sa couleur dans `MovieCard.css`).

## Synchro entre appareils

Le bouton « Synchro » crée un code de 12 caractères (ex. `XP2J-8KVA-M66J`) à taper sur les autres appareils.

- **Serveur** : une fonction Cloudflare Pages (`functions/api/sync/[[path]].js`) et une base **D1** liée sous le nom `DB`
  (la table est créée automatiquement au premier appel).
  - `POST /api/sync` crée un code, `GET /api/sync/<code>` lit la progression, `PUT /api/sync/<code>` envoie et fusionne.
- **Fusion** : chaque coche / décoche est horodatée ; pour chaque film, la modification la plus récente l'emporte.
- **Côté app** : `src/sync.js` (envoi 1,5 s après un changement, synchro à l'ouverture, au retour sur l'onglet et au retour du réseau).

Mise en place sur Cloudflare (une fois) : *Storage & Databases → D1 → Create* (base `toon-tracker-sync`), puis dans le
projet Pages *Settings → Bindings → Add → D1 database* : nom de variable `DB`, base `toon-tracker-sync`.

Test en local (fonctions + base D1 simulée) :

```bash
npm run build
npx wrangler@4.40.0 pages dev dist --d1 DB
```

## Mise à jour automatique

Chaque lundi, la tâche GitHub `.github/workflows/update-catalog.yml` lance `scripts/update-catalog.mjs`, qui :

- ajoute les nouveaux longs-métrages des studios listés dans `scripts/studios.json` (films sortis depuis moins de 3 mois ou à venir) ;
- met à jour la date de sortie française et l'affiche des films à venir, et redemande leur fiche ;

puis ouvre une **pull request « Mise à jour du catalogue »** avec le résumé des changements. Cloudflare en publie un aperçu ;
il suffit de la fusionner sur GitHub pour mettre le site à jour. On peut aussi la lancer à la main : onglet *Actions* →
*Mise à jour du catalogue* → *Run workflow*.

Pour tester en local sans rien modifier : `node scripts/update-catalog.mjs --dry`.

Prérequis sur GitHub (une seule fois) :
1. *Settings → Secrets and variables → Actions → New repository secret* : `TMDB_API_KEY` avec la clé TMDB.
2. *Settings → Actions → General → Workflow permissions* : cocher *Allow GitHub Actions to create and approve pull requests*.

Pour ne plus jamais ajouter un film, ajoute son identifiant TMDB dans le `exclude` de son studio (`scripts/studios.json`).

## Fiches des films (TMDB)

Les fiches viennent de [TMDB](https://www.themoviedb.org/) et sont enregistrées une fois pour toutes dans `src/data/details.json` :
le site n'appelle jamais TMDB pendant la visite.

Pour lancer `npm run fetch-details`, il faut une clé d'API TMDB gratuite (themoviedb.org → Paramètres → API),
à mettre dans un fichier `.env.local` à la racine (ignoré par git, jamais publié) :

```
TMDB_API_KEY=ta_clé
```

Si un film est mal reconnu, indique le bon identifiant TMDB dans `scripts/tmdb-overrides.json`
(`"id du film": id TMDB`, ou `null` s'il n'existe pas sur TMDB), puis relance avec `npm run fetch-details -- --all`.

*Ce site utilise l'API TMDB sans être approuvé ni certifié par TMDB.*

## Structure

```
public/posters/         Affiches des films (WebP)
public/icon-*.png       Icônes de l'application
assets-src/icon.png     Icône source (pour régénérer les icônes)
scripts/                Scripts : optimisation des images, fiches TMDB, import d'un studio, mise à jour automatique
.github/workflows/      Tâche GitHub hebdomadaire de mise à jour du catalogue
src/data/movies.json    Liste des films
src/data/details.json   Fiches des films (résumé, durée…), générées depuis TMDB
src/components/         Composants React (carte, liste, barre de filtres)
src/categories.js       Catégories, films à venir et compte à rebours
src/collections.js      Grands Classiques, studios et sagas (ordres de visionnage)
src/badges.js           Badges à débloquer
src/storage.js          Sauvegarde locale et export/import
src/sync.js             Synchro entre appareils (côté app)
functions/api/sync/     Synchro entre appareils (côté serveur Cloudflare)
```

## Déploiement

Le site est hébergé gratuitement sur [Cloudflare Pages](https://pages.cloudflare.com/) : **https://toon-tracker.pages.dev**.
Chaque push sur `main` déclenche un nouveau déploiement (réglages Cloudflare : commande `npm run build`,
dossier `dist`, variable `NODE_VERSION=22`). Les règles de cache sont dans `public/_headers`.

## Technologies

React 19, Vite 7, vite-plugin-pwa, police Inter (hébergée avec le site via Fontsource), sharp (optimisation des images).
