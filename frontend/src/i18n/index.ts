import en from "./dictionaries/en";
import es from "./dictionaries/es";
import pl from "./dictionaries/pl";
import ru from "./dictionaries/ru";
import type { Dictionary, Plural } from "./dictionaries/en";
import { intlLocale, type Locale } from "./config";

export type { Dictionary, Plural };
export * from "./config";

export const dictionaries: Record<Locale, Dictionary> = { pl, en, es, ru };

/** Pick the right plural form, e.g. plural("pl", 5, { one: "wizyta", few: "wizyty", many: "wizyt", other: "wizyty" }). */
export function plural(locale: Locale, n: number, forms: Plural) {
  return forms[new Intl.PluralRules(intlLocale[locale]).select(n)] ?? forms.other;
}
