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

const LOGO = `${IMG_BASE}/alo-paddle-calligraphie.png`;

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
  basePriceTnd: 45,
  extraHourTnd: 35,
  depositRate: 0.4,
};

export interface BookableActivity {
  id: 'paddle' | 'kayak-transparent' | 'paddle-velo';
  label: string;
  duration: string;
  price: number;
  allowExtraHours: boolean;
  tagline: { fr: string; en: string };
}

// The three real, live-bookable sessions — single source of truth shared by
// the booking widget and the pricing page so their numbers can never drift apart.
export const BOOKABLE_ACTIVITIES: BookableActivity[] = [
  {
    id: 'paddle',
    label: 'Paddle',
    duration: '1h',
    price: PRICING.basePriceTnd,
    allowExtraHours: true,
    tagline: {
      fr: "Notre signature : glissez sur les eaux cristallines de Zarzis, à votre rythme.",
      en: 'Our signature session: glide across the crystal waters of Zarzis, at your own pace.',
    },
  },
  {
    id: 'kayak-transparent',
    label: 'Kayak Transparent',
    duration: '25 min',
    price: 50,
    allowExtraHours: false,
    tagline: {
      fr: 'Un kayak à fond transparent pour observer les fonds marins de Zarzis.',
      en: 'A clear-bottom kayak for observing the seabed of Zarzis.',
    },
  },
  {
    id: 'paddle-velo',
    label: 'Paddle Vélo',
    duration: '1h',
    price: 60,
    allowExtraHours: false,
    tagline: {
      fr: 'Le paddle à pédales : stabilité et originalité pour explorer la côte.',
      en: 'Pedal-powered paddle board: stability and originality to explore the coast.',
    },
  },
];

export const WHATSAPP_NUMBER = '21623708993';

// Google Business Profile isn't finalized yet (service-area setup pending) —
// this is a plain Maps search link. Swap for
// `https://search.google.com/local/writereview?placeid=<PLACE_ID>` once the
// listing has a real Place ID, so the review composer opens in one tap
// instead of landing on the business's Maps page.
const DEFAULT_GOOGLE_REVIEW_URL = 'https://maps.google.com/?q=Alo+Paddle+Zarzis';
// TripAdvisor listing not published yet — placeholder for end-to-end testing.
const DEFAULT_TRIPADVISOR_REVIEW_URL = 'https://www.tripadvisor.fr/AloPaddleZarzisPlaceholder';

export const REVIEW_ROUTING = {
  googleUrl: import.meta.env.VITE_GOOGLE_REVIEW_URL || DEFAULT_GOOGLE_REVIEW_URL,
  // Empty string (not a placeholder) hides the TripAdvisor button — set
  // VITE_TRIPADVISOR_REVIEW_URL='' to disable it once the listing lapses.
  tripadvisorUrl: import.meta.env.VITE_TRIPADVISOR_REVIEW_URL ?? DEFAULT_TRIPADVISOR_REVIEW_URL,
  positiveThreshold: 4, // rating >= this routes to Google/TripAdvisor; below stays private
  linkExpiryDays: 14,
} as const;

// Placeholder — replace with the real PayPal.me / payment-gateway link.
export const ONLINE_PAYMENT_LINK = 'https://paypal.me/YassineMagroun';

// Wero (French/European bank wallet) — deposits sent by phone number, no
// public deep-link scheme exists yet, so the UI offers a copy-to-clipboard
// action instead of a clickable payment link.
export const WERO_PHONE_DISPLAY = '+33 7 59 21 41 87';

export const BRAND_STORY = `Zarzis n'est pas qu'une côte, c'est une vibration. L'aventure Alo Paddle est née de deux jumeaux : l'un étudiant à Tunis, l'autre vivant en France. Séparés par la distance mais unis par la mer, nous avons commencé petit. Grâce à des rencontres formidables avec des passionnés locaux, nous avons bâti une équipe unie. Aujourd'hui, nous ne louons pas de matériel, nous offrons une expérience inoubliable qui grandit de bouche à oreille.`;

export const EXPERIENCE_CATALOG: Experience[] = [
  {
    id: 'paddle',
    name: 'Paddle',
    description:
      "La signature Alo Paddle : glissez sur les eaux cristallines de Zarzis, à votre rythme.",
    basePrice: 45,
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
