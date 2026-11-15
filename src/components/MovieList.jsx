import React, { memo, useEffect, useRef, useState } from 'react';
import MovieCard, { SeenButton, MovieMeta } from './MovieCard';
import { openProps } from '../openProps';
import { CATEGORY_BADGES, releaseCountdown } from '../categories';
import './MovieList.css';

// Nombre de films affichés d'un coup ; les suivants arrivent au fil du défilement.
const BATCH = 60;

// Ligne de l'affichage compact.
// memo : quand on coche un film, seule sa ligne est redessinée, pas les 700 autres.
const MovieRow = memo(({ movie, isSeen, position, onToggleSeen, onOpen }) => (
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
            {CATEGORY_BADGES[movie.category]}
        </span>
        <div className="row-action">
            {movie.upcoming ? (
                <span className="row-countdown">{releaseCountdown(movie)}</span>
            ) : (
                <SeenButton movie={movie} isSeen={isSeen} onToggleSeen={onToggleSeen} />
            )}
        </div>
    </li>
));

// `resetKey` change quand les filtres changent : on repart alors des premiers films.
// (Cocher un film ne change pas resetKey : la liste ne remonte pas d'un coup.)
const MovieList = ({ movies, seenState, positions, view, onToggleSeen, onOpen, resetKey }) => {
    const [visible, setVisible] = useState({ key: resetKey, count: BATCH });
    const sentinel = useRef(null);

    // Nouveaux filtres → on revient au premier lot (ajusté pendant le rendu, sans effet en plus).
    const count = visible.key === resetKey ? visible.count : BATCH;
    if (visible.key !== resetKey) setVisible({ key: resetKey, count: BATCH });

    const hasMore = count < movies.length;

    // Nouveaux filtres → on remonte en haut des résultats (sinon on resterait tout en bas
    // et tous les lots se rechargeraient d'un coup).
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        if (window.scrollY > 0) window.scrollTo({ top: 0 });
    }, [resetKey]);

    // Quand la fin de la liste approche de l'écran, on affiche le lot suivant.
    useEffect(() => {
        if (!hasMore || !sentinel.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                setVisible(v => ({ ...v, count: v.count + BATCH }));
            }
        }, { rootMargin: '1200px 0px' });
        observer.observe(sentinel.current);
        return () => observer.disconnect();
    }, [hasMore, count]);

    const shown = hasMore ? movies.slice(0, count) : movies;
    const Item = view === 'list' ? MovieRow : MovieCard;
    const items = shown.map(movie => (
        <Item
            key={movie.id}
            movie={movie}
            isSeen={!!seenState[movie.id]}
            position={positions?.get(movie.id)}
            onToggleSeen={onToggleSeen}
            onOpen={onOpen}
        />
    ));

    return (
        <>
            {view === 'list'
                ? <ul className="movie-rows">{items}</ul>
                : <div className="movie-grid">{items}</div>}
            {hasMore && (
                <div ref={sentinel} className="list-more" aria-hidden="true">
                    Chargement des films suivants…
                </div>
            )}
        </>
    );
};

export default MovieList;
