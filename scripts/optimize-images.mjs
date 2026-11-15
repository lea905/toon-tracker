// Optimise les affiches et l'icône de l'app.
// Usage : npm run optimize-images
//
// - Chaque affiche JPG/PNG de public/posters est redimensionnée (400 px de large max),
//   convertie en WebP, puis l'original est supprimé (il reste dans l'historique git).
// - src/data/movies.json est mis à jour pour pointer vers les fichiers .webp.
// - Les icônes PWA (192 et 512 px) sont générées à partir de assets-src/icon.png.
//
// Le script peut être relancé sans risque : il ne traite que les images pas encore converties.
// Pour ajouter un film : déposer son affiche (ex. 490.jpg) dans public/posters, l'ajouter
// dans movies.json, puis relancer le script.

import { readdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const POSTERS_DIR = 'public/posters';
const MOVIES_JSON = 'src/data/movies.json';
const ICON_SRC = 'assets-src/icon.png';
const POSTER_WIDTH = 400;
const WEBP_QUALITY = 75;

sharp.cache(false);

const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);

async function optimizePosters() {
  const files = (await readdir(POSTERS_DIR)).filter(f => SOURCE_EXT.has(path.extname(f).toLowerCase()));
  let before = 0;
  let after = 0;

  for (const file of files) {
    const src = path.join(POSTERS_DIR, file);
    const dest = path.join(POSTERS_DIR, `${path.parse(file).name}.webp`);
    before += (await stat(src)).size;

    // Lecture en mémoire : sur Windows, sharp garde sinon le fichier verrouillé et unlink échoue.
    await sharp(await readFile(src))
      .rotate()
      .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(dest);

    after += (await stat(dest)).size;
    await unlink(src);
  }

  const mb = n => (n / 1024 / 1024).toFixed(1);
  console.log(`Affiches : ${files.length} converties (${mb(before)} Mo -> ${mb(after)} Mo)`);
}

async function updateMoviesJson() {
  const movies = JSON.parse(await readFile(MOVIES_JSON, 'utf8'));
  const existing = new Set(await readdir(POSTERS_DIR));
  let updated = 0;
  const missing = [];

  for (const movie of movies) {
    if (!movie.poster) continue;
    const webpName = `${path.parse(movie.poster).name}.webp`;
    if (existing.has(webpName)) {
      const newPath = `/posters/${webpName}`;
      if (movie.poster !== newPath) {
        movie.poster = newPath;
        updated++;
      }
    } else {
      missing.push(`${movie.id} (${movie.title})`);
    }
  }

  await writeFile(MOVIES_JSON, JSON.stringify(movies, null, 2) + '\n');
  console.log(`movies.json : ${updated} chemins mis à jour`);
  if (missing.length) console.warn(`Affiches manquantes : ${missing.join(', ')}`);
}

async function generateIcons() {
  for (const size of [192, 512]) {
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9, palette: true })
      .toFile(`public/icon-${size}.png`);
  }
  console.log('Icônes : icon-192.png et icon-512.png générées');
}

await optimizePosters();
await updateMoviesJson();
await generateIcons();
