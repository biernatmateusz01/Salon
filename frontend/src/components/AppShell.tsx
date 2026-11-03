"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, CalendarPlus, Home, LogOut, Scissors, User, Users, type LucideIcon } from "lucide-react";
import { setSession, useSession } from "@/lib/session";
import { stripLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavItem = { href: string; label: keyof Dictionary["nav"]; icon: LucideIcon };

const CLIENT_NAV: NavItem[] = [
  { href: "/", label: "home", icon: Home },
  { href: "/book", label: "book", icon: CalendarPlus },
  { href: "/my", label: "myVisits", icon: CalendarDays },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "calendar", icon: CalendarDays },
  { href: "/admin/clients", label: "clients", icon: Users },
  { href: "/admin/services", label: "services", icon: Scissors },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { t, href } = useI18n();
  const path = stripLocale(pathname);
  const isAdmin = session?.user.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : CLIENT_NAV;
  const isActive = (to: string) => (to === "/" || to === "/admin" ? path === to : path.startsWith(to));

  const logout = () => {
    setSession(null);
    router.push(href("/"));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href={href(isAdmin ? "/admin" : "/")} className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <Scissors className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Salon</span>
            {isAdmin && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{t.common.admin}</span>
            )}
          </Link>

          <nav className="hidden gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  isActive(item.href) ? "bg-surface-2 font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {t.nav[item.label]}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            {session === undefined ? null : session ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">{session.user.name}</span>
                <button onClick={logout} className="btn-ghost px-3 py-1.5" aria-label={t.common.signOut}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t.common.signOut}</span>
                </button>
              </>
            ) : (
              <Link href={href("/login")} className="btn-ghost px-3 py-1.5 sm:px-4">
                <User className="size-4" /> <span className="hidden sm:inline">{t.common.signIn}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:pb-12">{children}</main>

      {/* Bottom tab bar on mobile — feels native when installed as a PWA. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md">
          {nav.map(({ href: to, label, icon: Icon }) => (
            <Link
              key={to}
              href={href(to)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive(to) ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {t.nav[label]}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
