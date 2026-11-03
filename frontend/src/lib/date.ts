// Dates are handled as local "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm" strings, matching the API.

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toDateStr(new Date());

export function addDays(s: string, days: number) {
  const d = parseDate(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Monday of the week containing `s`. */
export function startOfWeek(s: string) {
  const day = parseDate(s).getDay();
  return addDays(s, day === 0 ? -6 : 1 - day);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const timeOf = (dt: string) => dt.slice(11, 16);

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, opts);
export const formatDay = (s: string) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(parseDate(s));
export const formatLongDay = (s: string) =>
  fmt({ weekday: "long", day: "numeric", month: "long" }).format(parseDate(s));
export const formatWeekday = (s: string) => fmt({ weekday: "short" }).format(parseDate(s));

export const formatPrice = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
