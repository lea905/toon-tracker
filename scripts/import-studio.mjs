// Importe tous les longs-métrages d'un studio depuis TMDB.
//
// Usage :
//   node scripts/import-studio.mjs <id société TMDB> <catégorie>             → aperçu, ne modifie rien
//   node scripts/import-studio.mjs <id société TMDB> <catégorie> --apply <dossier affiches>
//
// Exemple : node scripts/import-studio.mjs 521 dreamworks
//
// Avec --apply : ajoute les films à src/data/movies.json (identifiants à la suite),
// télécharge les affiches dans <dossier affiches> (à copier ensuite dans public/posters),
// et note l'identifiant TMDB de chaque film dans scripts/tmdb-overrides.json pour
// que `npm run fetch-details` récupère directement la bonne fiche.
// Les films déjà présents (même identifiant TMDB) sont ignorés.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const [companyId, category, ...rest] = process.argv.slice(2);
const apply = rest[0] === '--apply';
const posterDir = rest[1];
if (!companyId || !category || (apply && !posterDir)) {
  console.error('Usage : node scripts/import-studio.mjs <id société> <catégorie> [--apply <dossier affiches>]');
  process.exit(1);
}

process.loadEnvFile('.env.local');
const apiKey = process.env.TMDB_API_KEY?.trim();

async function tmdb(p, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + p);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`TMDB ${res.status} sur ${p}`);
    return res.json();
  }
  throw new Error(`TMDB : trop de requêtes sur ${p}`);
}

// 1. Tous les films du studio.
const found = [];
for (let page = 1; ; page++) {
  const data = await tmdb('/discover/movie', {
    with_companies: companyId, language: 'fr-FR', sort_by: 'primary_release_date.asc', include_adult: 'false', page,
  });
  found.push(...data.results);
  if (page >= data.total_pages) break;
}

// 2. Détails de chaque film pour ne garder que les vrais longs-métrages.
const today = new Date().toISOString().slice(0, 10);
const kept = [];
const skipped = [];
for (const r of found) {
  const d = await tmdb(`/movie/${r.id}`, { language: 'fr-FR', append_to_response: 'release_dates' });
  const fr = d.release_dates?.results?.find(x => x.iso_3166_1 === 'FR')?.release_dates ?? [];
  const frTheatrical = fr.filter(x => x.type === 3 || x.type === 2).map(x => x.release_date.slice(0, 10)).sort()[0];
  const date = frTheatrical ?? d.release_date ?? null;
  const upcoming = date ? date > today : true;
  const isDoc = d.genres?.some(g => g.id === 99);
  const isFeature = d.runtime >= 60 || (upcoming && !d.runtime);
  const reason = !date ? 'sans date' : isDoc ? 'documentaire' : !isFeature ? `court (${d.runtime || '?'} min)` : null;
  const entry = { tmdbId: d.id, title: d.title, original: d.original_title, date, upcoming, runtime: d.runtime, poster: d.poster_path };
  if (reason) skipped.push({ ...entry, reason }); else kept.push(entry);
}
kept.sort((a, b) => a.date.localeCompare(b.date));

console.log(`\n${kept.length} longs-métrages retenus :`);
for (const m of kept) console.log(`  ${m.date}  ${m.title}${m.title !== m.original ? ` [${m.original}]` : ''}  (${m.runtime || '?'} min, tmdb ${m.tmdbId})${m.poster ? '' : '  ⚠ pas d\'affiche'}`);
console.log(`\n${skipped.length} écartés :`);
for (const m of skipped) console.log(`  ${m.date ?? '????'}  ${m.title} — ${m.reason}`);

if (!apply) process.exit(0);

// 3. Ajout dans movies.json + affiches + overrides.
const movies = JSON.parse(await readFile('src/data/movies.json', 'utf8'));
const overrides = JSON.parse(await readFile('scripts/tmdb-overrides.json', 'utf8'));
const details = JSON.parse(await readFile('src/data/details.json', 'utf8'));
const knownTmdb = new Set([...Object.values(details).map(d => d.tmdbId), ...Object.values(overrides)]);
let nextId = Math.max(...movies.map(m => m.id)) + 1;
await mkdir(posterDir, { recursive: true });

let added = 0;
for (const m of kept) {
  if (knownTmdb.has(m.tmdbId)) { console.log(`  déjà présent : ${m.title}`); continue; }
  const id = nextId++;
  let poster = null;
  if (m.poster) {
    const res = await fetch(`https://image.tmdb.org/t/p/w500${m.poster}`);
    if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
      await writeFile(path.join(posterDir, `${id}.jpg`), Buffer.from(await res.arrayBuffer()));
      poster = `/posters/${id}.jpg`;
    }
  }
  movies.push({
    id,
    title: m.title,
    year: Number(m.date.slice(0, 4)),
    ...(m.upcoming ? { releaseDate: m.date } : {}),
    category,
    poster,
  });
  overrides[id] = m.tmdbId;
  added++;
}

await writeFile('src/data/movies.json', JSON.stringify(movies, null, 2) + '\n');
const sortedOverrides = Object.fromEntries(Object.entries(overrides).sort((a, b) => Number(a[0]) - Number(b[0])));
await writeFile('scripts/tmdb-overrides.json', JSON.stringify(sortedOverrides, null, 2) + '\n');
console.log(`\n${added} films ajoutés (identifiants jusqu'à ${nextId - 1}).`);
