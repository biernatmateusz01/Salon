export const locales = ["pl", "en", "es", "ru"] as const;
export type Locale = (typeof locales)[number];

/** Used when the browser's language isn't one we support. */
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const localeNames: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  es: "Español",
  ru: "Русский",
};

/** BCP 47 tags for Intl date/number formatting. */
export const intlLocale: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  es: "es-ES",
  ru: "ru-RU",
};

/** Strip the "/pl" style prefix from a pathname. */
export const stripLocale = (pathname: string) => pathname.replace(/^\/(pl|en|es|ru)(?=\/|$)/, "") || "/";
