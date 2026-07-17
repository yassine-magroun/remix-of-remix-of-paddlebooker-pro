import { PRICE_MODIFIERS, WHATSAPP_NUMBER } from './constants';

export const formatPrice = (price: number): string =>
  `${Math.round(price)} TND`;

/** Adds n days to a YYYY-MM-DD string, safe against UTC shifting */
export const addDays = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

/** Short French date: "24/04/2026" */
export const formatDateShort = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const isWeekend = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00').getDay();
  return d === 0 || d === 6;
};

export const calculateTotal = (
  basePrice: number,
  durationHours: number,
  participantCount: number,
  weekend: boolean,
): number => {
  const durationMod = Math.max(0, durationHours - 1) * PRICE_MODIFIERS.durationHourExtra;
  const participantMod = Math.max(0, participantCount - 1) * PRICE_MODIFIERS.participantExtra;
  let total = basePrice + durationMod + participantMod;
  if (weekend) total *= 1 + PRICE_MODIFIERS.weekendSurcharge;
  return Math.round(total * 100) / 100;
};

export const getMinDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

/** Builds the pre-filled WhatsApp deep-link used on the booking success screen. */
export const buildWhatsAppUrl = (params: {
  reservationId: string;
  name: string;
  date: string;
  time: string;
  depositOption: 'Règlement Local' | 'En Ligne';
}): string => {
  const { reservationId, name, date, time, depositOption } = params;
  const message =
    `Bonjour Alo Paddle Zarzis, je souhaite finaliser ma réservation.\n` +
    `• Réf : ${reservationId}\n` +
    `• Nom : ${name}\n` +
    `• Session : ${date} à ${time}\n` +
    `• Option de dépôt choisie : ${depositOption}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

/**
 * Normalizes a booking's free-text phone field into wa.me's expected format
 * (digits only, with country code). Bookings are entered without validation,
 * so most local numbers arrive as 8 digits with no +216 prefix.
 */
export const normalizePhoneForWhatsApp = (rawPhone: string): string => {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('216')) return digits;
  return `216${digits}`;
};

/** Builds the WhatsApp deep-link staff use to send a customer their personal review link. */
export const buildReviewRequestWhatsAppUrl = (params: {
  phone: string;
  name: string;
  reviewUrl: string;
}): string => {
  const { phone, name, reviewUrl } = params;
  const firstName = name.trim().split(' ')[0] || name.trim();
  const message =
    `Bonjour ${firstName} ! Merci d'avoir choisi Alo Paddle Zarzis. ` +
    `On espère que la session vous a plu 🌊 Un avis de 30 secondes nous aide énormément : ${reviewUrl}`;
  return `https://wa.me/${normalizePhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
};
