import React from 'react';
import { CATEGORY_LABELS } from '../categories';
import './MovieCard.css';

const MovieCard = ({ movie, isSeen, onToggleSeen }) => {
    return (
        <div className={`movie-card ${isSeen ? 'seen' : ''} ${movie.upcoming ? 'upcoming' : ''}`}>
            <div className="card-image-container">
                {movie.poster ? (
                    <img src={movie.poster} alt={movie.title} loading="lazy" />
                ) : (
                    <div className="poster-placeholder" role="img" aria-label={`${movie.title} : affiche à venir`}>
                        <span className="poster-placeholder-title">{movie.title}</span>
                        <span className="poster-placeholder-note">Affiche à venir</span>
                    </div>
                )}
                <div className="category-badge" data-category={movie.category}>
                    {CATEGORY_LABELS[movie.category]}
                </div>
                {movie.upcoming ? (
                    <div className="upcoming-badge">Bientôt</div>
                ) : (
                    <button
                        className="seen-toggle"
                        onClick={() => onToggleSeen(movie.id)}
                        aria-label={isSeen ? `Marquer « ${movie.title} » comme non vu` : `Marquer « ${movie.title} » comme vu`}
                        aria-pressed={isSeen}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {isSeen ? <polyline points="5 12.5 10 17.5 19 7" /> : <path d="M12 6v12M6 12h12" />}
                        </svg>
                    </button>
                )}
                {isSeen && !movie.upcoming && <div className="seen-ribbon">Vu</div>}
            </div>

            <div className="card-content">
                <h3 title={movie.title}>{movie.title}</h3>
                <p className="year">{movie.year}</p>
            </div>
        </div>
    );
};

export default MovieCard;
