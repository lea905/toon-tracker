import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { SeenButton } from './MovieCard';
import { CATEGORY_LABELS, releaseCountdown } from '../categories';
import { classiqueNumber, SAGAS } from '../collections';
import './MovieDetail.css';

// Les infos détaillées (résumé, durée…) sont dans un fichier à part, chargé seulement
// à l'ouverture d'une fiche pour ne pas alourdir le premier chargement du site.
let detailsPromise = null;
const loadDetails = () => {
    detailsPromise ??= import('../data/details.json').then(m => m.default).catch(() => ({}));
    return detailsPromise;
};

const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

const MovieDetail = ({ movie, isSeen, onToggleSeen, onShowSaga, onClose }) => {
    const [details, setDetails] = useState(undefined);

    useEffect(() => {
        let cancelled = false;
        loadDetails().then(all => { if (!cancelled) setDetails(all[movie.id] ?? null); });
        return () => { cancelled = true; };
    }, [movie.id]);

    const number = classiqueNumber(movie.id);
    const sagas = SAGAS
        .filter(s => s.release.includes(movie.id))
        .map(s => ({ ...s, position: s.release.indexOf(movie.id) + 1 }));
    const runtime = formatRuntime(details?.runtime);

    return (
        <Modal title={movie.title} onClose={onClose}>
            <div className="detail">
                <div className="detail-poster">
                    {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} />
                    ) : (
                        <div className="detail-no-poster">Affiche à venir</div>
                    )}
                </div>

                <div className="detail-body">
                    {details?.originalTitle && details.originalTitle !== movie.title && (
                        <p className="detail-original">{details.originalTitle}</p>
                    )}

                    <div className="detail-tags">
                        <span className="category-badge" data-category={movie.category}>{CATEGORY_LABELS[movie.category]}</span>
                        <span className="detail-tag">{movie.year}</span>
                        {runtime && <span className="detail-tag">{runtime}</span>}
                        {number && <span className="detail-tag detail-classique">⭐ Classique n°{number}</span>}
                    </div>

                    {details?.director && (
                        <p className="detail-line">
                            <strong>Réalisation :</strong>{' '}
                            {(() => {
                                const names = details.director.split(', ');
                                return names.length > 3 ? `${names.slice(0, 3).join(', ')}…` : details.director;
                            })()}
                        </p>
                    )}
                    {details?.genres?.length > 0 && (
                        <p className="detail-line"><strong>Genres :</strong> {details.genres.join(', ')}</p>
                    )}

                    {details === undefined && <p className="detail-muted">Chargement…</p>}
                    {details?.overview && <p className="detail-overview">{details.overview}</p>}
                    {details === null && (
                        <p className="detail-muted">Pas encore d'infos détaillées pour ce film.</p>
                    )}

                    {sagas.length > 0 && (
                        <div className="detail-sagas">
                            {sagas.map(s => (
                                <button key={s.value} className="detail-saga" onClick={() => onShowSaga(s.value)}>
                                    {s.label} · #{s.position} sur {s.release.length}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="detail-actions">
                        {movie.upcoming ? (
                            <span className="detail-countdown">Sortie : {releaseCountdown(movie)}</span>
                        ) : (
                            <label className="detail-seen">
                                <SeenButton movie={movie} isSeen={isSeen} onToggleSeen={onToggleSeen} />
                                <span>{isSeen ? 'Vu' : 'Pas encore vu'}</span>
                            </label>
                        )}
                        {details?.trailer && (
                            <a
                                className="primary-btn detail-trailer"
                                href={`https://www.youtube.com/watch?v=${details.trailer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ▶ Bande-annonce
                            </a>
                        )}
                    </div>

                    {details && (
                        <p className="detail-credit">
                            Infos :{' '}
                            <a href={`https://www.themoviedb.org/movie/${details.tmdbId}`} target="_blank" rel="noopener noreferrer">TMDB</a>
                            . Ce site utilise l'API TMDB sans être approuvé ni certifié par TMDB.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MovieDetail;
