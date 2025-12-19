import React from 'react';
import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({ movies, seenState, ratings, onToggleSeen, onRate }) => {
    return (
        <div className="movie-grid">
            {movies.map(movie => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSeen={!!seenState[movie.id]}
                    rating={ratings[movie.id] || 0}
                    onToggleSeen={onToggleSeen}
                    onRate={onRate}
                />
            ))}
        </div>
    );
};

export default MovieList;
