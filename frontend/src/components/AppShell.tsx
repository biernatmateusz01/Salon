"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, CalendarPlus, Home, LogOut, Scissors, User, Users, type LucideIcon } from "lucide-react";
import { setSession, useSession } from "@/lib/session";

type NavItem = { href: string; label: string; icon: LucideIcon };

const CLIENT_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: CalendarPlus },
  { href: "/my", label: "My visits", icon: CalendarDays },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Calendar", icon: CalendarDays },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/services", label: "Services", icon: Scissors },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = session?.user.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : CLIENT_NAV;
  const isActive = (href: string) =>
    href === "/" || href === "/admin" ? pathname === href : pathname.startsWith(href);

  const logout = () => {
    setSession(null);
    router.push("/");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <Scissors className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Salon</span>
            {isAdmin && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Admin</span>
            )}
          </Link>

          <nav className="hidden gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  isActive(item.href) ? "bg-surface-2 font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {session === undefined ? null : session ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">{session.user.name}</span>
                <button onClick={logout} className="btn-ghost px-3 py-1.5" aria-label="Sign out">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-ghost px-4 py-1.5">
                <User className="size-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:pb-12">{children}</main>

      {/* Bottom tab bar on mobile — feels native when installed as a PWA. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive(href) ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
