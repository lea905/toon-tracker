import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import moviesData from './data/movies.json';
import MovieList from './components/MovieList';
import Toolbar from './components/Toolbar';
import StatsPanel from './components/StatsPanel';
import RandomPicker from './components/RandomPicker';
import MovieDetail from './components/MovieDetail';
import { isUpcoming } from './categories';
import { COLLECTIONS_BY_VALUE } from './collections';
import { computeBadges } from './badges';
import { loadObject, saveObject, downloadProgress, parseProgress } from './storage';
import './App.css';

// Minuscules et sans accents, pour que « reine » trouve « Reine des Neiges ».
const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const movies = moviesData.map(movie => ({
  ...movie,
  decade: Math.floor(movie.year / 10) * 10,
  searchKey: normalize(movie.title),
  upcoming: isUpcoming(movie),
}));
const releasedCount = movies.filter(movie => !movie.upcoming).length;
const validIds = new Set(movies.map(movie => String(movie.id)));
const decades = [...new Set(movies.map(movie => movie.decade))].sort((a, b) => a - b);

// Clé de date : la date de sortie si on la connaît, sinon la fin de l'année.
const dateKey = (movie) => movie.releaseDate ?? `${movie.year}-99`;

const SORTERS = {
  'year-asc': (a, b) => dateKey(a).localeCompare(dateKey(b)) || a.title.localeCompare(b.title, 'fr'),
  'year-desc': (a, b) => dateKey(b).localeCompare(dateKey(a)) || a.title.localeCompare(b.title, 'fr'),
  'title': (a, b) => a.title.localeCompare(b.title, 'fr'),
};

function App() {
  const [seenState, setSeenState] = useState(() => loadObject('disney-seen'));

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('unseen');
  const [category, setCategory] = useState('all');
  const [collection, setCollection] = useState('all');
  const [view, setView] = useState('grid');
  const [decade, setDecade] = useState('all');
  const [sort, setSort] = useState('year-asc');
  const [message, setMessage] = useState(null);
  const [showStats, setShowStats] = useState(false);
  // Liste figée au moment du tirage, pour que « Je l'ai vu » ne change pas le tirage en cours.
  const [randomPool, setRandomPool] = useState(null);
  const [detailMovie, setDetailMovie] = useState(null);
  const fileInputRef = useRef(null);
  // Évite d'afficher les badges débloqués lors d'un import (le message d'import suffit).
  const skipBadgeToast = useRef(false);

  useEffect(() => saveObject('disney-seen', seenState), [seenState]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleToggleSeen = (id) => {
    setSeenState(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const handleCollection = (value) => {
    setCollection(value);
    if (value !== 'all') setSort('collection-release');
    else if (sort.startsWith('collection')) setSort('year-asc');
  };

  const handleMarkSeen = (id) => {
    setSeenState(prev => ({ ...prev, [id]: true }));
  };

  const closeStats = useCallback(() => setShowStats(false), []);
  const closeRandom = useCallback(() => setRandomPool(null), []);
  const closeDetail = useCallback(() => setDetailMovie(null), []);

  const handleExport = () => {
    downloadProgress(seenState);
    setMessage({ type: 'success', text: 'Sauvegarde téléchargée.' });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseProgress(await file.text(), validIds);
      const count = Object.keys(imported).length;
      const ok = window.confirm(
        `Importer ${count} film(s) vu(s) ?\n` +
        'Ta progression actuelle sur cet appareil sera remplacée.'
      );
      if (!ok) return;
      skipBadgeToast.current = true;
      setSeenState(imported);
      setMessage({ type: 'success', text: `Import réussi : ${count} film(s) vu(s).` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const seenCount = movies.filter(movie => seenState[movie.id] && !movie.upcoming).length;

  const badges = useMemo(() => computeBadges(movies, seenState), [seenState]);
  const unlockedRef = useRef(null);
  useEffect(() => {
    const unlocked = badges.filter(b => b.unlocked);
    const previous = unlockedRef.current;
    unlockedRef.current = new Set(unlocked.map(b => b.id));
    if (!previous || skipBadgeToast.current) {
      skipBadgeToast.current = false;
      return;
    }
    const fresh = unlocked.filter(b => !previous.has(b.id));
    if (fresh.length === 1) {
      setMessage({ type: 'badge', text: `${fresh[0].icon} Badge débloqué : ${fresh[0].label}` });
    } else if (fresh.length > 1) {
      setMessage({ type: 'badge', text: `🏆 ${fresh.length} badges débloqués !` });
    }
  }, [badges]);

  const activeCollection = COLLECTIONS_BY_VALUE[collection];
  // Position de chaque film dans la collection choisie, selon l'ordre de tri (sortie ou chronologique).
  const positions = useMemo(() => {
    if (!activeCollection) return null;
    const order = sort === 'collection-chrono' && activeCollection.chrono ? activeCollection.chrono : activeCollection.release;
    return new Map(order.map((id, index) => [id, index + 1]));
  }, [activeCollection, sort]);

  const displayedMovies = useMemo(() => {
    const query = normalize(search.trim());
    const result = movies.filter(movie => {
      if (query && !movie.searchKey.includes(query)) return false;
      if (positions && !positions.has(movie.id)) return false;
      if (category !== 'all' && movie.category !== category) return false;
      if (decade !== 'all' && movie.decade !== Number(decade)) return false;
      if (status === 'unseen' && (seenState[movie.id] || movie.upcoming)) return false;
      if (status === 'seen' && !seenState[movie.id]) return false;
      if (status === 'upcoming' && !movie.upcoming) return false;
      return true;
    });
    const sorter = sort.startsWith('collection') && positions
      ? (a, b) => positions.get(a.id) - positions.get(b.id)
      : SORTERS[sort] ?? SORTERS['year-asc'];
    return result.sort(sorter);
  }, [search, category, decade, status, sort, seenState, positions]);

  const hasFilters = search || category !== 'all' || collection !== 'all' || decade !== 'all' || status !== 'all';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Disney & Pixar Tracker</h1>
          <div className="header-actions">
            <button
              className="stats-badge"
              onClick={() => setShowStats(true)}
              title="Voir mes statistiques"
            >
              {seenCount} / {releasedCount} vus · {Math.round((seenCount / releasedCount) * 100)} %
            </button>
            <button
              className="header-btn"
              onClick={() => setRandomPool(displayedMovies.filter(m => !seenState[m.id] && !m.upcoming))}
              title="Tirer au sort un film pas encore vu"
            >
              🎲 Au hasard
            </button>
            <button className="header-btn" onClick={handleExport} title="Télécharger ma progression">
              Exporter
            </button>
            <button className="header-btn" onClick={() => fileInputRef.current?.click()} title="Charger une sauvegarde">
              Importer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImportFile}
            />
          </div>
        </div>
        <Toolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          category={category}
          onCategory={setCategory}
          collection={collection}
          onCollection={handleCollection}
          view={view}
          onView={setView}
          decade={decade}
          onDecade={setDecade}
          decades={decades}
          sort={sort}
          onSort={setSort}
          resultCount={displayedMovies.length}
        />
      </header>

      {showStats && (
        <StatsPanel movies={movies} seenState={seenState} badges={badges} onClose={closeStats} />
      )}

      {detailMovie && (
        <MovieDetail
          movie={detailMovie}
          isSeen={!!seenState[detailMovie.id]}
          onToggleSeen={handleToggleSeen}
          onShowSaga={(value) => {
            setDetailMovie(null);
            setSearch('');
            setCategory('all');
            setDecade('all');
            setStatus('all');
            handleCollection(value);
            window.scrollTo(0, 0);
          }}
          onClose={closeDetail}
        />
      )}

      {randomPool && (
        <RandomPicker
          pool={randomPool}
          filtered={Boolean(search) || category !== 'all' || collection !== 'all' || decade !== 'all' || status === 'seen' || status === 'upcoming'}
          onMarkSeen={handleMarkSeen}
          onClose={closeRandom}
        />
      )}

      {message && (
        <div className={`toast toast-${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <main>
        {displayedMovies.length > 0 ? (
          <MovieList
            movies={displayedMovies}
            seenState={seenState}
            positions={sort.startsWith('collection') ? positions : null}
            view={view}
            onToggleSeen={handleToggleSeen}
            onOpen={setDetailMovie}
          />
        ) : (
          <div className="empty-state">
            <p>Aucun film ne correspond.</p>
            {hasFilters && (
              <button
                className="header-btn"
                onClick={() => { setSearch(''); setCategory('all'); handleCollection('all'); setDecade('all'); setStatus('all'); }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
