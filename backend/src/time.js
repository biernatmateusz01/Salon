// Helpers for local wall-clock times stored as "YYYY-MM-DDTHH:mm".

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isDateTime = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);

export const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

export function addMinutes(dateTime, minutes) {
  const [date, time] = dateTime.split('T');
  const total = toMinutes(time) + minutes;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.floor(total / 1440));
  return `${d.toISOString().slice(0, 10)}T${fromMinutes(((total % 1440) + 1440) % 1440)}`;
}

export function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
