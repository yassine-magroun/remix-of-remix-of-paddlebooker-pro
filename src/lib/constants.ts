import type { Experience } from './types';

const IMG_BASE = '/images/Sport-nautique-tunisie';

export const HERO_IMAGES = {
  paddle: `${IMG_BASE}/paddle-hero.jpg.jpeg`,
  kayak: `${IMG_BASE}/kayak-hero.jpg.jpeg`,
  wake: `${IMG_BASE}/wake-hero.jpg.jpeg`,
};

export const HERO_VIDEOS = [
  `${IMG_BASE}/alo-paddle-video.mov.mov`,
  `${IMG_BASE}/alo-paddle-video02.mov.mov`,
];

const LOGO = `${IMG_BASE}/logo-alo2.svg.PNG`;

export const BRAND_IMAGES = {
  logo: LOGO,
  logoFallback: LOGO,
  wordmark: LOGO,
  hero: HERO_IMAGES.paddle,
  featured: HERO_IMAGES.wake,
  about: `${IMG_BASE}/alo-paddle-galerie.png.jpeg`,
  // indices 0,3,5,7 utilisés comme fonds dans FoundersJourney
  gallery: [
    `${IMG_BASE}/alo-paddle-galerie.png.jpeg`,       // [0]
    `${IMG_BASE}/alo-paddle-galerie02.png.jpeg`,     // [1]
    `${IMG_BASE}/alo-paddle-galerie03.png.jpeg`,     // [2]
    `${IMG_BASE}/paddle-activity1.jpg.jpeg`,         // [3]
    `${IMG_BASE}/paddle-activity2.jpg.jpeg`,         // [4]
    `${IMG_BASE}/paddle-activity3.jpg.jpeg`,         // [5]
    `${IMG_BASE}/paddle-activity8.jpg.jpeg`,         // [6]
    `${IMG_BASE}/alo-paddle-velo.png.jpeg`,          // [7]
    `${IMG_BASE}/paddle-paddle-y.jpg.jpeg`,          // [8] — extension corrigée
  ],
};

// Zarzis, Tunisie
export const LOCATION = {
  name: 'Alo Paddle · Zarzis',
  address: 'Hessi Jerbi, Zarzis, Tunisie',
  lat: 33.5,
  lng: 11.1,
  mapsEmbed:
    'https://www.google.com/maps?q=Alo+paddle+Zarzis&output=embed',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Alo+paddle+Zarzis',
};

export const WEATHER = {
  windDangerKmh: 14,
};

export const SUNRISE_SLOTS = ['05:00', '06:15', '07:30'];
export const SUNSET_SLOTS  = ['17:00', '18:15'];
export const SUNSET_MIN_GROUP   = 6;
export const SCARCITY_THRESHOLD = 5;

export const GROUP_RATE = {
  priceTnd: 50,
  minPax: 17,
  maxPax: 24,
};

export const BRAND_SLOGAN_AR = 'المَوْجْ يْبَدِّلْ المٌودْ';
export const BRAND_SLOGAN_FR = "La vague change l'humeur";

export const MEETING_POINT = 'Hessi Jerbi, Zarzis';

export const BOOKING_SESSIONS = ['05:00', '06:15', '07:30', '17:00', '18:15'];

export const INVENTORY_MAX_UNITS = 23;

export const PRICING = {
  basePriceTnd: 50,
  extraHourTnd: 35,
  depositRate: 0.4,
};

export const BRAND_STORY = `Zarzis n'est pas qu'une côte, c'est une vibration. L'aventure Alo Paddle est née de deux jumeaux : l'un étudiant à Tunis, l'autre vivant en France. Séparés par la distance mais unis par la mer, nous avons commencé petit. Grâce à des rencontres formidables avec des passionnés locaux, nous avons bâti une équipe unie. Aujourd'hui, nous ne louons pas de matériel, nous offrons une expérience inoubliable qui grandit de bouche à oreille.`;

export const EXPERIENCE_CATALOG: Experience[] = [
  {
    id: 'paddle',
    name: 'Paddle',
    description:
      "La signature Alo Paddle : glissez sur les eaux cristallines de Zarzis, à votre rythme.",
    basePrice: 50,
    imageUrl: HERO_IMAGES.paddle,
    duration: '1h',
  },
  {
    id: 'kayak',
    name: 'Kayak',
    description:
      "Explorez les calanques du golfe de Boughrara en kayak. Silence, sel et horizon.",
    basePrice: 50,
    imageUrl: HERO_IMAGES.kayak,
    duration: '1h',
  },
  {
    id: 'wakeboard',
    name: 'Wakeboard',
    description:
      "La session sensation. Vitesse, saut et adrénaline tractée sur eaux ouvertes.",
    basePrice: 50,
    imageUrl: HERO_IMAGES.wake,
    duration: '1h',
  },
];

export const FEATURED_IMAGE = BRAND_IMAGES.hero;

export const TIME_SLOTS = ['09:00', '11:00', '14:00', '16:00'];

export const DURATION_OPTIONS = [
  { label: '1 heure', value: 1 },
  { label: '2 heures', value: 2 },
  { label: '3 heures', value: 3 },
];

export const SKILL_LEVELS = [
  { id: 'beginner', label: 'Débutant' },
  { id: 'intermediate', label: 'Intermédiaire' },
  { id: 'expert', label: 'Expert' },
] as const;

export const PRICE_MODIFIERS = {
  durationHourExtra: 34,
  participantExtra: 45,
  weekendSurcharge: 0.15,
};
