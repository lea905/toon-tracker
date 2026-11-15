// Catégories des films, dans l'ordre d'affichage du filtre.
// `group` sert à les ranger en deux rubriques dans le menu ; `short` est le nom affiché sur les cartes.
export const CATEGORIES = [
  { value: 'animation', label: 'Animation Disney', short: 'Disney', group: 'disney' },
  { value: 'pixar', label: 'Pixar', group: 'disney' },
  { value: 'live-action', label: 'Live-action', group: 'disney' },
  { value: 'marvel', label: 'Marvel', group: 'disney' },
  { value: 'lucasfilm', label: 'Lucasfilm', group: 'disney' },
  { value: 'documentary', label: 'Documentaire', group: 'disney' },
  { value: 'dreamworks', label: 'DreamWorks', group: 'studios' },
  { value: 'illumination', label: 'Illumination', group: 'studios' },
  { value: 'sony', label: 'Sony Animation', short: 'Sony', group: 'studios' },
  { value: 'blue-sky', label: 'Blue Sky', group: 'studios' },
  { value: 'paramount', label: 'Paramount', group: 'studios' },
  { value: 'warner', label: 'Warner Animation', short: 'Warner', group: 'studios' },
  { value: 'netflix', label: 'Netflix', group: 'studios' },
  { value: 'laika', label: 'Laika', group: 'studios' },
  { value: 'aardman', label: 'Aardman', group: 'studios' },
  { value: 'cartoon-saloon', label: 'Cartoon Saloon', group: 'studios' },
  { value: 'ghibli', label: 'Ghibli', group: 'studios' },
  { value: 'comix-wave', label: 'CoMix Wave', group: 'studios' },
];

export const CATEGORY_GROUPS = [
  { value: 'disney', label: 'Disney', allLabel: 'Tout Disney' },
  { value: 'studios', label: "Autres studios d'animation", allLabel: 'Tous les autres studios' },
];

// Filtre par catégorie : une catégorie précise, ou « group:disney » / « group:studios » pour tout un groupe.
const CATEGORY_GROUP_OF = Object.fromEntries(CATEGORIES.map(c => [c.value, c.group]));
export const matchesCategory = (movie, filter) => filter === 'all'
  || movie.category === filter
  || (filter.startsWith('group:') && CATEGORY_GROUP_OF[movie.category] === filter.slice(6));

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
export const CATEGORY_BADGES = Object.fromEntries(CATEGORIES.map(c => [c.value, c.short ?? c.label]));

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
