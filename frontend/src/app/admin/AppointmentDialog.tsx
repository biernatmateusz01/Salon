"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { formatLongDay, formatPrice, timeOf } from "@/lib/date";
import type { Appointment, AppointmentStatus, Client, Service } from "@/lib/types";
import { ErrorNote, Modal, StatusBadge } from "@/components/ui";

/** Create a booking for a client from the admin calendar. */
export function NewAppointmentDialog({
  start,
  onClose,
  onSaved,
}: {
  start: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const services = useApi<Service[]>(start ? "/services" : null);
  const clients = useApi<Client[]>(start ? "/clients" : null);
  const [newClient, setNewClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setPending(true);
    setError(null);
    try {
      let clientId = Number(form.clientId);
      if (newClient) {
        const c = await api<Client>("/clients", {
          method: "POST",
          json: { name: form.name, phone: form.phone, email: form.email },
        });
        clientId = c.id;
      }
      await api("/appointments", {
        method: "POST",
        json: { clientId, serviceId: Number(form.serviceId), start: `${form.date}T${form.time}`, notes: form.notes },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={!!start} onClose={onClose} title="New appointment">
      {start && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label mb-0">Client</span>
              <button type="button" onClick={() => setNewClient((v) => !v)} className="text-sm font-medium text-accent">
                {newClient ? "Pick existing" : "+ New client"}
              </button>
            </div>
            {newClient ? (
              <div className="space-y-2">
                <input name="name" required placeholder="Full name" className="input" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="phone" type="tel" placeholder="Phone" className="input" />
                  <input name="email" type="email" placeholder="Email (optional)" className="input" />
                </div>
              </div>
            ) : (
              <select name="clientId" required className="input" defaultValue="">
                <option value="" disabled>Select a client…</option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label" htmlFor="serviceId">Service</label>
            <select id="serviceId" name="serviceId" required className="input">
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_min} min · {formatPrice(s.price)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="date">Date</label>
              <input id="date" name="date" type="date" required defaultValue={start.slice(0, 10)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="time">Time</label>
              <input id="time" name="time" type="time" step={300} required defaultValue={timeOf(start)} className="input" />
            </div>
          </div>
          <textarea name="notes" rows={2} placeholder="Notes (optional)" className="input resize-none" />
          <ErrorNote message={error} />
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Saving…" : "Create appointment"}
          </button>
        </form>
      )}
    </Modal>
  );
}

const ACTIONS: { status: AppointmentStatus; label: string; className: string }[] = [
  { status: "completed", label: "Mark completed", className: "btn-primary" },
  { status: "no_show", label: "No-show", className: "btn-ghost" },
  { status: "cancelled", label: "Cancel", className: "btn-danger" },
];

/** View and manage an existing appointment. */
export function AppointmentDetailsDialog({
  appointment: a,
  onClose,
  onSaved,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  async function update(json: Record<string, unknown>) {
    if (!a) return;
    setError(null);
    try {
      await api(`/appointments/${a.id}`, { method: "PATCH", json });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const close = () => {
    setRescheduling(false);
    setError(null);
    onClose();
  };

  return (
    <Modal open={!!a} onClose={close} title={a?.client_name ?? ""}>
      {a && (
        <div className="space-y-5">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{a.service_name}</span>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-muted">
              {formatLongDay(a.start_at)} · {timeOf(a.start_at)}–{timeOf(a.end_at)} · {formatPrice(a.price)}
            </p>
            {a.client_phone && (
              <a href={`tel:${a.client_phone}`} className="flex items-center gap-2 text-accent">
                <Phone className="size-3.5" /> {a.client_phone}
              </a>
            )}
            {a.client_email && (
              <a href={`mailto:${a.client_email}`} className="flex items-center gap-2 text-accent">
                <Mail className="size-3.5" /> {a.client_email}
              </a>
            )}
            {a.notes && <p className="rounded-xl bg-surface-2 px-3 py-2">{a.notes}</p>}
          </div>

          {rescheduling ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                update({ start: `${f.get("date")}T${f.get("time")}`, status: "booked" });
              }}
            >
              <input name="date" type="date" defaultValue={a.start_at.slice(0, 10)} className="input" required />
              <input name="time" type="time" step={300} defaultValue={timeOf(a.start_at)} className="input" required />
              <button className="btn-primary">Save</button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ACTIONS.filter((x) => x.status !== a.status).map((x) => (
                <button key={x.status} onClick={() => update({ status: x.status })} className={x.className}>
                  {x.label}
                </button>
              ))}
              {a.status !== "booked" && (
                <button onClick={() => update({ status: "booked" })} className="btn-ghost">Restore</button>
              )}
              <button onClick={() => setRescheduling(true)} className="btn-ghost">Reschedule</button>
            </div>
          )}
          <ErrorNote message={error} />
        </div>
      )}
    </Modal>
  );
}
