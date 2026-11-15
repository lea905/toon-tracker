// Ouvre la fiche au clic ou avec Entrée / Espace.
export const openProps = (movie, onOpen) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': `Voir la fiche de « ${movie.title} »`,
    onClick: () => onOpen(movie),
    onKeyDown: (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(movie); }
    },
});
