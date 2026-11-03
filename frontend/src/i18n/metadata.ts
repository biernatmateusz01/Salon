import type { Metadata } from "next";
import { defaultLocale, dictionaries, hasLocale, type Dictionary } from "./index";

/** `export const generateMetadata = pageTitle("login")` gives a page a translated <title>. */
export function pageTitle(key: keyof Dictionary["meta"]) {
  return async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
    const { lang } = await params;
    return { title: dictionaries[hasLocale(lang) ? lang : defaultLocale].meta[key] };
  };
}
