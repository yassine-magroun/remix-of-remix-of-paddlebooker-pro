import { PRICE_MODIFIERS } from './constants';

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
