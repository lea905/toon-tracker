import React, { useState, useEffect, useMemo, useRef } from 'react';
import moviesData from './data/movies.json';
import MovieList from './components/MovieList';
import Toolbar from './components/Toolbar';
import { loadObject, saveObject, downloadProgress, parseProgress } from './storage';
import './App.css';

// Minuscules et sans accents, pour que « reine » trouve « Reine des Neiges ».
const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const movies = moviesData.map(movie => ({
  ...movie,
  decade: Math.floor(movie.year / 10) * 10,
  searchKey: normalize(movie.title),
}));
const validIds = new Set(movies.map(movie => String(movie.id)));
const decades = [...new Set(movies.map(movie => movie.decade))].sort((a, b) => a - b);

const SORTERS = {
  'year-asc': (a, b) => a.year - b.year || a.title.localeCompare(b.title, 'fr'),
  'year-desc': (a, b) => b.year - a.year || a.title.localeCompare(b.title, 'fr'),
  'title': (a, b) => a.title.localeCompare(b.title, 'fr'),
};

function App() {
  const [seenState, setSeenState] = useState(() => loadObject('disney-seen'));
  const [ratings, setRatings] = useState(() => loadObject('disney-ratings'));

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('unseen');
  const [decade, setDecade] = useState('all');
  const [sort, setSort] = useState('year-asc');
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => saveObject('disney-seen', seenState), [seenState]);
  useEffect(() => saveObject('disney-ratings', ratings), [ratings]);

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

  const handleRate = (id, rating) => {
    setRatings(prev => {
      const next = { ...prev };
      if (rating) next[id] = rating;
      else delete next[id];
      return next;
    });
    // Si on note un film, c'est qu'on l'a vu.
    if (rating && !seenState[id]) {
      setSeenState(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleExport = () => {
    downloadProgress(seenState, ratings);
    setMessage({ type: 'success', text: 'Sauvegarde téléchargée.' });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseProgress(await file.text(), validIds);
      const seenCount = Object.keys(imported.seen).length;
      const ratedCount = Object.keys(imported.ratings).length;
      const ok = window.confirm(
        `Importer ${seenCount} film(s) vu(s) et ${ratedCount} note(s) ?\n` +
        'Ta progression actuelle sur cet appareil sera remplacée.'
      );
      if (!ok) return;
      setSeenState(imported.seen);
      setRatings(imported.ratings);
      setMessage({ type: 'success', text: `Import réussi : ${seenCount} vu(s), ${ratedCount} note(s).` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const seenCount = movies.filter(movie => seenState[movie.id]).length;

  const displayedMovies = useMemo(() => {
    const query = normalize(search.trim());
    const result = movies.filter(movie => {
      if (query && !movie.searchKey.includes(query)) return false;
      if (decade !== 'all' && movie.decade !== Number(decade)) return false;
      if (status === 'unseen' && seenState[movie.id]) return false;
      if (status === 'seen' && !seenState[movie.id]) return false;
      if (status === 'rated' && !ratings[movie.id]) return false;
      return true;
    });
    const sorter = sort === 'rating'
      ? (a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0) || SORTERS['year-asc'](a, b)
      : SORTERS[sort];
    return result.sort(sorter);
  }, [search, decade, status, sort, seenState, ratings]);

  const hasFilters = search || decade !== 'all' || status !== 'all';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Disney & Pixar Tracker</h1>
          <div className="header-actions">
            <div className="stats-badge" title={`${Math.round((seenCount / movies.length) * 100)} % vus`}>
              <span>{seenCount} / {movies.length} vus</span>
            </div>
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
          decade={decade}
          onDecade={setDecade}
          decades={decades}
          sort={sort}
          onSort={setSort}
          resultCount={displayedMovies.length}
        />
      </header>

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
            ratings={ratings}
            onToggleSeen={handleToggleSeen}
            onRate={handleRate}
          />
        ) : (
          <div className="empty-state">
            <p>Aucun film ne correspond.</p>
            {hasFilters && (
              <button
                className="header-btn"
                onClick={() => { setSearch(''); setDecade('all'); setStatus('all'); }}
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
