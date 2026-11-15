// Catégories des films, dans l'ordre d'affichage du filtre.
export const CATEGORIES = [
  { value: 'animation', label: 'Animation' },
  { value: 'pixar', label: 'Pixar' },
  { value: 'live-action', label: 'Live-action' },
  { value: 'marvel', label: 'Marvel' },
  { value: 'lucasfilm', label: 'Lucasfilm' },
  { value: 'documentary', label: 'Documentaire' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

// Un film est « à venir » si sa date de sortie (ou, à défaut, son année) n'est pas encore passée.
export function isUpcoming(movie, today = new Date()) {
  if (movie.releaseDate) return new Date(movie.releaseDate) > today;
  return movie.year > today.getFullYear();
}
