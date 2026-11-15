import React from 'react';
import { CATEGORIES } from '../categories';
import { COLLECTIONS, COLLECTIONS_BY_VALUE } from '../collections';
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
    collection, onCollection,
    decade, onDecade, decades,
    sort, onSort,
    view, onView,
    resultCount,
}) => {
    const activeCollection = COLLECTIONS_BY_VALUE[collection];

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
                <div className="segmented view-toggle" role="group" aria-label="Affichage">
                    <button
                        type="button"
                        className={view === 'grid' ? 'active' : ''}
                        aria-pressed={view === 'grid'}
                        onClick={() => onView('grid')}
                        title="Affichage en grille"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="currentColor" /></svg>
                        <span className="sr-only">Grille</span>
                    </button>
                    <button
                        type="button"
                        className={view === 'list' ? 'active' : ''}
                        aria-pressed={view === 'list'}
                        onClick={() => onView('list')}
                        title="Affichage en liste"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v3H4zM4 10.5h16v3H4zM4 16h16v3H4z" fill="currentColor" /></svg>
                        <span className="sr-only">Liste</span>
                    </button>
                </div>
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
                <select
                    value={collection}
                    onChange={(e) => onCollection(e.target.value)}
                    aria-label="Filtrer par saga"
                    className={collection !== 'all' ? 'is-active' : ''}
                >
                    <option value="all">Toutes les sagas</option>
                    <option value="classiques">⭐ Grands Classiques Disney</option>
                    <optgroup label="Sagas">
                        {COLLECTIONS.filter(c => c.value !== 'classiques').map(({ value, label, release }) => (
                            <option key={value} value={value}>{label} ({release.length})</option>
                        ))}
                    </optgroup>
                </select>
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
                    {activeCollection && (
                        <option value="collection-release">
                            {collection === 'classiques' ? 'Numéro de classique' : 'Ordre de sortie de la saga'}
                        </option>
                    )}
                    {activeCollection?.chrono && (
                        <option value="collection-chrono">Ordre chronologique de l'histoire</option>
                    )}
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
