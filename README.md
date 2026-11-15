# Disney & Pixar Tracker

Une petite application web pour suivre les films Disney et Pixar que tu as vus et leur donner une note.
Elle fonctionne sur ordinateur et sur téléphone, et peut s'installer comme une application (PWA) avec un accès hors-ligne.

## Fonctionnalités

- 489 films, de *Blanche-Neige* aux sorties à venir, avec leur affiche
- Marquer un film comme vu et le noter de 1 à 5 étoiles (recliquer sur la note la retire)
- Recherche par titre (sans tenir compte des accents)
- Filtres par statut (à voir, vus, notés, tous) et par décennie, tri par année, titre ou note
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

## Ajouter un film

1. Dépose l'affiche dans `public/posters/` en la nommant avec le prochain identifiant libre (par ex. `490.jpg`).
2. Ajoute le film à la fin de `src/data/movies.json` :
   ```json
   {
     "id": 490,
     "title": "Titre du film",
     "year": 2027,
     "studio": null,
     "poster": "/posters/490.jpg"
   }
   ```
3. Lance `npm run optimize-images` : l'affiche est redimensionnée, convertie en WebP, et le chemin dans `movies.json` est mis à jour.

## Structure

```
public/posters/         Affiches des films (WebP)
public/icon-*.png       Icônes de l'application
assets-src/icon.png     Icône source (pour régénérer les icônes)
scripts/                Script d'optimisation des images
src/data/movies.json    Liste des films
src/components/         Composants React (carte, liste, barre de filtres)
src/storage.js          Sauvegarde locale et export/import
```

## Déploiement

Le site est déployé sur [Netlify](https://www.netlify.com/) (offre gratuite) : chaque push sur `main` déclenche un nouveau déploiement.
La configuration se trouve dans `netlify.toml`.

## Technologies

React 19, Vite 7, vite-plugin-pwa, sharp (optimisation des images).
