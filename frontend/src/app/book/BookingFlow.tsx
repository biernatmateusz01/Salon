"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { addDays, formatLongDay, formatPrice, parseDate, today } from "@/lib/date";
import { useSession } from "@/lib/session";
import type { Appointment, Availability, OpeningHours, Service } from "@/lib/types";
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
      sessionStorage.setItem("salon.next", `/book?service=${serviceId}`);
      router.push("/login");
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
        <h1 className="mt-4 font-display text-3xl font-semibold">You&apos;re booked!</h1>
        <p className="mt-2 text-muted">
          {booked.service_name} on {formatLongDay(booked.start_at)} at {booked.start_at.slice(11)}.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/my" className="btn-primary">See my visits</Link>
          <button
            className="btn-ghost"
            onClick={() => {
              setBooked(null);
              setTime(null);
              setNotes("");
            }}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  if (session?.user.role === "admin") {
    return (
      <div className="card mx-auto max-w-md p-6 text-center">
        <p>Admins create bookings straight from the calendar.</p>
        <Link href="/admin" className="btn-primary mt-4">Open calendar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Book a visit" subtitle="Three quick steps and you're in the chair." />
      <div className="space-y-8">
        <Step n={1} title="Choose a service">
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
                    <Clock className="size-3.5" /> {s.duration_min} min
                  </p>
                </div>
                <span className="font-display text-lg font-semibold">{formatPrice(s.price)}</span>
              </button>
            ))}
          </div>
        </Step>

        {serviceId && (
          <Step n={2} title="Pick a day">
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
              {days.map((d) => {
                const dt = parseDate(d);
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
                    <span className="text-xs uppercase opacity-70">
                      {dt.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="text-xl font-semibold">{dt.getDate()}</span>
                    <span className="text-[11px] opacity-70">{dt.toLocaleDateString(undefined, { month: "short" })}</span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {serviceId && (
          <Step n={3} title={`Choose a time · ${formatLongDay(date)}`}>
            {availability.loading && <Spinner label="Checking availability…" />}
            <ErrorNote message={availability.error} />
            {availability.data && availability.data.slots.length === 0 && (
              <p className="card p-5 text-sm text-muted">
                {availability.data.open ? "Fully booked on this day — try another." : "We're closed on this day."}
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
                  {formatLongDay(date)} · {time} · {service.duration_min} min
                </p>
              </div>
              <span className="font-display text-xl font-semibold">{formatPrice(service.price)}</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know? (optional)"
              rows={2}
              className="input resize-none"
            />
            <ErrorNote message={error} />
            <button onClick={confirm} disabled={pending} className="btn-primary w-full">
              {pending ? "Booking…" : session ? "Confirm booking" : "Sign in to confirm"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
