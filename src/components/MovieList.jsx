import React from 'react';
import MovieCard, { SeenButton, MovieMeta } from './MovieCard';
import { openProps } from '../openProps';
import { CATEGORY_LABELS, releaseCountdown } from '../categories';
import './MovieList.css';

// Ligne de l'affichage compact.
const MovieRow = ({ movie, isSeen, position, onToggleSeen, onOpen }) => (
    <li className={`movie-row ${isSeen ? 'seen' : ''} ${movie.upcoming ? 'upcoming' : ''}`} {...openProps(movie, onOpen)}>
        {position && <span className="row-position">#{position}</span>}
        {movie.poster ? (
            <img className="row-thumb" src={movie.poster} alt="" loading="lazy" />
        ) : (
            <div className="row-thumb row-thumb-empty" aria-hidden="true" />
        )}
        <div className="row-info">
            <span className="row-title" title={movie.title}>{movie.title}</span>
            <MovieMeta movie={movie} />
        </div>
        <span className="category-badge row-category" data-category={movie.category}>
            {CATEGORY_LABELS[movie.category]}
        </span>
        <div className="row-action">
            {movie.upcoming ? (
                <span className="row-countdown">{releaseCountdown(movie)}</span>
            ) : (
                <SeenButton movie={movie} isSeen={isSeen} onToggleSeen={onToggleSeen} />
            )}
        </div>
    </li>
);

const MovieList = ({ movies, seenState, positions, view, onToggleSeen, onOpen }) => {
    if (view === 'list') {
        return (
            <ul className="movie-rows">
                {movies.map(movie => (
                    <MovieRow
                        key={movie.id}
                        movie={movie}
                        isSeen={!!seenState[movie.id]}
                        position={positions?.get(movie.id)}
                        onToggleSeen={onToggleSeen}
                        onOpen={onOpen}
                    />
                ))}
            </ul>
        );
    }

    return (
        <div className="movie-grid">
            {movies.map(movie => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSeen={!!seenState[movie.id]}
                    position={positions?.get(movie.id)}
                    onToggleSeen={onToggleSeen}
                    onOpen={onOpen}
                />
            ))}
        </div>
    );
};

export default MovieList;
