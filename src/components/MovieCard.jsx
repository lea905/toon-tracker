import React from 'react';
import { CATEGORY_LABELS } from '../categories';
import './MovieCard.css';

const MovieCard = ({ movie, isSeen, onToggleSeen }) => {
    return (
        <div className={`movie-card ${isSeen ? 'seen' : ''} ${movie.upcoming ? 'upcoming' : ''}`}>
            <div className="card-image-container">
                <img src={movie.poster} alt={movie.title} loading="lazy" />
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
                        {isSeen ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}
            </div>

            <div className="card-content">
                <h3 title={movie.title}>{movie.title}</h3>
                <p className="year">{movie.year}</p>
            </div>
        </div>
    );
};

export default MovieCard;
