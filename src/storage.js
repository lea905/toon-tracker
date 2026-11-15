// Lecture/écriture sûres dans localStorage : si le navigateur bloque le stockage
// ou si les données sont corrompues, on repart d'un objet vide au lieu de planter.

export function loadObject(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveObject(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée, quota plein) : on ignore.
  }
}

const EXPORT_VERSION = 2;

export function downloadProgress(seen) {
  const data = {
    app: 'disney-pixar-tracker',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    seen,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `disney-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Renvoie les films vus, nettoyés, ou lève une erreur si le fichier n'est pas valide.
// Les anciennes sauvegardes (avec des notes) restent acceptées : les notes sont ignorées.
export function parseProgress(text, validIds) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  if (!data || typeof data !== 'object' || !data.seen || typeof data.seen !== 'object') {
    throw new Error("Ce fichier ne ressemble pas à une sauvegarde du tracker.");
  }

  const seen = {};
  for (const [id, value] of Object.entries(data.seen)) {
    if (validIds.has(id) && value === true) seen[id] = true;
  }
  return seen;
}
