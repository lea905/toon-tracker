// Récupère depuis TMDB les infos détaillées des films (résumé, durée, réalisation,
// genres, bande-annonce) et les enregistre dans src/data/details.json.
//
// Usage : npm run fetch-details            (ne traite que les films sans infos)
//         npm run fetch-details -- --all   (re-télécharge tout)
//
// La clé TMDB (gratuite, sur themoviedb.org → Paramètres → API) se met dans un fichier
// .env.local à la racine du projet, qui n'est jamais commité :
//   TMDB_API_KEY=...        (la « Clé d'API »)
// ou
//   TMDB_READ_TOKEN=...     (le « Jeton d'accès en lecture à l'API »)
//
// Si un film est mal reconnu, indique le bon identifiant TMDB dans
// scripts/tmdb-overrides.json ({ "id du film": id TMDB }) puis relance avec --all.
// Mets null pour un film qui n'existe pas (encore) sur TMDB.

import { readFile, writeFile } from 'node:fs/promises';

const MOVIES_JSON = 'src/data/movies.json';
const DETAILS_JSON = 'src/data/details.json';
const OVERRIDES_JSON = 'scripts/tmdb-overrides.json';
const API = 'https://api.themoviedb.org/3';
const CONCURRENCY = 4;

try {
  process.loadEnvFile('.env.local');
} catch {
  // Pas de fichier .env.local : on regarde les variables d'environnement.
}
const apiKey = process.env.TMDB_API_KEY?.trim();
const readToken = process.env.TMDB_READ_TOKEN?.trim();
if (!apiKey && !readToken) {
  console.error('Clé TMDB manquante : ajoute TMDB_API_KEY=... ou TMDB_READ_TOKEN=... dans .env.local');
  process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (apiKey && !readToken) url.searchParams.set('api_key', apiKey);
  const headers = readToken ? { Authorization: `Bearer ${readToken}` } : {};
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) { await sleep(1000 * (attempt + 1)); continue; }
    if (res.status === 401) throw new Error('Clé TMDB refusée (401) : vérifie .env.local');
    if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
    return res.json();
  }
  throw new Error(`TMDB : trop de requêtes sur ${path}`);
}

const normalize = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, 'et').replace(/[^a-z0-9]+/g, ' ').trim();

// Cherche le film sur TMDB et choisit le résultat le plus proche (titre puis année).
async function findTmdbId(movie) {
  const { results = [] } = await tmdb('/search/movie', { query: movie.title, language: 'fr-FR', include_adult: 'false' });
  const target = normalize(movie.title);
  let best = null;
  for (const r of results) {
    const year = Number((r.release_date ?? '').slice(0, 4)) || null;
    const yearDiff = year ? Math.abs(year - movie.year) : 5;
    const exact = normalize(r.title) === target || normalize(r.original_title) === target;
    const score = (exact ? 0 : 3) + yearDiff - Math.min(r.popularity ?? 0, 100) / 1000;
    if (!best || score < best.score) best = { id: r.id, score, exact, yearDiff, title: r.title, year };
  }
  // Titre identique : on tolère un gros écart d'année (les vieux films sont souvent
  // sortis en France des années après les États-Unis). Sinon, 2 ans maximum.
  if (!best || best.yearDiff > (best.exact ? 10 : 2)) return { id: null };
  return best;
}

const pickTrailer = (videos = []) => {
  const yt = videos.filter(v => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type));
  const rank = (v) => (v.type === 'Trailer' ? 0 : 2) + (v.iso_639_1 === 'fr' ? 0 : 1) + (v.official ? 0 : 0.5);
  return yt.sort((a, b) => rank(a) - rank(b))[0]?.key ?? null;
};

async function fetchDetails(tmdbId) {
  const fr = await tmdb(`/movie/${tmdbId}`, {
    language: 'fr-FR',
    append_to_response: 'credits,videos',
    include_video_language: 'fr,en,null',
  });
  let overview = fr.overview?.trim();
  if (!overview) {
    const en = await tmdb(`/movie/${tmdbId}`, { language: 'en-US' });
    overview = en.overview?.trim();
  }
  const directors = (fr.credits?.crew ?? []).filter(c => c.job === 'Director').map(c => c.name);
  return {
    tmdbId,
    originalTitle: fr.original_title || null,
    overview: overview || null,
    runtime: fr.runtime || null,
    director: directors.length ? [...new Set(directors)].join(', ') : null,
    genres: (fr.genres ?? []).map(g => g.name),
    trailer: pickTrailer(fr.videos?.results),
    posterPath: fr.poster_path || null,
  };
}

const movies = JSON.parse(await readFile(MOVIES_JSON, 'utf8'));
const details = JSON.parse(await readFile(DETAILS_JSON, 'utf8').catch(() => '{}'));
const overrides = JSON.parse(await readFile(OVERRIDES_JSON, 'utf8').catch(() => '{}'));
const refreshAll = process.argv.includes('--all');

// stale = fiche marquée « à rafraîchir » par update-catalog.mjs (films à venir).
const todo = movies.filter(m => refreshAll || !details[m.id] || details[m.id].stale);
console.log(`${todo.length} film(s) à traiter sur ${movies.length}…`);

const unmatched = [];
const fuzzy = [];
let done = 0;

async function worker(queue) {
  for (let movie = queue.shift(); movie; movie = queue.shift()) {
    try {
      // null dans les overrides = film volontairement sans fiche (introuvable sur TMDB).
      if (overrides[movie.id] === null) { delete details[movie.id]; continue; }
      let tmdbId = overrides[movie.id] ?? (refreshAll ? null : details[movie.id]?.tmdbId);
      if (!tmdbId) {
        const match = await findTmdbId(movie);
        if (!match.id) { unmatched.push(`${movie.id} ${movie.title} (${movie.year})`); continue; }
        if (!match.exact || match.yearDiff > 1) {
          fuzzy.push(`${movie.id} ${movie.title} (${movie.year}) → ${match.title} (${match.year}) [tmdb ${match.id}]`);
        }
        tmdbId = match.id;
      }
      details[movie.id] = await fetchDetails(tmdbId);
    } catch (error) {
      if (error.message.includes('401')) throw error;
      unmatched.push(`${movie.id} ${movie.title} : ${error.message}`);
    } finally {
      done++;
      if (done % 50 === 0) console.log(`  ${done} / ${todo.length}`);
    }
  }
}

const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

const sorted = Object.fromEntries(Object.entries(details).sort((a, b) => Number(a[0]) - Number(b[0])));
await writeFile(DETAILS_JSON, JSON.stringify(sorted) + '\n');

const all = Object.values(sorted);
console.log(`\nTerminé : ${all.length} fiches au total.`);
console.log(`  avec résumé : ${all.filter(d => d.overview).length}, avec bande-annonce : ${all.filter(d => d.trailer).length}`);
if (fuzzy.length) console.log(`\nCorrespondances approximatives à vérifier (${fuzzy.length}) :\n  ${fuzzy.join('\n  ')}`);
if (unmatched.length) console.log(`\nFilms non trouvés (${unmatched.length}) :\n  ${unmatched.join('\n  ')}`);
