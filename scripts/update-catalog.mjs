// Mise à jour automatique du catalogue depuis TMDB (lancée chaque semaine par GitHub Actions).
//
// 1. Ajoute les nouveaux longs-métrages des studios listés dans scripts/studios.json
//    (seulement les films sortis il y a moins de 3 mois ou à venir : pas de surprise dans les anciens films).
// 2. Pour les films à venir ou sans affiche : met à jour la date de sortie française et
//    télécharge la nouvelle affiche quand TMDB en a une, et redemande leur fiche (résumé…).
//
// Usage : node scripts/update-catalog.mjs [--dry]
//   --dry : affiche ce qui changerait sans rien modifier.
// Ensuite : npm run optimize-images && npm run fetch-details
//
// Si la variable SUMMARY_FILE est définie, un résumé en Markdown y est écrit (utilisé pour la pull request).

import { readFile, writeFile } from 'node:fs/promises';

const dry = process.argv.includes('--dry');
try { process.loadEnvFile('.env.local'); } catch { /* en CI, la clé vient des secrets GitHub */ }
const apiKey = process.env.TMDB_API_KEY?.trim();
if (!apiKey) { console.error('TMDB_API_KEY manquante'); process.exit(1); }

async function tmdb(path, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + path);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
    return res.json();
  }
  throw new Error(`TMDB : trop de requêtes sur ${path}`);
}

async function downloadPoster(posterPath, id) {
  const res = await fetch(`https://image.tmdb.org/t/p/w500${posterPath}`);
  if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) return false;
  await writeFile(`public/posters/${id}.jpg`, Buffer.from(await res.arrayBuffer()));
  return true;
}

// Date de sortie en France (cinéma), sinon la date TMDB principale.
const frenchDate = (d) => {
  const fr = d.release_dates?.results?.find(x => x.iso_3166_1 === 'FR')?.release_dates ?? [];
  return fr.filter(x => x.type === 3 || x.type === 2).map(x => x.release_date.slice(0, 10)).sort()[0]
    ?? d.release_date ?? null;
};

const today = new Date().toISOString().slice(0, 10);
const windowStart = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const { studios } = JSON.parse(await readFile('scripts/studios.json', 'utf8'));
const movies = JSON.parse(await readFile('src/data/movies.json', 'utf8'));
const details = JSON.parse(await readFile('src/data/details.json', 'utf8'));
const overrides = JSON.parse(await readFile('scripts/tmdb-overrides.json', 'utf8'));

const tmdbIdOf = (id) => overrides[id] ?? details[id]?.tmdbId ?? null;
const known = new Set(movies.map(m => tmdbIdOf(m.id)).filter(Boolean));
for (const s of studios) for (const id of s.exclude ?? []) known.add(id);

const added = [];
const posters = [];
const dates = [];
const titles = [];
let nextId = Math.max(...movies.map(m => m.id)) + 1;

// 1. Nouveaux films
for (const studio of studios) {
  for (let page = 1; ; page++) {
    const data = await tmdb('/discover/movie', {
      with_companies: studio.company, language: 'fr-FR', include_adult: 'false',
      'primary_release_date.gte': windowStart, sort_by: 'primary_release_date.asc', page,
    });
    for (const r of data.results) {
      if (known.has(r.id)) continue;
      known.add(r.id);
      const d = await tmdb(`/movie/${r.id}`, { language: 'fr-FR', append_to_response: 'release_dates' });
      const date = frenchDate(d);
      const upcoming = date ? date > today : true;
      // Prudence en automatique : il faut un genre et une durée connue d'au moins 1 h.
      // (Les courts-métrages à venir ont souvent une durée « 0 » : un long-métrage à venir
      // sera ajouté lors d'un prochain passage, dès que TMDB connaît sa durée.)
      const genres = d.genres ?? [];
      const isDoc = genres.some(g => g.id === 99) && studio.category !== 'documentary';
      if (!date || !genres.length || isDoc || !(d.runtime >= 60)) {
        known.delete(r.id); // on le revérifiera la semaine prochaine
        continue;
      }
      // Un film « Walt Disney Pictures » en animation va dans la catégorie Animation.
      const category = studio.category === 'live-action' && genres.some(g => g.id === 16) ? 'animation' : studio.category;

      const id = nextId++;
      const hasPoster = d.poster_path && !dry ? await downloadPoster(d.poster_path, id) : false;
      movies.push({
        id,
        title: d.title,
        year: Number(date.slice(0, 4)),
        ...(upcoming ? { releaseDate: date } : {}),
        category,
        poster: hasPoster ? `/posters/${id}.jpg` : null,
      });
      overrides[id] = d.id;
      added.push(`${d.title} (${date.slice(0, 4)}, ${category})`);
    }
    if (page >= data.total_pages) break;
  }
}

// 2. Films à venir ou sans affiche : date, affiche et fiche
// Même règle que l'app (src/categories.js) : date connue dans le futur, ou année pas encore commencée.
const isUpcoming = (m) => (m.releaseDate ? m.releaseDate > today : m.year > Number(today.slice(0, 4)));
for (const movie of movies) {
  const tmdbId = tmdbIdOf(movie.id);
  if (!tmdbId || (!isUpcoming(movie) && movie.poster)) continue;
  if (added.length && overrides[movie.id] === tmdbId && !details[movie.id]) continue; // film tout juste ajouté

  const d = await tmdb(`/movie/${tmdbId}`, { language: 'fr-FR', append_to_response: 'release_dates' });
  const date = frenchDate(d);
  // Titre français annoncé (on ignore les titres provisoires « Untitled… »).
  if (isUpcoming(movie) && d.title && d.title !== movie.title && !/^(untitled|sans titre)/i.test(d.title)) {
    titles.push(`${movie.title} → ${d.title}`);
    movie.title = d.title;
  }
  if (date && isUpcoming(movie) && date !== movie.releaseDate) {
    dates.push(`${movie.title} : ${movie.releaseDate ?? movie.year} → ${date}`);
    movie.releaseDate = date;
    movie.year = Number(date.slice(0, 4));
  }
  const knownPoster = details[movie.id]?.posterPath;
  if (d.poster_path && (d.poster_path !== knownPoster || !movie.poster)) {
    if (!dry && await downloadPoster(d.poster_path, movie.id)) {
      movie.poster = `/posters/${movie.id}.jpg`;
    }
    posters.push(movie.title);
  }
  // On redemande la fiche (résumé, durée, bande-annonce…) des films à venir, en gardant
  // l'affiche connue pour ne pas la retélécharger la semaine prochaine.
  overrides[movie.id] ??= tmdbId;
  if (isUpcoming(movie)) {
    details[movie.id] = { ...details[movie.id], tmdbId, posterPath: d.poster_path || null, stale: true };
  }
}

const summary = [
  `## Mise à jour du catalogue (${today})`,
  '',
  `**${added.length} nouveau(x) film(s)**`, ...added.map(t => `- ${t}`), '',
  `**${posters.length} affiche(s) ajoutée(s) ou mise(s) à jour**`, ...posters.map(t => `- ${t}`), '',
  `**${dates.length} date(s) de sortie modifiée(s)**`, ...dates.map(t => `- ${t}`), '',
  `**${titles.length} titre(s) français annoncé(s)**`, ...titles.map(t => `- ${t}`),
].join('\n');
console.log(summary);

if (dry) { console.log('\n(--dry : rien n\'a été modifié)'); process.exit(0); }

await writeFile('src/data/movies.json', JSON.stringify(movies, null, 2) + '\n');
await writeFile('src/data/details.json', JSON.stringify(details) + '\n');
const sortedOverrides = Object.fromEntries(Object.entries(overrides).sort((a, b) => Number(a[0]) - Number(b[0])));
await writeFile('scripts/tmdb-overrides.json', JSON.stringify(sortedOverrides, null, 2) + '\n');
if (process.env.SUMMARY_FILE) await writeFile(process.env.SUMMARY_FILE, summary + '\n');
