// Synchronisation de la progression entre appareils, via un code partagé.
//
// Chaque appareil garde, en plus de la liste des films vus, l'horodatage de chaque
// changement : { "<id>": [vu, horodatage] }. Le serveur fusionne en gardant, pour
// chaque film, le changement le plus récent. Un film coché avant d'activer la synchro
// a l'horodatage 0 : il est conservé, sauf s'il a été décoché ailleurs depuis.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadObject, saveObject } from './storage';

const CODE_KEY = 'toon-sync-code';
const ITEMS_KEY = 'toon-sync-items';
const LAST_SYNC_KEY = 'toon-sync-last';
const PUSH_DELAY = 1500;

const readString = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeString = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* stockage indisponible */ }
};

export const formatCode = (code) => (code ?? '').match(/.{1,4}/g)?.join('-') ?? '';
export const normalizeCode = (raw) => (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Items à partir des films vus (horodatage 0 pour ceux qu'on n'a pas encore suivis).
function itemsFromSeen(seen, items) {
  const result = { ...items };
  for (const id of Object.keys(seen)) {
    if (seen[id] && !result[id]) result[id] = [true, 0];
  }
  return result;
}

const seenFromItems = (items) => Object.fromEntries(
  Object.entries(items).filter(([, [seen]]) => seen).map(([id]) => [id, true])
);

const sameSeen = (a, b) => {
  const ka = Object.keys(a).filter(k => a[k]);
  const kb = Object.keys(b).filter(k => b[k]);
  return ka.length === kb.length && ka.every(k => b[k]);
};

async function api(path, options) {
  const res = await fetch(`/api/sync${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Erreur ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export function useSync(seenState, setSeenState) {
  const [code, setCode] = useState(() => readString(CODE_KEY));
  const [status, setStatus] = useState(code ? 'idle' : 'off'); // off | idle | syncing | ok | offline | error
  const [lastSync, setLastSync] = useState(() => Number(readString(LAST_SYNC_KEY)) || null);
  const [error, setError] = useState(null);

  const itemsRef = useRef(loadObject(ITEMS_KEY));
  const previousSeen = useRef(seenState);
  const fromRemote = useRef(false);
  const timer = useRef(null);
  const syncing = useRef(false);
  const pending = useRef(false);

  const saveItems = () => saveObject(ITEMS_KEY, itemsRef.current);

  // Applique la version fusionnée renvoyée par le serveur.
  const applyRemote = useCallback((items) => {
    itemsRef.current = items;
    saveItems();
    const next = seenFromItems(items);
    setSeenState(prev => {
      if (sameSeen(prev, next)) return prev;
      fromRemote.current = true;
      return next;
    });
  }, [setSeenState]);

  const sync = useCallback(async (syncCode = code) => {
    if (!syncCode) return;
    if (syncing.current) { pending.current = true; return; }
    syncing.current = true;
    setStatus('syncing');
    try {
      const data = await api(`/${syncCode}`, {
        method: 'PUT',
        body: JSON.stringify({ items: itemsRef.current }),
      });
      applyRemote(data.items);
      const now = Date.now();
      setLastSync(now);
      writeString(LAST_SYNC_KEY, String(now));
      setStatus('ok');
      setError(null);
    } catch (e) {
      if (e.status === 404) {
        setStatus('error');
        setError("Ce code n'existe plus.");
      } else if (e.status) {
        setStatus('error');
        setError(e.message);
      } else {
        setStatus('offline'); // pas de réseau : on réessaiera
      }
    } finally {
      syncing.current = false;
      if (pending.current) {
        pending.current = false;
        sync(syncCode);
      }
    }
  }, [code, applyRemote]);

  // Horodate chaque changement fait sur cet appareil, puis envoie (avec un petit délai).
  useEffect(() => {
    const prev = previousSeen.current;
    previousSeen.current = seenState;
    if (fromRemote.current) { fromRemote.current = false; return; }
    if (prev === seenState) return;

    const now = Date.now();
    const items = { ...itemsRef.current };
    const ids = new Set([...Object.keys(prev), ...Object.keys(seenState)]);
    let changed = false;
    for (const id of ids) {
      const was = !!prev[id];
      const is = !!seenState[id];
      if (was !== is) { items[id] = [is, now]; changed = true; }
    }
    if (!changed) return;
    itemsRef.current = items;
    saveItems();

    if (!code) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => sync(), PUSH_DELAY);
  }, [seenState, code, sync]);

  // Synchro à l'ouverture, au retour sur l'onglet et quand le réseau revient.
  useEffect(() => {
    if (!code) return;
    sync();
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    const onOnline = () => sync();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      clearTimeout(timer.current);
    };
    // On ne relance pas cet effet à chaque nouvelle fonction `sync` : seulement si le code change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const connect = (newCode) => {
    itemsRef.current = itemsFromSeen(seenState, itemsRef.current);
    saveItems();
    writeString(CODE_KEY, newCode);
    setCode(newCode);
    setError(null);
  };

  // Crée un nouveau code et y envoie la progression de cet appareil.
  const createCode = async () => {
    setStatus('syncing');
    try {
      const { code: newCode } = await api('', { method: 'POST' });
      connect(newCode);
      return newCode;
    } catch (e) {
      setStatus(code ? 'error' : 'off');
      throw new Error(e.status ? e.message : 'Pas de connexion internet.');
    }
  };

  // Rejoint un code existant : la progression des deux côtés est fusionnée.
  const joinCode = async (raw) => {
    const wanted = normalizeCode(raw);
    if (wanted.length !== 12) throw new Error('Le code doit faire 12 caractères.');
    try {
      await api(`/${wanted}`, { method: 'GET' });
    } catch (e) {
      throw new Error(e.status === 404 ? 'Ce code est inconnu.' : e.status ? e.message : 'Pas de connexion internet.');
    }
    connect(wanted);
  };

  // Arrête la synchro sur cet appareil (la progression locale est gardée).
  const disconnect = () => {
    writeString(CODE_KEY, null);
    writeString(LAST_SYNC_KEY, null);
    clearTimeout(timer.current);
    setCode(null);
    setLastSync(null);
    setStatus('off');
    setError(null);
  };

  return { code, status, lastSync, error, syncNow: () => sync(), createCode, joinCode, disconnect };
}
