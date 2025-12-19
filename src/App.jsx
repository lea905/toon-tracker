import React, { useState, useEffect } from 'react';
import moviesData from './data/movies.json';
import MovieList from './components/MovieList';
import './App.css';

function App() {
  const [movies] = useState(moviesData);
  const [seenState, setSeenState] = useState(() => {
    const saved = localStorage.getItem('disney-seen');
    return saved ? JSON.parse(saved) : {};
  });

  const [ratings, setRatings] = useState(() => {
    const saved = localStorage.getItem('disney-ratings');
    return saved ? JSON.parse(saved) : {};
  });

  const [showSeen, setShowSeen] = useState(false);

  useEffect(() => {
    localStorage.setItem('disney-seen', JSON.stringify(seenState));
  }, [seenState]);

  useEffect(() => {
    localStorage.setItem('disney-ratings', JSON.stringify(ratings));
  }, [ratings]);

  const handleToggleSeen = (id) => {
    setSeenState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRate = (id, rating) => {
    setRatings(prev => ({
      ...prev,
      [id]: rating
    }));
    // If rated, assume seen? Optional logic. I'll leave it decoupled for now.
    // But usually if you rate it, you've seen it.
    if (!seenState[id]) {
      setSeenState(prev => ({ ...prev, [id]: true }));
    }
  };

  const seenCount = Object.values(seenState).filter(Boolean).length;

  const displayedMovies = movies.filter(movie => {
    if (showSeen) return true;
    return !seenState[movie.id];
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Disney & Pixar Tracker</h1>
          <div className="header-actions">
            <button
              className={`toggle-seen-btn ${showSeen ? 'active' : ''}`}
              onClick={() => setShowSeen(!showSeen)}
            >
              {showSeen ? 'Masquer Vus' : 'Voir Vus'}
            </button>
            <div className="stats-badge">
              <span>{seenCount} / {movies.length} Seen</span>
            </div>
          </div>
        </div>
      </header>
      <main>
        <MovieList
          movies={displayedMovies}
          seenState={seenState}
          ratings={ratings}
          onToggleSeen={handleToggleSeen}
          onRate={handleRate}
        />
      </main>
    </div>
  );
}

export default App;
