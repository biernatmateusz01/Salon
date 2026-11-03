"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { nowLocal, timeOf } from "@/lib/date";
import type { Appointment } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { EmptyState, ErrorNote, PageHeader, Spinner, StatusBadge } from "@/components/ui";

export function MyVisits() {
  const { t, fmt } = useI18n();
  const { data, loading, error, reload } = useApi<Appointment[]>("/appointments");
  const [actionError, setActionError] = useState<string | null>(null);
  const now = nowLocal();
  const upcoming = data?.filter((a) => a.status === "booked" && a.start_at > now) ?? [];
  const past = data?.filter((a) => !upcoming.includes(a)).reverse() ?? [];

  async function cancel(a: Appointment) {
    if (!confirm(t.my.cancelConfirm(a.service_name, fmt.longDay(a.start_at)))) return;
    setActionError(null);
    try {
      await api(`/appointments/${a.id}`, { method: "PATCH", json: { status: "cancelled" } });
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.my.title} />
      <ErrorNote message={error ?? actionError} />

      <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">{t.my.upcoming}</h2>
      {upcoming.length === 0 ? (
        <EmptyState title={t.my.emptyTitle} text={t.my.emptyText} cta={{ href: "/book", label: t.my.bookCta }} />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((a) => (
            <li key={a.id} className="card flex flex-wrap items-center gap-4 p-5">
              <div className="grid w-16 place-items-center rounded-xl bg-accent-soft py-2 text-accent">
                <span className="text-xs uppercase">{fmt.month(a.start_at)}</span>
                <span className="font-display text-2xl leading-none font-semibold">{Number(a.start_at.slice(8, 10))}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.service_name}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted">
                  <Clock className="mt-0.5 size-3.5 shrink-0" /> {fmt.longDay(a.start_at)}, {timeOf(a.start_at)}–{timeOf(a.end_at)}
                </p>
              </div>
              <button onClick={() => cancel(a)} className="btn-danger px-4 py-1.5">{t.my.cancel}</button>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-sm font-medium tracking-wide text-muted uppercase">{t.my.history}</h2>
          <ul className="card divide-y divide-border">
            {past.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{a.service_name}</p>
                  <p className="text-muted">{fmt.longDay(a.start_at)}, {timeOf(a.start_at)}</p>
                </div>
                <span className="text-muted">{fmt.price(a.price)}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
