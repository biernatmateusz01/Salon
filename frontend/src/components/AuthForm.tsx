"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setSession } from "@/lib/session";
import type { User } from "@/lib/types";
import { ErrorNote } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { method: "POST", json: body });
      setSession(res);
      // Return to the page that sent us here (e.g. the booking flow), if any.
      const next = sessionStorage.getItem("salon.next");
      sessionStorage.removeItem("salon.next");
      router.replace(res.user.role === "admin" ? "/admin" : (next ?? "/my"));
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="font-display text-3xl font-semibold">{isRegister ? "Create account" : "Welcome back"}</h1>
      <p className="mt-1 mb-6 text-muted">
        {isRegister ? "Book and manage your visits in one place." : "Sign in to book and manage your visits."}
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required autoComplete="name" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" />
            </div>
          </>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
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
          {pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-medium text-accent">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
