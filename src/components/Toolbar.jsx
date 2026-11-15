import React from 'react';
import { CATEGORIES } from '../categories';
import './Toolbar.css';

const STATUSES = [
    { value: 'unseen', label: 'À voir' },
    { value: 'seen', label: 'Vus' },
    { value: 'upcoming', label: 'Bientôt' },
    { value: 'all', label: 'Tous' },
];

const Toolbar = ({
    search, onSearch,
    status, onStatus,
    category, onCategory,
    decade, onDecade, decades,
    sort, onSort,
    resultCount,
}) => {
    return (
        <div className="toolbar">
            <div className="toolbar-row">
                <input
                    type="search"
                    className="search-input"
                    placeholder="Rechercher un film…"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    aria-label="Rechercher un film"
                />
            </div>
            <div className="toolbar-row">
                <div className="segmented" role="group" aria-label="Filtrer par statut">
                    {STATUSES.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            className={status === value ? 'active' : ''}
                            aria-pressed={status === value}
                            onClick={() => onStatus(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <select value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Filtrer par catégorie">
                    <option value="all">Toutes les catégories</option>
                    {CATEGORIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select value={decade} onChange={(e) => onDecade(e.target.value)} aria-label="Filtrer par décennie">
                    <option value="all">Toutes les années</option>
                    {decades.map(d => (
                        <option key={d} value={d}>Années {d}</option>
                    ))}
                </select>
                <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Trier">
                    <option value="year-asc">Plus anciens</option>
                    <option value="year-desc">Plus récents</option>
                    <option value="title">Titre A→Z</option>
                </select>
                <span className="result-count">{resultCount} film{resultCount > 1 ? 's' : ''}</span>
            </div>
        </div>
    );
};

export default Toolbar;
