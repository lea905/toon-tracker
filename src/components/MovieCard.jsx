import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, isSeen, rating, onToggleSeen, onRate }) => {
    return (
        <div className={`movie-card ${isSeen ? 'seen' : ''}`}>
            <div className="card-image-container">
                <img src={movie.poster} alt={movie.title} loading="lazy" />
                <div className="studio-badge" data-studio={movie.studio}>
                    {movie.studio}
                </div>
                <button
                    className="seen-toggle"
                    onClick={() => onToggleSeen(movie.id)}
                    aria-label={isSeen ? "Mark as unseen" : "Mark as seen"}
                >
                    {isSeen ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>

            <div className="card-content">
                <h3>{movie.title}</h3>
                <p className="year">{movie.year}</p>

                <div className="rating-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={`star ${star <= rating ? 'filled' : ''}`}
                            onClick={() => onRate(movie.id, star)}
                        >
                            ★
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
