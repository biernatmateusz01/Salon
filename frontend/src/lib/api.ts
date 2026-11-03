"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken, setSession } from "./session";
import { defaultLocale, dictionaries, hasLocale } from "@/i18n";

/** Translate an API error code into the page's current language. */
function errorText(code: string, fallback?: string) {
  const lang = document.documentElement.lang;
  const errors = dictionaries[hasLocale(lang) ? lang : defaultLocale].errors;
  return errors[code] ?? fallback ?? errors.error;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  }).catch(() => {
    throw new ApiError(0, "network", errorText("network"));
  });
  if (res.status === 401 && token) setSession(null);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code ?? (res.status >= 500 ? "server_error" : "error");
    throw new ApiError(res.status, code, errorText(code, data.error));
  }
  return data as T;
}

/** Fetch `path` on mount and whenever it changes; pass null to skip. */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: string }>({ path: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api<T>(path).then(
      (data) => !cancelled && setState({ path, data }),
      (e: Error) => !cancelled && setState({ path, error: e.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const fresh = state.path === path;
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !!path && !fresh,
    reload,
  };
}
