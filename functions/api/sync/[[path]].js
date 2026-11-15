// API de synchronisation (Cloudflare Pages Functions + base D1 liée sous le nom « DB »).
//
//   POST /api/sync          → crée un nouveau code de synchro          → { code }
//   GET  /api/sync/<code>   → progression enregistrée                   → { items, updatedAt }
//   PUT  /api/sync/<code>   → envoie la progression locale { items },
//                             fusionnée avec celle du serveur           → { items, updatedAt }
//
// `items` : { "<id du film>": [vu (true/false), horodatage en ms] }.
// Fusion : pour chaque film, la modification la plus récente l'emporte.

const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // sans 0/O, 1/I/L, U : faciles à confondre
const CODE_LENGTH = 12;
const MAX_ITEMS = 5000;
const MAX_BODY = 300_000;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// Accepte « k7qf m2xp-9cta » et le ramène à « K7QFM2XP9CTA ».
const normalizeCode = (raw) => (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const isValidCode = (code) => code.length === CODE_LENGTH && [...code].every(c => ALPHABET.includes(c));

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return [...bytes].map(b => ALPHABET[b % ALPHABET.length]).join('');
}

async function ensureTable(db) {
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS progress (code TEXT PRIMARY KEY, items TEXT NOT NULL, updated_at INTEGER NOT NULL)'
  ).run();
}

// Ne garde que des entrées valides : identifiant numérique → [booléen, horodatage].
function cleanItems(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length > MAX_ITEMS) return null;
  const items = {};
  const now = Date.now();
  for (const [id, value] of entries) {
    if (!/^\d{1,6}$/.test(id) || !Array.isArray(value)) continue;
    const [seen, time] = value;
    if (typeof seen !== 'boolean' || !Number.isFinite(time) || time < 0) continue;
    items[id] = [seen, Math.min(time, now + 60_000)]; // pas d'horodatage dans le futur
  }
  return items;
}

function merge(a, b) {
  const result = { ...a };
  for (const [id, value] of Object.entries(b)) {
    if (!result[id] || value[1] > result[id][1]) result[id] = value;
  }
  return result;
}

async function readRow(db, code) {
  const row = await db.prepare('SELECT items, updated_at FROM progress WHERE code = ?').bind(code).first();
  return row ? { items: JSON.parse(row.items), updatedAt: row.updated_at } : null;
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return json({ error: 'Synchro non configurée (base D1 « DB » manquante).' }, 503);
  await ensureTable(db);

  const segments = params.path ?? [];
  const method = request.method;

  // Création d'un code
  if (segments.length === 0) {
    if (method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode();
      const { meta } = await db
        .prepare('INSERT OR IGNORE INTO progress (code, items, updated_at) VALUES (?, ?, ?)')
        .bind(code, '{}', Date.now())
        .run();
      if (meta.changes === 1) return json({ code }, 201);
    }
    return json({ error: 'Impossible de créer un code, réessaie.' }, 500);
  }

  const code = normalizeCode(segments[0]);
  if (segments.length > 1 || !isValidCode(code)) return json({ error: 'Code invalide.' }, 400);

  if (method === 'GET') {
    const row = await readRow(db, code);
    return row ? json(row) : json({ error: 'Code inconnu.' }, 404);
  }

  if (method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ error: 'Envoi trop volumineux.' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: 'JSON invalide.' }, 400); }
    const incoming = cleanItems(body?.items);
    if (!incoming) return json({ error: 'Progression invalide.' }, 400);

    const row = await readRow(db, code);
    if (!row) return json({ error: 'Code inconnu.' }, 404);
    const items = merge(row.items, incoming);
    const updatedAt = Date.now();
    await db.prepare('UPDATE progress SET items = ?, updated_at = ? WHERE code = ?')
      .bind(JSON.stringify(items), updatedAt, code)
      .run();
    return json({ items, updatedAt });
  }

  return json({ error: 'Méthode non autorisée.' }, 405);
}
