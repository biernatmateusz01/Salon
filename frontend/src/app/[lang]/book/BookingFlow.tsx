"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { addDays, parseDate, today } from "@/lib/date";
import { useSession } from "@/lib/session";
import type { Appointment, Availability, OpeningHours, Service } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { ErrorNote, PageHeader, Spinner } from "@/components/ui";

const DAYS_AHEAD = 28;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-foreground text-xs text-background">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BookingFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const { t, href, fmt } = useI18n();
  const services = useApi<Service[]>("/services");
  const config = useApi<{ hours: OpeningHours }>("/config");

  const [serviceId, setServiceId] = useState<number | null>(() => Number(params.get("service")) || null);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [booked, setBooked] = useState<Appointment | null>(null);

  const availability = useApi<Availability>(serviceId ? `/appointments/availability?date=${date}&serviceId=${serviceId}` : null);
  const service = services.data?.find((s) => s.id === serviceId);
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today(), i));
  const isOpen = (d: string) => !config.data || !!config.data.hours[parseDate(d).getDay()];

  async function confirm() {
    if (!serviceId || !time) return;
    if (!session) {
      sessionStorage.setItem("salon.next", href(`/book?service=${serviceId}`));
      router.push(href("/login"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const appt = await api<Appointment>("/appointments", {
        method: "POST",
        json: { serviceId, start: `${date}T${time}`, notes },
      });
      setBooked(appt);
    } catch (e) {
      setError((e as Error).message);
      setTime(null);
      availability.reload();
    } finally {
      setPending(false);
    }
  }

  if (booked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-10 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="mt-4 font-display text-3xl font-semibold">{t.book.successTitle}</h1>
        <p className="mt-2 text-muted">
          {t.book.successText(booked.service_name, fmt.longDay(booked.start_at), booked.start_at.slice(11))}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href("/my")} className="btn-primary">{t.book.seeMyVisits}</Link>
          <button
            className="btn-ghost"
            onClick={() => {
              setBooked(null);
              setTime(null);
              setNotes("");
            }}
          >
            {t.book.bookAnother}
          </button>
        </div>
      </div>
    );
  }

  if (session?.user.role === "admin") {
    return (
      <div className="card mx-auto max-w-md p-6 text-center">
        <p>{t.book.adminNotice}</p>
        <Link href={href("/admin")} className="btn-primary mt-4">{t.book.openCalendar}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.book.title} subtitle={t.book.subtitle} />
      <div className="space-y-8">
        <Step n={1} title={t.book.chooseService}>
          {services.loading && <Spinner />}
          <div className="grid gap-2 sm:grid-cols-2">
            {services.data?.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServiceId(s.id);
                  setTime(null);
                }}
                className={`card flex items-center justify-between p-4 text-left transition ${
                  s.id === serviceId ? "border-accent ring-2 ring-accent/20" : "hover:border-accent/50"
                }`}
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <Clock className="size-3.5" /> {s.duration_min} {t.common.min}
                  </p>
                </div>
                <span className="font-display text-lg font-semibold">{fmt.price(s.price)}</span>
              </button>
            ))}
          </div>
        </Step>

        {serviceId && (
          <Step n={2} title={t.book.pickDay}>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
              {days.map((d) => {
                const open = isOpen(d);
                const active = d === date;
                return (
                  <button
                    key={d}
                    disabled={!open}
                    onClick={() => {
                      setDate(d);
                      setTime(null);
                    }}
                    className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-2xl border py-3 transition ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface hover:border-accent/50 disabled:opacity-35"
                    }`}
                  >
                    <span className="text-xs uppercase opacity-70">{fmt.weekday(d)}</span>
                    <span className="text-xl font-semibold">{parseDate(d).getDate()}</span>
                    <span className="text-[11px] opacity-70">{fmt.month(d)}</span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {serviceId && (
          <Step n={3} title={t.book.chooseTime(fmt.longDay(date))}>
            {availability.loading && <Spinner label={t.book.checking} />}
            <ErrorNote message={availability.error} />
            {availability.data && availability.data.slots.length === 0 && (
              <p className="card p-5 text-sm text-muted">
                {availability.data.open ? t.book.fullyBooked : t.book.closedDay}
              </p>
            )}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {availability.data?.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTime(slot)}
                  className={`rounded-xl border py-2.5 text-sm font-medium tabular-nums transition ${
                    slot === time
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface hover:border-accent/50"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </Step>
        )}

        {service && time && (
          <section className="card sticky bottom-24 space-y-4 p-5 shadow-lg md:bottom-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted">
                  {fmt.longDay(date)} · {time} · {service.duration_min} {t.common.min}
                </p>
              </div>
              <span className="font-display text-xl font-semibold">{fmt.price(service.price)}</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.book.notesPlaceholder}
              rows={2}
              className="input resize-none"
            />
            <ErrorNote message={error} />
            <button onClick={confirm} disabled={pending} className="btn-primary w-full">
              {pending ? t.book.booking : session ? t.book.confirm : t.book.signInToConfirm}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
