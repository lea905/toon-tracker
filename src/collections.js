// Collections de films : les Grands Classiques Disney (numérotés) et les sagas.
// Chaque collection liste des identifiants de movies.json :
//   - `release` : ordre de sortie
//   - `chrono`  : ordre chronologique de l'histoire (seulement quand il diffère)

// Les « Grands Classiques » : longs-métrages des Walt Disney Animation Studios, numérotés.
export const CLASSIQUES = [
  1, 3, 4, 7, 9, 5, 8, 10, 12, 14, // 1–10
  228, 13, 16, 18, 24, 35, 39, 50, 64, 72, // 11–20
  80, 87, 90, 105, 118, 121, 126, 128, 131, 133, // 21–30
  138, 146, 149, 158, 165, 172, 183, 185, 192, 196, // 31–40
  201, 208, 217, 236, 241, 263, 282, 301, 311, 319, // 41–50
  322, 342, 354, 366, 381, 391, 417, 426, 441, 446, // 51–60
  457, 467, 470, 480, 485, 488, // 61–66
];

const CLASSIQUE_NUMBERS = new Map(CLASSIQUES.map((id, index) => [id, index + 1]));

export const classiqueNumber = (movieId) => CLASSIQUE_NUMBERS.get(movieId) ?? null;

export const SAGAS = [
  {
    value: 'mcu',
    label: 'Marvel (MCU)',
    release: [289, 291, 313, 324, 328, 335, 347, 352, 358, 362, 371, 375, 384, 390, 396, 398, 402, 406, 409, 413, 418, 420, 423, 443, 439, 445, 447, 450, 452, 455, 458, 460, 466, 472, 474, 477, 492, 486, 489, 498, 501, 503],
    // Ordre de l'histoire (celui proposé par Disney+), approximatif pour les films à venir.
    chrono: [328, 418, 289, 313, 291, 324, 335, 352, 347, 358, 362, 396, 371, 375, 384, 443, 406, 398, 390, 402, 413, 409, 420, 439, 445, 423, 447, 450, 452, 455, 460, 458, 466, 472, 474, 477, 492, 486, 489, 498, 501, 503],
  },
  {
    value: 'star-wars',
    label: 'Star Wars',
    release: [89, 99, 112, 181, 207, 255, 380, 393, 405, 410, 427, 482, 493],
    chrono: [181, 207, 255, 410, 393, 89, 99, 112, 482, 380, 405, 427, 493],
  },
  {
    value: 'indiana-jones',
    label: 'Indiana Jones',
    release: [103, 115, 125, 290, 463],
    chrono: [115, 103, 125, 290, 463],
  },
  { value: 'toy-story', label: 'Toy Story', release: [151, 184, 315, 422, 451, 483] },
  { value: 'pirates', label: 'Pirates des Caraïbes', release: [224, 270, 280, 325, 397] },
  { value: 'reine-des-neiges', label: 'La Reine des Neiges', release: [354, 369, 426, 488] },
  { value: 'roi-lion', label: 'Le Roi Lion', release: [146, 177, 238, 424, 471], chrono: [471, 146, 238, 177, 424] },
  {
    value: 'monstres',
    label: 'Monstres & Cie',
    release: [206, 348],
    chrono: [348, 206],
  },
  { value: 'nemo', label: 'Le Monde de Nemo', release: [232, 386] },
  { value: 'indestructibles', label: 'Les Indestructibles', release: [248, 412, 500] },
  { value: 'cars', label: 'Cars', release: [269, 326, 399] },
  { value: 'vice-versa', label: 'Vice-Versa', release: [373, 468] },
  { value: 'coco', label: 'Coco', release: [403, 504] },
  { value: 'lilo-stitch', label: 'Lilo & Stitch', release: [208, 226, 262, 276, 475, 499] },
  { value: 'aladdin', label: 'Aladdin', release: [138, 148, 157, 421] },
  { value: 'zootopie', label: 'Zootopie', release: [381, 480] },
  { value: 'vaiana', label: 'Vaiana', release: [391, 470, 484] },
  { value: 'ralph', label: 'Les Mondes de Ralph', release: [342, 417] },
  { value: 'winnie', label: "Winnie l'Ourson", release: [87, 163, 190, 229, 243, 254, 322] },
  { value: 'clochette', label: 'La Fée Clochette', release: [297, 308, 318, 330, 339, 359, 370] },
  { value: 'tarzan', label: 'Tarzan', release: [183, 209, 261] },
  { value: 'frere-des-ours', label: 'Frère des ours', release: [236, 272] },
  { value: 'kuzco', label: 'Kuzco', release: [196, 264] },
  { value: 'coccinelle', label: 'La Coccinelle', release: [65, 82, 91, 101, 260] },
  { value: 'super-noel', label: 'Super Noël', release: [150, 220, 283] },
  { value: 'freaky-friday', label: 'Freaky Friday', release: [92, 235, 478] },
  { value: 'petits-champions', label: 'Les Petits Champions', release: [135, 145, 161] },
  { value: 'tron', label: 'Tron', release: [111, 320, 479] },
  { value: 'narnia', label: 'Narnia', release: [265, 294] },
  { value: 'benjamin-gates', label: 'Benjamin Gates', release: [250, 287] },
  { value: 'malefique', label: 'Maléfique', release: [360, 425] },
  { value: 'hocus-pocus', label: 'Hocus Pocus', release: [140, 454] },
  { value: 'il-etait-une-fois', label: 'Il était une fois', release: [284, 456] },
  { value: 'mary-poppins', label: 'Mary Poppins', release: [52, 416] },
];

// Toutes les collections proposées dans le filtre, Grands Classiques en premier.
export const COLLECTIONS = [
  { value: 'classiques', label: 'Grands Classiques Disney', release: CLASSIQUES },
  ...SAGAS,
];

export const COLLECTIONS_BY_VALUE = Object.fromEntries(COLLECTIONS.map(c => [c.value, c]));
