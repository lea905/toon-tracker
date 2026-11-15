import React, { useState } from 'react';
import Modal from './Modal';
import { CATEGORY_LABELS } from '../categories';
import './RandomPicker.css';

const pickOne = (choices) => choices[Math.floor(Math.random() * choices.length)] ?? null;

// Tire au sort un film pas encore vu parmi `pool` (les films affichés avec les filtres en cours).
// Un film marqué « Je l'ai vu » est retiré de la liste : il ne peut plus ressortir.
const RandomPicker = ({ pool, filtered, onMarkSeen, onClose }) => {
    const [remaining, setRemaining] = useState(pool);
    const [movie, setMovie] = useState(() => pickOne(pool));
    const [drawnFrom, setDrawnFrom] = useState(pool.length);
    const [marked, setMarked] = useState(false);

    // Films encore tirables, sans celui affiché.
    const others = remaining.filter(m => m.id !== movie?.id);

    const next = () => {
        setMovie(pickOne(others));
        setDrawnFrom(remaining.length); // films pas encore vus au moment du tirage
        setMarked(false);
    };

    const markSeen = () => {
        onMarkSeen(movie.id);
        setRemaining(list => list.filter(m => m.id !== movie.id));
        setMarked(true);
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
                            Tiré parmi {drawnFrom} film{drawnFrom > 1 ? 's' : ''} pas encore vu{drawnFrom > 1 ? 's' : ''}
                            {filtered ? ' (avec tes filtres actuels)' : ''}.
                        </p>
                        <div className="random-actions">
                            <button className="primary-btn" onClick={next} disabled={!marked && others.length === 0}>
                                Un autre
                            </button>
                            <button className="header-btn" onClick={markSeen} disabled={marked}>
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
