"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { useApi } from "@/lib/api";
import { formatPrice } from "@/lib/date";
import { useSession } from "@/lib/session";
import type { OpeningHours, Service } from "@/lib/types";
import { ErrorNote, Spinner } from "@/components/ui";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Home() {
  const session = useSession();
  const services = useApi<Service[]>("/services");
  const config = useApi<{ hours: OpeningHours }>("/config");
  const firstName = session?.user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-background sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/40 blur-3xl" />
        <p className="text-sm tracking-[0.2em] uppercase opacity-70">Barber & Beauty</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
          {firstName ? `Welcome back, ${firstName}.` : "Look sharp. Book in seconds."}
        </h1>
        <p className="mt-4 max-w-md opacity-75">
          Pick a service, choose a time that suits you, and we&apos;ll take care of the rest.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book" className="btn bg-background text-foreground hover:bg-surface-2">
            Book a visit <ArrowRight className="size-4" />
          </Link>
          {session?.user.role === "admin" ? (
            <Link href="/admin" className="btn border border-background/30 hover:bg-background/10">
              Open admin calendar
            </Link>
          ) : session ? (
            <Link href="/my" className="btn border border-background/30 hover:bg-background/10">
              My visits
            </Link>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold">Services</h2>
        <ErrorNote message={services.error} />
        {services.loading && <Spinner />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.data?.map((s) => (
            <Link
              key={s.id}
              href={`/book?service=${s.id}`}
              className="card group flex flex-col p-5 transition hover:border-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{s.name}</h3>
                <span className="font-display text-lg font-semibold">{formatPrice(s.price)}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{s.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="size-3.5" /> {s.duration_min} min
                </span>
                <span className="text-accent opacity-0 transition group-hover:opacity-100">Book →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {config.data && (
        <section className="card p-5 sm:max-w-sm">
          <h2 className="mb-3 font-display text-lg font-semibold">Opening hours</h2>
          <dl className="space-y-1.5 text-sm">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const h = config.data!.hours[d];
              return (
                <div key={d} className="flex justify-between">
                  <dt className="text-muted">{DAY_NAMES[d]}</dt>
                  <dd>{h ? `${h.open} – ${h.close}` : "Closed"}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}
    </div>
  );
}
