"use client";

import { useSyncExternalStore } from "react";
import type { User } from "./types";

// Tiny auth store backed by localStorage, read through useSyncExternalStore.
type Session = { token: string; user: User } | null;

const KEY = "salon.session";
const listeners = new Set<() => void>();
let cached: Session | undefined;
let cachedRaw: string | null = null;

function read(): Session {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (cached !== undefined && raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    cached = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function emit() {
  listeners.forEach((l) => l());
}

export function setSession(session: Session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {}
  emit();
}

export function getToken() {
  return typeof window === "undefined" ? null : (read()?.token ?? null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Returns `undefined` while hydrating, `null` when signed out. */
export function useSession(): Session | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
