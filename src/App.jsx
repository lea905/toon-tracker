import React, { useState, useEffect, useMemo, useRef } from 'react';
import moviesData from './data/movies.json';
import MovieList from './components/MovieList';
import Toolbar from './components/Toolbar';
import { isUpcoming } from './categories';
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

const SORTERS = {
  'year-asc': (a, b) => a.year - b.year || a.title.localeCompare(b.title, 'fr'),
  'year-desc': (a, b) => b.year - a.year || a.title.localeCompare(b.title, 'fr'),
  'title': (a, b) => a.title.localeCompare(b.title, 'fr'),
};

function App() {
  const [seenState, setSeenState] = useState(() => loadObject('disney-seen'));

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('unseen');
  const [category, setCategory] = useState('all');
  const [decade, setDecade] = useState('all');
  const [sort, setSort] = useState('year-asc');
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

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
      setSeenState(imported);
      setMessage({ type: 'success', text: `Import réussi : ${count} film(s) vu(s).` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const seenCount = movies.filter(movie => seenState[movie.id] && !movie.upcoming).length;

  const displayedMovies = useMemo(() => {
    const query = normalize(search.trim());
    const result = movies.filter(movie => {
      if (query && !movie.searchKey.includes(query)) return false;
      if (category !== 'all' && movie.category !== category) return false;
      if (decade !== 'all' && movie.decade !== Number(decade)) return false;
      if (status === 'unseen' && (seenState[movie.id] || movie.upcoming)) return false;
      if (status === 'seen' && !seenState[movie.id]) return false;
      if (status === 'upcoming' && !movie.upcoming) return false;
      return true;
    });
    return result.sort(SORTERS[sort]);
  }, [search, category, decade, status, sort, seenState]);

  const hasFilters = search || category !== 'all' || decade !== 'all' || status !== 'all';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Disney & Pixar Tracker</h1>
          <div className="header-actions">
            <div className="stats-badge" title={`${Math.round((seenCount / releasedCount) * 100)} % vus`}>
              <span>{seenCount} / {releasedCount} vus</span>
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
          category={category}
          onCategory={setCategory}
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
            onToggleSeen={handleToggleSeen}
          />
        ) : (
          <div className="empty-state">
            <p>Aucun film ne correspond.</p>
            {hasFilters && (
              <button
                className="header-btn"
                onClick={() => { setSearch(''); setCategory('all'); setDecade('all'); setStatus('all'); }}
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
