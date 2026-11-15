import React from 'react';
import { CATEGORY_BADGES, releaseCountdown } from '../categories';
import { classiqueNumber } from '../collections';
import { openProps } from '../openProps';
import './MovieCard.css';

export const SeenButton = ({ movie, isSeen, onToggleSeen }) => (
    <button
        className="seen-toggle"
        onClick={(e) => { e.stopPropagation(); onToggleSeen(movie.id); }}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label={isSeen ? `Marquer « ${movie.title} » comme non vu` : `Marquer « ${movie.title} » comme vu`}
        aria-pressed={isSeen}
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {isSeen ? <polyline points="5 12.5 10 17.5 19 7" /> : <path d="M12 6v12M6 12h12" />}
        </svg>
    </button>
);

export const MovieMeta = ({ movie }) => {
    const number = classiqueNumber(movie.id);
    return (
        <p className="year">
            {movie.year}
            {number && <span className="classique-tag" title={`${number}e Grand Classique Disney`}> · Classique n°{number}</span>}
        </p>
    );
};

const MovieCard = ({ movie, isSeen, position, onToggleSeen, onOpen }) => {
    return (
        <div className={`movie-card ${isSeen ? 'seen' : ''} ${movie.upcoming ? 'upcoming' : ''}`} {...openProps(movie, onOpen)}>
            <div className="card-image-container">
                {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} loading="lazy" />
                ) : (
                    <div className="poster-placeholder" role="img" aria-label={`${movie.title} : affiche à venir`}>
                        <span className="poster-placeholder-title">{movie.title}</span>
                        <span className="poster-placeholder-note">Affiche à venir</span>
                    </div>
                )}
                <div className="card-badges">
                    {position && <div className="position-badge" title="Position dans la saga">#{position}</div>}
                    <div className="category-badge" data-category={movie.category}>
                        {CATEGORY_BADGES[movie.category]}
                    </div>
                </div>
                {movie.upcoming ? (
                    <div className="upcoming-badge">{releaseCountdown(movie)}</div>
                ) : (
                    <SeenButton movie={movie} isSeen={isSeen} onToggleSeen={onToggleSeen} />
                )}
                {isSeen && !movie.upcoming && <div className="seen-ribbon">Vu</div>}
            </div>

            <div className="card-content">
                <h3 title={movie.title}>{movie.title}</h3>
                <MovieMeta movie={movie} />
            </div>
        </div>
    );
};

export default MovieCard;
