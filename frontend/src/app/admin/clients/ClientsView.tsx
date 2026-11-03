"use client";

import { useDeferredValue, useState } from "react";
import { Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { formatLongDay, formatPrice, timeOf, today } from "@/lib/date";
import type { Client } from "@/lib/types";
import { EmptyState, ErrorNote, Modal, PageHeader, Spinner, StatusBadge } from "@/components/ui";

export function ClientsView() {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query);
  const list = useApi<Client[]>(`/clients?q=${encodeURIComponent(q)}`);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={list.data ? `${list.data.length} ${list.data.length === 1 ? "client" : "clients"}` : undefined}
        action={
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="size-4" /> Add client
          </button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email"
          className="input pl-10"
          type="search"
        />
      </div>

      <ErrorNote message={list.error} />
      {list.loading && !list.data && <Spinner />}
      {list.data?.length === 0 && (
        <EmptyState title="No clients found" text={q ? "Try a different search." : "Clients appear here when they sign up or when you add them."} />
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
                  <p className="truncate text-sm text-muted">{[c.phone, c.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  <p>{c.visits} {c.visits === 1 ? "visit" : "visits"}</p>
                  <p className="text-muted">{c.last_visit
                      ? `${c.last_visit.slice(0, 10) >= today() ? "Next" : "Last"}: ${formatLongDay(c.last_visit)}`
                      : "No visits yet"}</p>
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
    <Modal open={open} onClose={onClose} title="Add client">
      <ClientFields onSubmit={onSubmit} error={error} submitLabel="Add client" />
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
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required placeholder="Full name" defaultValue={client?.name} className="input" />
      <div className="grid grid-cols-2 gap-2">
        <input name="phone" type="tel" placeholder="Phone" defaultValue={client?.phone ?? ""} className="input" />
        <input name="email" type="email" placeholder="Email" defaultValue={client?.email ?? ""} className="input" />
      </div>
      <textarea
        name="notes"
        rows={3}
        placeholder="Notes — preferences, allergies, usual style…"
        defaultValue={client?.notes}
        className="input resize-none"
      />
      <ErrorNote message={error} />
      <button className="btn-primary w-full">{submitLabel}</button>
    </form>
  );
}

function ClientDialog({ id, onClose, onChanged }: { id: number | null; onClose: () => void; onChanged: () => void }) {
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
    if (!client || !confirm(`Delete ${client.name} and all their appointments?`)) return;
    await api(`/clients/${client.id}`, { method: "DELETE" });
    onChanged();
    close();
  }

  const spent = client?.appointments?.filter((a) => a.status === "completed").reduce((s, a) => s + a.price, 0) ?? 0;

  return (
    <Modal open={!!id} onClose={close} title={client?.name ?? "Client"}>
      {loading || !client ? (
        <Spinner />
      ) : editing ? (
        <ClientFields client={client} onSubmit={save} error={error} submitLabel="Save changes" />
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
            <p className="text-muted">{client.has_account ? "Has an online account" : "Added by the salon (no online account)"}</p>
            {client.notes && <p className="rounded-xl bg-surface-2 px-3 py-2 whitespace-pre-line">{client.notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 py-3">
              <p className="font-display text-xl font-semibold">{client.visits ?? client.appointments?.filter((a) => a.status === "completed").length}</p>
              <p className="text-xs text-muted">completed visits</p>
            </div>
            <div className="rounded-xl bg-surface-2 py-3">
              <p className="font-display text-xl font-semibold">{formatPrice(spent)}</p>
              <p className="text-xs text-muted">total spent</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Appointments</h3>
            {client.appointments?.length ? (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {client.appointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{a.service_name}</p>
                      <p className="text-xs text-muted">{formatLongDay(a.start_at)}, {timeOf(a.start_at)}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No appointments yet.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn-ghost flex-1">Edit</button>
            <button onClick={remove} className="btn-danger" aria-label="Delete client">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
