"use client";

import { createContext, useContext, useMemo } from "react";
import { parseDate } from "@/lib/date";
import { dictionaries, intlLocale, plural, type Dictionary, type Locale, type Plural } from "./index";

type I18n = {
  lang: Locale;
  t: Dictionary;
  /** Prefix an app path with the current locale: href("/book") → "/pl/book". */
  href: (path: string) => string;
  plural: (n: number, forms: Plural) => string;
  fmt: {
    day: (date: string) => string;
    longDay: (date: string) => string;
    weekday: (date: string) => string;
    weekdayLong: (date: string) => string;
    month: (date: string) => string;
    price: (amount: number) => string;
  };
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const value = useMemo<I18n>(() => {
    const tag = intlLocale[lang];
    const date = (opts: Intl.DateTimeFormatOptions) => {
      const f = new Intl.DateTimeFormat(tag, opts);
      return (s: string) => f.format(parseDate(s));
    };
    const money = new Intl.NumberFormat(tag, { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
    return {
      lang,
      t: dictionaries[lang],
      href: (path) => `/${lang}${path === "/" ? "" : path}`,
      plural: (n, forms) => plural(lang, n, forms),
      fmt: {
        day: date({ weekday: "short", day: "numeric", month: "short" }),
        longDay: date({ weekday: "long", day: "numeric", month: "long" }),
        weekday: date({ weekday: "short" }),
        weekdayLong: date({ weekday: "long" }),
        month: date({ month: "short" }),
        price: (n) => money.format(n),
      },
    };
  }, [lang]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
