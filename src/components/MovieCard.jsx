import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, isSeen, rating, onToggleSeen, onRate }) => {
    return (
        <div className={`movie-card ${isSeen ? 'seen' : ''}`}>
            <div className="card-image-container">
                <img src={movie.poster} alt={movie.title} loading="lazy" />
                {movie.studio && (
                    <div className="studio-badge" data-studio={movie.studio}>
                        {movie.studio}
                    </div>
                )}
                <button
                    className="seen-toggle"
                    onClick={() => onToggleSeen(movie.id)}
                    aria-label={isSeen ? `Marquer « ${movie.title} » comme non vu` : `Marquer « ${movie.title} » comme vu`}
                    aria-pressed={isSeen}
                >
                    {isSeen ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>

            <div className="card-content">
                <h3 title={movie.title}>{movie.title}</h3>
                <p className="year">{movie.year}</p>

                <div className="rating-container" role="group" aria-label={`Note de « ${movie.title} »`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`star ${star <= rating ? 'filled' : ''}`}
                            // Recliquer sur la note actuelle la retire.
                            onClick={() => onRate(movie.id, star === rating ? 0 : star)}
                            aria-label={star === rating ? `Retirer la note (${star} sur 5)` : `Noter ${star} sur 5`}
                            aria-pressed={star <= rating}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
