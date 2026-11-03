"use client";

import { useState } from "react";
import { Clock, Pencil, Plus } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { useI18n } from "@/i18n/I18nProvider";
import type { Service } from "@/lib/types";
import { ErrorNote, Modal, PageHeader, Spinner } from "@/components/ui";

export function ServicesView() {
  const { t, fmt } = useI18n();
  const { data, loading, error, reload } = useApi<Service[]>("/services?all=1");
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t.services.title}
        subtitle={t.services.subtitle}
        action={
          <button onClick={() => setEditing("new")} className="btn-primary">
            <Plus className="size-4" /> {t.services.add}
          </button>
        }
      />
      <ErrorNote message={error} />
      {loading && <Spinner />}
      <ul className="space-y-2">
        {data?.map((s) => (
          <li key={s.id} className={`card flex items-center gap-4 p-4 ${s.active ? "" : "opacity-55"}`}>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {s.name}
                {!s.active && <span className="ml-2 text-xs text-muted">{t.services.hidden}</span>}
              </p>
              <p className="truncate text-sm text-muted">{s.description}</p>
            </div>
            <span className="flex items-center gap-1 text-sm text-muted">
              <Clock className="size-3.5" /> {s.duration_min} {t.common.min}
            </span>
            <span className="w-20 text-right font-display text-lg font-semibold">{fmt.price(s.price)}</span>
            <button onClick={() => setEditing(s)} className="rounded-full p-2 text-muted hover:bg-surface-2" aria-label={t.services.edit(s.name)}>
              <Pencil className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <ServiceDialog service={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}

function ServiceDialog({ service, onClose, onSaved }: { service: Service | "new" | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const existing = service && service !== "new" ? service : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = {
      name: f.get("name"),
      description: f.get("description"),
      duration_min: Number(f.get("duration_min")),
      price: Number(f.get("price")),
      active: f.get("active") === "on",
    };
    setError(null);
    try {
      await api(existing ? `/services/${existing.id}` : "/services", { method: existing ? "PUT" : "POST", json });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal open={!!service} onClose={onClose} title={existing ? t.services.editTitle : t.services.newTitle}>
      <form key={existing?.id ?? "new"} onSubmit={onSubmit} className="space-y-3">
        <input name="name" required placeholder={t.services.name} defaultValue={existing?.name} className="input" />
        <textarea name="description" rows={2} placeholder={t.services.description} defaultValue={existing?.description} className="input resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="duration_min">{t.services.duration}</label>
            <input id="duration_min" name="duration_min" type="number" min={5} step={5} required defaultValue={existing?.duration_min ?? 30} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="price">{t.services.price}</label>
            <input id="price" name="price" type="number" min={0} step="any" required defaultValue={existing?.price ?? ""} className="input" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={existing ? !!existing.active : true} className="size-4 accent-[var(--accent)]" />
          {t.services.visible}
        </label>
        <ErrorNote message={error} />
        <button className="btn-primary w-full">{existing ? t.services.save : t.services.add}</button>
      </form>
    </Modal>
  );
}
