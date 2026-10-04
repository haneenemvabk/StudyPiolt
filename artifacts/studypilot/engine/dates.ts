export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(days: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function parseIso(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function daysUntil(iso: string, from = new Date()) {
  const target = parseIso(iso).getTime();
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);
  return Math.ceil((target - start.getTime()) / 86400000);
}

export function weekdayLabel(iso: string) {
  return WEEKDAY_LABELS[parseIso(iso).getDay()];
}

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatShortDate(iso: string) {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function preferredStartTime(preferredTime: string) {
  if (preferredTime === 'Mornings') return '09:00';
  if (preferredTime === 'Afternoons') return '14:00';
  return '19:00';
}
