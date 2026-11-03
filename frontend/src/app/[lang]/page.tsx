"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { useApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { OpeningHours, Service } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { ErrorNote, Spinner } from "@/components/ui";

// 2024-01-01 was a Monday, so these dates give weekday names in Mon…Sun order.
const WEEK = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "2024-01-06", "2024-01-07"];

export default function Home() {
  const { t, href, fmt } = useI18n();
  const session = useSession();
  const services = useApi<Service[]>("/services");
  const config = useApi<{ hours: OpeningHours }>("/config");
  const firstName = session?.user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-background sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/40 blur-3xl" />
        <p className="text-sm tracking-[0.2em] uppercase opacity-70">{t.home.tagline}</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
          {firstName ? t.home.welcome(firstName) : t.home.title}
        </h1>
        <p className="mt-4 max-w-md opacity-75">{t.home.intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={href("/book")} className="btn bg-background text-foreground hover:bg-surface-2">
            {t.home.bookCta} <ArrowRight className="size-4" />
          </Link>
          {session?.user.role === "admin" ? (
            <Link href={href("/admin")} className="btn border border-background/30 hover:bg-background/10">
              {t.home.adminCta}
            </Link>
          ) : session ? (
            <Link href={href("/my")} className="btn border border-background/30 hover:bg-background/10">
              {t.home.myVisitsCta}
            </Link>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold">{t.home.services}</h2>
        <ErrorNote message={services.error} />
        {services.loading && <Spinner />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.data?.map((s) => (
            <Link
              key={s.id}
              href={href(`/book?service=${s.id}`)}
              className="card group flex flex-col p-5 transition hover:border-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{s.name}</h3>
                <span className="font-display text-lg font-semibold">{fmt.price(s.price)}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{s.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="size-3.5" /> {s.duration_min} {t.common.min}
                </span>
                <span className="text-accent opacity-0 transition group-hover:opacity-100">{t.home.bookArrow}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {config.data && (
        <section className="card p-5 sm:max-w-sm">
          <h2 className="mb-3 font-display text-lg font-semibold">{t.home.openingHours}</h2>
          <dl className="space-y-1.5 text-sm">
            {WEEK.map((date, i) => {
              const h = config.data!.hours[(i + 1) % 7];
              return (
                <div key={date} className="flex justify-between">
                  <dt className="text-muted capitalize">{fmt.weekdayLong(date)}</dt>
                  <dd>{h ? `${h.open} – ${h.close}` : t.home.closed}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}
    </div>
  );
}
