"use client";

import { useDeferredValue, useState } from "react";
import { Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { timeOf, today } from "@/lib/date";
import { useI18n } from "@/i18n/I18nProvider";
import { localeNames, locales } from "@/i18n/config";
import type { Client } from "@/lib/types";
import { EmptyState, ErrorNote, Modal, PageHeader, Spinner, StatusBadge } from "@/components/ui";

export function ClientsView() {
  const { t, fmt, plural } = useI18n();
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query);
  const list = useApi<Client[]>(`/clients?q=${encodeURIComponent(q)}`);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title={t.clients.title}
        subtitle={list.data ? `${list.data.length} ${plural(list.data.length, t.clients.count)}` : undefined}
        action={
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="size-4" /> {t.clients.add}
          </button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.clients.search}
          className="input pl-10"
          type="search"
        />
      </div>

      <ErrorNote message={list.error} />
      {list.loading && !list.data && <Spinner />}
      {list.data?.length === 0 && (
        <EmptyState title={t.clients.noneTitle} text={q ? t.clients.noneSearch : t.clients.noneEmpty} />
      )}

      {!!list.data?.length && (
        <ul className="card divide-y divide-border">
          {list.data.map((c) => (
            <li key={c.id}>
              <button onClick={() => setSelectedId(c.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2/60">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
                  {c.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted">{[c.phone, c.email].filter(Boolean).join(" · ") || t.clients.noContact}</p>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  <p>{c.visits} {plural(c.visits ?? 0, t.clients.visits)}</p>
                  <p className="text-muted">{c.last_visit
                      ? `${c.last_visit.slice(0, 10) >= today() ? t.clients.next : t.clients.last}: ${fmt.longDay(c.last_visit)}`
                      : t.clients.noVisits}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddClientDialog open={adding} onClose={() => setAdding(false)} onSaved={list.reload} />
      <ClientDialog id={selectedId} onClose={() => setSelectedId(null)} onChanged={list.reload} />
    </div>
  );
}

function AddClientDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await api("/clients", { method: "POST", json: Object.fromEntries(new FormData(e.currentTarget)) });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.clients.add}>
      <ClientFields onSubmit={onSubmit} error={error} submitLabel={t.clients.add} />
    </Modal>
  );
}

function ClientFields({
  client,
  onSubmit,
  error,
  submitLabel,
}: {
  client?: Client;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string | null;
  submitLabel: string;
}) {
  const { t, lang } = useI18n();
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required placeholder={t.auth.fullName} defaultValue={client?.name} className="input" />
      <div className="grid grid-cols-2 gap-2">
        <input name="phone" type="tel" placeholder={t.auth.phone} defaultValue={client?.phone ?? ""} className="input" />
        <input name="email" type="email" placeholder={t.auth.email} defaultValue={client?.email ?? ""} className="input" />
      </div>
      <textarea
        name="notes"
        rows={3}
        placeholder={t.clients.notesPlaceholder}
        defaultValue={client?.notes}
        className="input resize-none"
      />
      <label className="block">
        <span className="label">{t.clients.language}</span>
        <select name="locale" defaultValue={client?.locale ?? lang} className="input">
          {locales.map((l) => (
            <option key={l} value={l}>
              {localeNames[l]}
            </option>
          ))}
        </select>
      </label>
      <ErrorNote message={error} />
      <button className="btn-primary w-full">{submitLabel}</button>
    </form>
  );
}

function ClientDialog({ id, onClose, onChanged }: { id: number | null; onClose: () => void; onChanged: () => void }) {
  const { t, fmt } = useI18n();
  const { data: client, loading, reload } = useApi<Client>(id ? `/clients/${id}` : null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setEditing(false);
    setError(null);
    onClose();
  };

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/clients/${id}`, { method: "PUT", json: Object.fromEntries(new FormData(e.currentTarget)) });
      setEditing(false);
      reload();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove() {
    if (!client || !confirm(t.clients.deleteConfirm(client.name))) return;
    await api(`/clients/${client.id}`, { method: "DELETE" });
    onChanged();
    close();
  }

  const spent = client?.appointments?.filter((a) => a.status === "completed").reduce((s, a) => s + a.price, 0) ?? 0;

  return (
    <Modal open={!!id} onClose={close} title={client?.name ?? t.appointment.client}>
      {loading || !client ? (
        <Spinner />
      ) : editing ? (
        <ClientFields client={client} onSubmit={save} error={error} submitLabel={t.clients.saveChanges} />
      ) : (
        <div className="space-y-5">
          <div className="space-y-1.5 text-sm">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-accent">
                <Phone className="size-3.5" /> {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-accent">
                <Mail className="size-3.5" /> {client.email}
              </a>
            )}
            <p className="text-muted">{client.has_account ? t.clients.hasAccount : t.clients.noAccount} · {localeNames[client.locale]}</p>
            {client.notes && <p className="rounded-xl bg-surface-2 px-3 py-2 whitespace-pre-line">{client.notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 py-3">
              <p className="font-display text-xl font-semibold">{client.visits ?? client.appointments?.filter((a) => a.status === "completed").length}</p>
              <p className="text-xs text-muted">{t.clients.completedVisits}</p>
            </div>
            <div className="rounded-xl bg-surface-2 py-3">
              <p className="font-display text-xl font-semibold">{fmt.price(spent)}</p>
              <p className="text-xs text-muted">{t.clients.totalSpent}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">{t.clients.appointments}</h3>
            {client.appointments?.length ? (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {client.appointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{a.service_name}</p>
                      <p className="text-xs text-muted">{fmt.longDay(a.start_at)}, {timeOf(a.start_at)}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t.clients.noAppointments}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn-ghost flex-1">{t.clients.edit}</button>
            <button onClick={remove} className="btn-danger" aria-label={t.clients.delete}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
