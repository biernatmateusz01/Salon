"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { LOCALE_COOKIE, localeNames, locales, stripLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Remember the choice on the account too, so reminders arrive in this language.
    if (session) api("/auth/me", { method: "PATCH", json: { locale: next } }).catch(() => {});
    const rest = stripLocale(pathname);
    router.replace(`/${next}${rest === "/" ? "" : rest}${window.location.search}`);
  }

  return (
    <label className="relative flex items-center rounded-full border border-border bg-surface text-sm hover:bg-surface-2">
      <Globe className="pointer-events-none absolute left-2.5 size-4 text-muted" />
      <span className="sr-only">{t.common.language}</span>
      <select
        value={lang}
        onChange={(e) => change(e.target.value as Locale)}
        className="cursor-pointer appearance-none bg-transparent py-1.5 pr-3 pl-8 font-medium uppercase outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l} className="normal-case">
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
