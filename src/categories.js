// Catégories des films, dans l'ordre d'affichage du filtre.
export const CATEGORIES = [
  { value: 'animation', label: 'Animation' },
  { value: 'pixar', label: 'Pixar' },
  { value: 'dreamworks', label: 'DreamWorks' },
  { value: 'illumination', label: 'Illumination' },
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

const DAY = 24 * 60 * 60 * 1000;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Texte du compte à rebours d'un film à venir : « Dans 10 jours », « Le 26 mai 2027 », « En 2028 ».
export function releaseCountdown(movie, today = new Date()) {
  if (!movie.releaseDate) return `En ${movie.year}`;
  const release = new Date(`${movie.releaseDate}T00:00:00`);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((release - startOfToday) / DAY);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days <= 60) return `Dans ${days} jours`;
  return `Le ${dateFormat.format(release)}`;
}
