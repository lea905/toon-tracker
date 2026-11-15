import React, { useState } from 'react';
import Modal from './Modal';
import ShareImage from './ShareImage';
import { CATEGORIES } from '../categories';
import { CLASSIQUES, SAGAS } from '../collections';
import './StatsPanel.css';

const ProgressRow = ({ label, seen, total }) => {
    const percent = total ? Math.round((seen / total) * 100) : 0;
    return (
        <div className="progress-row">
            <div className="progress-label">
                <span>{label}</span>
                <span className="progress-numbers">{seen} / {total} · {percent} %</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                <div className={`progress-fill ${percent === 100 ? 'complete' : ''}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

const countBy = (movies, seenState, keyOf) => {
    const groups = new Map();
    for (const movie of movies) {
        const key = keyOf(movie);
        const g = groups.get(key) ?? { seen: 0, total: 0 };
        g.total++;
        if (seenState[movie.id]) g.seen++;
        groups.set(key, g);
    }
    return groups;
};

// Progression sur une liste d'identifiants, sans les films pas encore sortis.
const listStats = (ids, releasedIds, seenState) => {
    const available = ids.filter(id => releasedIds.has(id));
    return { seen: available.filter(id => seenState[id]).length, total: available.length };
};

const StatsPanel = ({ movies, seenState, badges, onOpenBadges, onClose }) => {
    const [sharing, setSharing] = useState(false);

    // Les films pas encore sortis ne comptent pas.
    const released = movies.filter(movie => !movie.upcoming);
    const releasedIds = new Set(released.map(movie => movie.id));
    const seenTotal = released.filter(movie => seenState[movie.id]).length;
    const byCategory = countBy(released, seenState, m => m.category);
    const byDecade = countBy(released, seenState, m => m.decade);
    const upcomingCount = movies.length - released.length;
    const classiques = listStats(CLASSIQUES, releasedIds, seenState);
    const sagas = SAGAS
        .map(saga => ({ ...saga, ...listStats(saga.release, releasedIds, seenState) }))
        .filter(saga => saga.total > 0)
        .sort((a, b) => (b.seen / b.total) - (a.seen / a.total) || a.label.localeCompare(b.label, 'fr'));
    const completedSagas = sagas.filter(s => s.seen === s.total).length;
    const unlockedCount = badges.filter(b => b.unlocked).length;

    if (sharing) {
        return (
            <Modal title="Partager ma progression" onClose={onClose}>
                <ShareImage
                    movies={movies}
                    seenState={seenState}
                    stats={{ seenTotal, releasedTotal: released.length, classiques, byCategory, unlockedCount, badgeCount: badges.length, completedSagas }}
                    onBack={() => setSharing(false)}
                />
            </Modal>
        );
    }

    return (
        <Modal title="Mes statistiques" onClose={onClose}>
            <div className="stats-hero">
                <div className="stats-hero-number">{released.length ? Math.round((seenTotal / released.length) * 100) : 0} %</div>
                <div className="stats-hero-text">
                    {seenTotal} films vus sur {released.length} sortis
                    {upcomingCount > 0 && <><br />{upcomingCount} films à venir</>}
                </div>
                <button className="primary-btn stats-share-btn" onClick={() => setSharing(true)}>
                    Partager
                </button>
            </div>
            <ProgressRow label="Total" {...{ seen: seenTotal, total: released.length }} />
            <ProgressRow label="⭐ Grands Classiques Disney" {...classiques} />

            <button className="stats-badges-link" onClick={onOpenBadges}>
                <span>🏆 Mes badges : <strong>{unlockedCount} / {badges.length}</strong> débloqués</span>
                <span aria-hidden="true">→</span>
            </button>

            <h3 className="stats-section">Par catégorie</h3>
            {CATEGORIES.filter(c => byCategory.has(c.value)).map(c => (
                <ProgressRow key={c.value} label={c.label} {...byCategory.get(c.value)} />
            ))}

            <details className="stats-details">
                <summary>Par saga · {completedSagas} terminée{completedSagas > 1 ? 's' : ''} sur {sagas.length}</summary>
                {sagas.map(saga => (
                    <ProgressRow key={saga.value} label={saga.label} seen={saga.seen} total={saga.total} />
                ))}
            </details>

            <details className="stats-details">
                <summary>Par décennie</summary>
                {[...byDecade.keys()].sort((a, b) => a - b).map(decade => (
                    <ProgressRow key={decade} label={`Années ${decade}`} {...byDecade.get(decade)} />
                ))}
            </details>
        </Modal>
    );
};

export default StatsPanel;
