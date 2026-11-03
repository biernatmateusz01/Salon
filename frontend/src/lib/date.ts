// Dates are handled as local "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm" strings, matching the API.
// Locale-aware formatting lives in useI18n().fmt.

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toDateStr(new Date());

export const nowLocal = () => `${today()}T${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;

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
