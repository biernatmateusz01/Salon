"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApi } from "@/lib/api";
import { addDays, parseDate, startOfWeek, timeOf, toMinutes, today } from "@/lib/date";
import { useI18n } from "@/i18n/I18nProvider";
import type { Appointment, AppointmentStatus, OpeningHours } from "@/lib/types";
import { ErrorNote } from "@/components/ui";
import { AppointmentDetailsDialog, NewAppointmentDialog } from "./AppointmentDialog";

const HOUR_PX = 64;
const SNAP_MIN = 15;

const BLOCK_STYLES: Record<AppointmentStatus, string> = {
  booked: "bg-accent-soft border-accent text-foreground",
  completed: "bg-success/15 border-success text-foreground",
  no_show: "bg-danger/10 border-danger text-muted",
  cancelled: "bg-surface-2 border-border text-muted line-through",
};

export function CalendarView() {
  const { t, fmt, plural } = useI18n();
  const [view, setView] = useState<"day" | "week">(() =>
    window.matchMedia("(min-width: 768px)").matches ? "week" : "day",
  );
  const [anchor, setAnchor] = useState(today);
  const [creating, setCreating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const days = view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)) : [anchor];
  const from = days[0];
  const to = days[days.length - 1];
  const appts = useApi<Appointment[]>(`/appointments?from=${from}&to=${to}`);
  const config = useApi<{ hours: OpeningHours }>("/config");

  // Visible hour range: earliest opening to latest closing across the week.
  const open = Object.values(config.data?.hours ?? {}).filter((h) => h !== null);
  const startHour = open.length ? Math.floor(Math.min(...open.map((h) => toMinutes(h.open))) / 60) : 8;
  const endHour = open.length ? Math.ceil(Math.max(...open.map((h) => toMinutes(h.close))) / 60) : 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const visible = appts.data?.filter((a) => a.status !== "cancelled") ?? [];
  const todays = visible.filter((a) => a.start_at.startsWith(today()));
  const revenue = visible.filter((a) => a.status !== "no_show").reduce((sum, a) => sum + a.price, 0);
  const step = view === "week" ? 7 : 1;

  function onColumnClick(day: string, e: React.MouseEvent<HTMLDivElement>) {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const min = startHour * 60 + Math.floor(((y / HOUR_PX) * 60) / SNAP_MIN) * SNAP_MIN;
    setCreating(`${day}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`);
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label={t.calendar.today} value={String(todays.length)} hint={plural(todays.length, t.calendar.appointments)} />
        <Stat
          label={view === "week" ? t.calendar.thisWeek : t.calendar.thisDay}
          value={String(visible.length)}
          hint={plural(visible.length, t.calendar.appointments)}
        />
        <Stat
          label={t.calendar.expectedRevenue}
          value={fmt.price(revenue)}
          hint={(view === "week" ? t.calendar.thisWeek : t.calendar.thisDay).toLowerCase()}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <button onClick={() => setAnchor(addDays(anchor, -step))} className="btn-ghost size-9 p-0" aria-label={t.calendar.previous}>
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setAnchor(today())} className="btn-ghost mx-1.5 px-4 py-1.5">{t.calendar.today}</button>
          <button onClick={() => setAnchor(addDays(anchor, step))} className="btn-ghost size-9 p-0" aria-label={t.calendar.next}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <h1 className="ml-1 font-display text-xl font-semibold">
          {view === "day" ? fmt.longDay(anchor) : `${fmt.day(from)} – ${fmt.day(to)}`}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-surface p-0.5 text-sm">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3.5 py-1 ${view === v ? "bg-foreground text-background" : "text-muted"}`}
              >
                {t.calendar[v]}
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(`${anchor}T${String(startHour).padStart(2, "0")}:00`)} className="btn-primary px-4 py-2">
            <Plus className="size-4" /> <span className="hidden sm:inline">{t.calendar.new}</span>
          </button>
        </div>
      </div>

      <ErrorNote message={appts.error} />

      <div className="card overflow-x-auto">
        <div className={view === "week" ? "min-w-[760px]" : ""}>
          {/* Day headers */}
          <div className="sticky top-0 z-10 flex border-b border-border bg-surface">
            <div className="w-14 shrink-0" />
            {days.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setAnchor(d);
                  setView("day");
                }}
                className="flex-1 border-l border-border py-2.5 text-center"
              >
                <span className="block text-xs text-muted uppercase">{fmt.weekday(d)}</span>
                <span
                  className={`mx-auto mt-0.5 grid size-8 place-items-center rounded-full text-lg font-semibold ${
                    d === today() ? "bg-accent text-accent-fg" : ""
                  }`}
                >
                  {parseDate(d).getDate()}
                </span>
              </button>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative flex pt-3 pb-2">
            <div className="w-14 shrink-0">
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="relative">
                  <span className="absolute -top-2 right-2 text-[11px] text-muted tabular-nums">{h}:00</span>
                </div>
              ))}
            </div>
            {days.map((d) => {
              const dayHours = config.data?.hours[parseDate(d).getDay()];
              return (
                <div
                  key={d}
                  className="relative flex-1 cursor-pointer border-l border-border"
                  style={{ height: hours.length * HOUR_PX }}
                  onClick={(e) => onColumnClick(d, e)}
                >
                  {hours.map((h) => (
                    <div key={h} style={{ top: (h - startHour) * HOUR_PX }} className="absolute inset-x-0 border-t border-border/70" />
                  ))}
                  {/* Shade closed hours */}
                  {config.data && (
                    <ClosedShade hours={dayHours ?? null} startHour={startHour} endHour={endHour} />
                  )}
                  {d === today() && <NowLine startHour={startHour} endHour={endHour} />}
                  {visible
                    .filter((a) => a.start_at.startsWith(d))
                    .map((a) => {
                      const top = ((toMinutes(timeOf(a.start_at)) - startHour * 60) / 60) * HOUR_PX;
                      const height = Math.max(((toMinutes(timeOf(a.end_at)) - toMinutes(timeOf(a.start_at))) / 60) * HOUR_PX, 22);
                      return (
                        <button
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(a);
                          }}
                          style={{ top, height }}
                          className={`absolute inset-x-1 z-[1] overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:brightness-95 ${BLOCK_STYLES[a.status]}`}
                        >
                          <p className="truncate font-semibold">{a.client_name}</p>
                          {height > 34 && (
                            <p className="truncate opacity-75">
                              {timeOf(a.start_at)} · {a.service_name}
                            </p>
                          )}
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NewAppointmentDialog start={creating} onClose={() => setCreating(null)} onSaved={appts.reload} />
      <AppointmentDetailsDialog appointment={selected} onClose={() => setSelected(null)} onSaved={appts.reload} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

function ClosedShade({ hours, startHour, endHour }: { hours: { open: string; close: string } | null; startHour: number; endHour: number }) {
  const total = (endHour - startHour) * 60;
  const pct = (min: number) => `${(min / total) * 100}%`;
  const cls = "pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--surface-2)_6px,var(--surface-2)_7px)]";
  if (!hours) return <div className={cls} style={{ top: 0, bottom: 0 }} />;
  const openMin = toMinutes(hours.open) - startHour * 60;
  const closeMin = toMinutes(hours.close) - startHour * 60;
  return (
    <>
      {openMin > 0 && <div className={cls} style={{ top: 0, height: pct(openMin) }} />}
      {closeMin < total && <div className={cls} style={{ top: pct(closeMin), bottom: 0 }} />}
    </>
  );
}

function NowLine({ startHour, endHour }: { startHour: number; endHour: number }) {
  const now = new Date();
  const min = now.getHours() * 60 + now.getMinutes() - startHour * 60;
  if (min < 0 || min > (endHour - startHour) * 60) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[2] h-0.5 bg-danger" style={{ top: (min / 60) * HOUR_PX }}>
      <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-danger" />
    </div>
  );
}
