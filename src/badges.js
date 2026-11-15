// Badges à débloquer. Chaque badge calcule sa progression [fait, objectif]
// à partir des films déjà sortis et des films vus.
import { CATEGORIES } from './categories';
import { CLASSIQUES, SAGAS } from './collections';

const PIXAR_FEATURES = [151, 184, 206, 232, 248, 269, 281, 293, 305, 315, 326, 337, 348, 373, 378, 386, 399, 403, 412, 422, 428, 438, 442, 448, 451, 462, 468, 476, 481, 483, 487, 496, 500, 504];
const SAGA = Object.fromEntries(SAGAS.map(s => [s.value, s.release]));
// L'« Infinity Saga » : les 23 premiers films du MCU, d'Iron Man à Spider-Man : Far From Home.
const INFINITY_SAGA = SAGA.mcu.slice(0, 23);
const RENAISSANCE = CLASSIQUES.slice(27, 37); // Classiques n°28 (La Petite Sirène) à n°37 (Tarzan)
const AGE_D_OR = CLASSIQUES.slice(0, 5); // Classiques n°1 à n°5

// Progression sur une liste d'identifiants, en ignorant les films pas encore sortis.
const listProgress = (ids) => ({ released, seen }) => {
  const available = ids.filter(id => released.has(id));
  return [available.filter(id => seen[id]).length, available.length];
};

const countProgress = (goal) => ({ seenCount }) => [Math.min(seenCount, goal), goal];

export const BADGES = [
  { id: 'first', icon: '🎬', label: 'Le début du voyage', description: 'Voir un premier film', progress: countProgress(1) },
  { id: 'ten', icon: '🍿', label: 'Cinéphile en herbe', description: 'Voir 10 films', progress: countProgress(10) },
  { id: 'fifty', icon: '🎟️', label: 'Fan confirmé', description: 'Voir 50 films', progress: countProgress(50) },
  { id: 'hundred', icon: '💯', label: 'Centurion', description: 'Voir 100 films', progress: countProgress(100) },
  { id: 'two-fifty', icon: '📚', label: 'Encyclopédie Disney', description: 'Voir 250 films', progress: countProgress(250) },
  { id: 'age-d-or', icon: '🍎', label: "L'âge d'or", description: 'Les 5 premiers Grands Classiques (1937–1942)', progress: listProgress(AGE_D_OR) },
  { id: 'renaissance', icon: '🧜‍♀️', label: 'La Renaissance', description: 'Les Grands Classiques de La Petite Sirène à Tarzan', progress: listProgress(RENAISSANCE) },
  {
    id: 'half-classiques', icon: '⭐', label: 'À mi-chemin', description: 'La moitié des Grands Classiques',
    progress: (ctx) => { const [done, total] = listProgress(CLASSIQUES)(ctx); return [Math.min(done, Math.ceil(total / 2)), Math.ceil(total / 2)]; },
  },
  { id: 'all-classiques', icon: '🏰', label: 'Tous les Grands Classiques', description: 'Tous les Grands Classiques déjà sortis', progress: listProgress(CLASSIQUES) },
  { id: 'pixar', icon: '💡', label: 'Collectionneur Pixar', description: 'Tous les longs-métrages Pixar déjà sortis', progress: listProgress(PIXAR_FEATURES) },
  { id: 'toy-story', icon: '🚀', label: "Vers l'infini et au-delà", description: 'Toute la saga Toy Story', progress: listProgress(SAGA['toy-story']) },
  { id: 'star-wars', icon: '⚔️', label: 'Que la Force soit avec toi', description: 'Toute la saga Star Wars', progress: listProgress(SAGA['star-wars']) },
  { id: 'infinity', icon: '💎', label: 'Infinity Saga', description: "Les 23 premiers films Marvel, d'Iron Man à Far From Home", progress: listProgress(INFINITY_SAGA) },
  {
    id: 'explorer', icon: '🧭', label: 'Explorateur', description: 'Au moins un film dans chaque catégorie',
    progress: ({ releasedMovies, seen }) => {
      const done = CATEGORIES.filter(c => releasedMovies.some(m => m.category === c.value && seen[m.id])).length;
      return [done, CATEGORIES.length];
    },
  },
  {
    id: 'time-traveler', icon: '⏳', label: 'Voyageur du temps', description: 'Au moins un film de chaque décennie',
    progress: ({ releasedMovies, seen }) => {
      const decades = new Set(releasedMovies.map(m => m.decade));
      const done = new Set(releasedMovies.filter(m => seen[m.id]).map(m => m.decade));
      return [done.size, decades.size];
    },
  },
  {
    id: 'sagas', icon: '🏆', label: 'Maître des sagas', description: 'Terminer 5 sagas',
    progress: (ctx) => {
      const done = SAGAS.filter(s => { const [d, t] = listProgress(s.release)(ctx); return t > 0 && d === t; }).length;
      return [Math.min(done, 5), 5];
    },
  },
];

// Calcule l'état de tous les badges.
export function computeBadges(movies, seen) {
  const releasedMovies = movies.filter(m => !m.upcoming);
  const ctx = {
    seen,
    releasedMovies,
    released: new Set(releasedMovies.map(m => m.id)),
    seenCount: releasedMovies.filter(m => seen[m.id]).length,
  };
  return BADGES.map(badge => {
    const [done, total] = badge.progress(ctx);
    return { ...badge, done, total, unlocked: total > 0 && done >= total };
  });
}
