"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setSession } from "@/lib/session";
import type { User } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { ErrorNote } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t, lang, href } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = { ...Object.fromEntries(new FormData(e.currentTarget)), locale: lang };
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { method: "POST", json: body });
      setSession(res);
      // Return to the page that sent us here (e.g. the booking flow), if any.
      const next = sessionStorage.getItem("salon.next");
      sessionStorage.removeItem("salon.next");
      router.replace(res.user.role === "admin" ? href("/admin") : (next ?? href("/my")));
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="font-display text-3xl font-semibold">{isRegister ? t.auth.registerTitle : t.auth.loginTitle}</h1>
      <p className="mt-1 mb-6 text-muted">{isRegister ? t.auth.registerSubtitle : t.auth.loginSubtitle}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <label className="label" htmlFor="name">{t.auth.fullName}</label>
              <input id="name" name="name" required autoComplete="name" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="phone">{t.auth.phone}</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" />
            </div>
          </>
        )}
        <div>
          <label className="label" htmlFor="email">{t.auth.email}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.auth.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isRegister ? 6 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="input"
          />
        </div>
        <ErrorNote message={error} />
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? t.auth.pleaseWait : isRegister ? t.auth.createAccount : t.auth.signIn}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? t.auth.haveAccount : t.auth.newHere}{" "}
        <Link href={href(isRegister ? "/login" : "/register")} className="font-medium text-accent">
          {isRegister ? t.auth.signIn : t.auth.createAnAccount}
        </Link>
      </p>
    </div>
  );
}
