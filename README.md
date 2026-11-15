# Toon Tracker

Une petite application web pour suivre tous les films que tu as vus : Disney, Pixar, Marvel, Star Wars et plus encore.
Elle fonctionne sur ordinateur et sur téléphone, et peut s'installer comme une application (PWA) avec un accès hors-ligne.

## Fonctionnalités

- 504 films, de *Blanche-Neige* aux sorties annoncées jusqu'en 2029, avec leur affiche
- Classés par catégorie : Animation, Pixar, Live-action, Marvel, Lucasfilm (Star Wars, Indiana Jones), Documentaire
- Une fiche par film (clic sur l'affiche) : résumé, durée, réalisation, genres, sagas et bande-annonce
- Marquer un film comme vu ; les films pas encore sortis affichent un compte à rebours (« Dans 10 jours », « Le 26 mai 2027 »)
- Les **Grands Classiques Disney** numérotés (n°1 *Blanche-Neige* → n°66 *La Reine des neiges 3*)
- 34 **sagas** (Marvel, Star Wars, Toy Story…) avec leur ordre de sortie et, quand il diffère, l'ordre chronologique de l'histoire
- Recherche par titre (sans tenir compte des accents)
- Filtres par statut (à voir, vus, bientôt, tous), par saga, par catégorie et par décennie, tri par année ou titre
- Affichage en grille d'affiches ou en liste compacte
- Statistiques (clic sur le compteur) : progression globale, Grands Classiques, catégories, sagas, décennies
- 16 badges à débloquer, et une image de ta progression à télécharger ou partager
- Bouton « Au hasard » : tire au sort un film pas encore vu, en tenant compte des filtres
- Export / import de la progression dans un fichier JSON, pour changer d'appareil ou la sauvegarder

La progression est enregistrée uniquement dans le navigateur (`localStorage`) : rien n'est envoyé sur un serveur.
Pense à l'exporter de temps en temps.

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
scripts/                Scripts : optimisation des images, récupération des fiches TMDB
src/data/movies.json    Liste des films
src/data/details.json   Fiches des films (résumé, durée…), générées depuis TMDB
src/components/         Composants React (carte, liste, barre de filtres)
src/categories.js       Catégories, films à venir et compte à rebours
src/collections.js      Grands Classiques et sagas (ordres de visionnage)
src/badges.js           Badges à débloquer
src/storage.js          Sauvegarde locale et export/import
```

## Déploiement

Le site est déployé sur [Netlify](https://www.netlify.com/) (offre gratuite) : chaque push sur `main` déclenche un nouveau déploiement.
La configuration se trouve dans `netlify.toml`.

## Technologies

React 19, Vite 7, vite-plugin-pwa, police Inter (hébergée avec le site via Fontsource), sharp (optimisation des images).
