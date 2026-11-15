import React from 'react';
import Modal from './Modal';
import { CATEGORIES } from '../categories';
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
                <div className="progress-fill" style={{ width: `${percent}%` }} />
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

const StatsPanel = ({ movies, seenState, onClose }) => {
    // Les films pas encore sortis ne comptent pas.
    const released = movies.filter(movie => !movie.upcoming);
    const seenTotal = released.filter(movie => seenState[movie.id]).length;
    const byCategory = countBy(released, seenState, m => m.category);
    const byDecade = countBy(released, seenState, m => m.decade);
    const upcomingCount = movies.length - released.length;

    return (
        <Modal title="Mes statistiques" onClose={onClose}>
            <div className="stats-hero">
                <div className="stats-hero-number">{released.length ? Math.round((seenTotal / released.length) * 100) : 0} %</div>
                <div className="stats-hero-text">
                    {seenTotal} films vus sur {released.length} sortis
                    {upcomingCount > 0 && <><br />{upcomingCount} films à venir</>}
                </div>
            </div>
            <ProgressRow label="Total" seen={seenTotal} total={released.length} />

            <h3 className="stats-section">Par catégorie</h3>
            {CATEGORIES.filter(c => byCategory.has(c.value)).map(c => (
                <ProgressRow key={c.value} label={c.label} {...byCategory.get(c.value)} />
            ))}

            <h3 className="stats-section">Par décennie</h3>
            {[...byDecade.keys()].sort((a, b) => a - b).map(decade => (
                <ProgressRow key={decade} label={`Années ${decade}`} {...byDecade.get(decade)} />
            ))}
        </Modal>
    );
};

export default StatsPanel;
