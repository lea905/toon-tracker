import React from 'react';
import Modal from './Modal';
import './BadgesPanel.css';

const Badge = ({ badge }) => {
    const percent = badge.total ? Math.round((badge.done / badge.total) * 100) : 0;
    return (
        <li className={`badge ${badge.unlocked ? 'unlocked' : ''}`} title={badge.description}>
            <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
            <span className="badge-label">{badge.label}</span>
            <span className="badge-desc">{badge.description}</span>
            <span className="badge-progress">
                {badge.unlocked ? 'Débloqué ✓' : `${badge.done} / ${badge.total}`}
            </span>
            {!badge.unlocked && (
                <span className="badge-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
            )}
        </li>
    );
};

const BadgesPanel = ({ badges, onClose }) => {
    const unlocked = badges.filter(b => b.unlocked);
    // Les badges les plus proches d'être débloqués en premier.
    const locked = badges
        .filter(b => !b.unlocked)
        .sort((a, b) => (b.done / (b.total || 1)) - (a.done / (a.total || 1)));

    return (
        <Modal title="Mes badges" onClose={onClose}>
            <div className="badges-hero">
                <div className="badges-hero-number">🏆 {unlocked.length} / {badges.length}</div>
                <div className="badges-hero-text">
                    {unlocked.length === 0
                        ? 'Coche tes premiers films pour débloquer des badges !'
                        : unlocked.length === badges.length
                            ? 'Tu as tout débloqué, bravo !'
                            : 'badges débloqués. Les plus proches sont en tête de la liste ci-dessous.'}
                </div>
            </div>

            {unlocked.length > 0 && (
                <>
                    <h3 className="badges-section-title">Débloqués</h3>
                    <ul className="badge-grid">
                        {unlocked.map(badge => <Badge key={badge.id} badge={badge} />)}
                    </ul>
                </>
            )}

            {locked.length > 0 && (
                <>
                    <h3 className="badges-section-title">À débloquer</h3>
                    <ul className="badge-grid">
                        {locked.map(badge => <Badge key={badge.id} badge={badge} />)}
                    </ul>
                </>
            )}
        </Modal>
    );
};

export default BadgesPanel;
