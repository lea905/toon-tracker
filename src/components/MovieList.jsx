import React from 'react';
import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({ movies, seenState, onToggleSeen }) => {
    return (
        <div className="movie-grid">
            {movies.map(movie => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSeen={!!seenState[movie.id]}
                    onToggleSeen={onToggleSeen}
                />
            ))}
        </div>
    );
};

export default MovieList;
