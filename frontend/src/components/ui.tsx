"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { useSession } from "@/lib/session";
import type { AppointmentStatus, Role } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="size-4 animate-spin" /> {label ?? t.common.loading}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{message}</p>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  booked: "bg-accent-soft text-accent",
  completed: "bg-success/15 text-success",
  cancelled: "bg-surface-2 text-muted line-through",
  no_show: "bg-danger/10 text-danger",
};
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useI18n();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {t.status[status]}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-surface-2" aria-label={t.common.close}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Renders children only for a signed-in user with the given role; otherwise redirects. */
export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const { href } = useI18n();
  const allowed = session && session.user.role === role;

  useEffect(() => {
    if (session === null) router.replace(href("/login"));
    else if (session && session.user.role !== role) router.replace(href(session.user.role === "admin" ? "/admin" : "/"));
  }, [session, role, router, href]);

  if (!allowed) return <Spinner />;
  return <>{children}</>;
}

export function EmptyState({ title, text, cta }: { title: string; text: string; cta?: { href: string; label: string } }) {
  const { href } = useI18n();
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted">{text}</p>
      {cta && (
        <Link href={href(cta.href)} className="btn-primary mt-3">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
