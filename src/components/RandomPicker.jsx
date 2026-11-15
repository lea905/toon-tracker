import React, { useState } from 'react';
import Modal from './Modal';
import { CATEGORY_LABELS } from '../categories';
import './RandomPicker.css';

const pickOne = (pool, exclude) => {
    const choices = pool.length > 1 ? pool.filter(m => m.id !== exclude) : pool;
    return choices[Math.floor(Math.random() * choices.length)] ?? null;
};

// Tire au sort un film pas encore vu parmi `pool` (les films affichés avec les filtres en cours).
const RandomPicker = ({ pool, filtered, onMarkSeen, onClose }) => {
    const [movie, setMovie] = useState(() => pickOne(pool));
    const [marked, setMarked] = useState(false);

    const next = () => {
        setMovie(pickOne(pool, movie?.id));
        setMarked(false);
    };

    return (
        <Modal title="Film au hasard" onClose={onClose}>
            {movie ? (
                <div className="random-movie">
                    {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} />
                    ) : (
                        <div className="random-no-poster">Affiche à venir</div>
                    )}
                    <div className="random-info">
                        <h3>{movie.title}</h3>
                        <p>{movie.year} · {CATEGORY_LABELS[movie.category]}</p>
                        <p className="random-hint">
                            Tiré parmi {pool.length} film{pool.length > 1 ? 's' : ''} pas encore vu{pool.length > 1 ? 's' : ''}
                            {filtered ? ' (avec tes filtres actuels)' : ''}.
                        </p>
                        <div className="random-actions">
                            <button className="primary-btn" onClick={next} disabled={pool.length < 2}>
                                Un autre
                            </button>
                            <button
                                className="header-btn"
                                onClick={() => { onMarkSeen(movie.id); setMarked(true); }}
                                disabled={marked}
                            >
                                {marked ? 'Marqué comme vu ✓' : "Je l'ai vu"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="random-empty">
                    Tu as vu tous les films{filtered ? ' qui correspondent à tes filtres' : ''} ! 🎉
                </p>
            )}
        </Modal>
    );
};

export default RandomPicker;
